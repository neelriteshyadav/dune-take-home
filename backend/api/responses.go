// backend/api/responses.go
package api

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

	"backend/analytics"
	"backend/db"
	"backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/jung-kurt/gofpdf"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// -----------------------------------------------------------------------------
// Validation (server-side, mirrors frontend rules)
// -----------------------------------------------------------------------------

func validateAnswers(form models.Form, ans map[string]interface{}) map[string]string {
	errs := map[string]string{}

	for _, f := range form.Fields {
		v, present := ans[f.ID]

		// Required checks
		if f.Required {
			switch f.Type {
			case "text":
				s := ""
				if present {
					if sv, ok := v.(string); ok {
						s = strings.TrimSpace(sv)
					}
				}
				if s == "" {
					errs[f.ID] = "Required"
					continue
				}
			case "multipleChoice":
				s := ""
				if present {
					if sv, ok := v.(string); ok {
						s = sv
					}
				}
				if s == "" {
					errs[f.ID] = "Required"
					continue
				}
			case "checkboxes":
				ok := false
				if present {
					if arr, ok2 := v.([]interface{}); ok2 {
						ok = len(arr) > 0
					} else if arrS, ok2 := v.([]string); ok2 {
						ok = len(arrS) > 0
					} else if arrA, ok2 := v.(primitive.A); ok2 {
						ok = len(arrA) > 0
					}
				}
				if !ok {
					errs[f.ID] = "Required"
					continue
				}
			case "rating":
				_, ok := v.(float64) // JSON numbers -> float64
				if !ok {
					errs[f.ID] = "Required"
					continue
				}
			}
		}

		// Type-specific rules
		switch f.Type {
		case "text":
			if !present {
				break
			}
			s, _ := v.(string)
			if f.MinLength != nil && len([]rune(s)) < *f.MinLength {
				errs[f.ID] = "Min length not met"
			}
			if f.MaxLength != nil && len([]rune(s)) > *f.MaxLength {
				errs[f.ID] = "Max length exceeded"
			}

		case "multipleChoice":
			if !present || len(f.Options) == 0 {
				break
			}
			s, _ := v.(string)
			ok := false
			for _, o := range f.Options {
				if s == o {
					ok = true
					break
				}
			}
			if !ok {
				errs[f.ID] = "Invalid option"
			}

		case "checkboxes":
			if !present || len(f.Options) == 0 {
				break
			}
			// Build allowed set
			allowed := map[string]struct{}{}
			for _, o := range f.Options {
				allowed[o] = struct{}{}
			}

			count := 0
			switch arr := v.(type) {
			case []interface{}:
				for _, item := range arr {
					if s, ok := item.(string); ok {
						if _, ok := allowed[s]; ok {
							count++
						} else {
							errs[f.ID] = "Invalid option"
							break
						}
					}
				}
			case []string:
				for _, s := range arr {
					if _, ok := allowed[s]; ok {
						count++
					} else {
						errs[f.ID] = "Invalid option"
						break
					}
				}
			case primitive.A:
				for _, item := range arr {
					if s, ok := item.(string); ok {
						if _, ok := allowed[s]; ok {
							count++
						} else {
							errs[f.ID] = "Invalid option"
							break
						}
					}
				}
			default:
				// ignore unsupported types here
			}

			if f.MinChecked != nil && count < *f.MinChecked {
				errs[f.ID] = "Below min selections"
			}
			if f.MaxChecked != nil && count > *f.MaxChecked {
				errs[f.ID] = "Above max selections"
			}

		case "rating":
			if !present {
				break
			}
			scale := 5
			if f.Scale != nil {
				scale = *f.Scale
			}
			min := 0
			if f.Min != nil {
				min = *f.Min
			}
			num, ok := v.(float64)
			if !ok {
				errs[f.ID] = "Invalid rating"
				break
			}
			if int(num) < min || int(num) > scale {
				errs[f.ID] = "Out of range"
			}
		}
	}

	return errs
}

// -----------------------------------------------------------------------------
// Handlers: submit/list responses
// -----------------------------------------------------------------------------

func SubmitResponse(c *fiber.Ctx) error {
	id := c.Params("id")

	// Load form
	var form models.Form
	if err := db.Forms().FindOne(c.Context(), bson.M{"_id": id}).Decode(&form); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}

	// Parse payload
	var payload struct {
		Answers map[string]interface{} `json:"answers"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON")
	}
	if payload.Answers == nil {
		return fiber.NewError(fiber.StatusBadRequest, "answers required")
	}

	// Validate
	errs := validateAnswers(form, payload.Answers)
	if len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	// Insert response
	resp := models.Response{
		ID:          primitive.NewObjectID().Hex(),
		FormID:      id,
		SubmittedAt: time.Now().UTC(),
		Answers:     payload.Answers,
	}
	if _, err := db.Responses().InsertOne(c.Context(), resp); err != nil {
		return err
	}

	// Update form metadata
	now := resp.SubmittedAt
	_, _ = db.Forms().UpdateByID(c.Context(), id, bson.M{
		"$inc": bson.M{"responseCount": 1},
		"$set": bson.M{"lastResponseAt": now, "updatedAt": now},
	})

	// Notify live analytics long-poll waiters
	hub.Notify(id)

	return c.Status(fiber.StatusCreated).JSON(resp)
}

func ListResponses(c *fiber.Ctx) error {
	id := c.Params("id")
	cur, err := db.Responses().Find(c.Context(), bson.M{"formId": id}, nil)
	if err != nil {
		return err
	}
	defer cur.Close(c.Context())

	var resps []models.Response
	if err := cur.All(c.Context(), &resps); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"items": resps})
}

// Helper used by analytics + exports
func loadFormAndResponses(c *fiber.Ctx, id string) (models.Form, []models.Response, error) {
	var form models.Form
	if err := db.Forms().FindOne(c.Context(), bson.M{"_id": id}).Decode(&form); err != nil {
		return models.Form{}, nil, fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	cur, err := db.Responses().Find(c.Context(), bson.M{"formId": id}, nil)
	if err != nil {
		return models.Form{}, nil, err
	}
	defer cur.Close(c.Context())

	var resps []models.Response
	if err := cur.All(c.Context(), &resps); err != nil {
		return models.Form{}, nil, err
	}
	return form, resps, nil
}

// -----------------------------------------------------------------------------
// EXPORTS: CSV + PDF
// -----------------------------------------------------------------------------

var reWS = regexp.MustCompile(`\s+`)

func safeName(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "form"
	}
	s = reWS.ReplaceAllString(s, "_")
	s = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z',
			r >= 'A' && r <= 'Z',
			r >= '0' && r <= '9',
			r == '-', r == '_':
			return r
		default:
			return -1
		}
	}, s)
	return s
}

func toString(v interface{}) string {
	switch t := v.(type) {
	case string:
		return t
	case float64:
		return fmt.Sprintf("%g", t)
	case int:
		return fmt.Sprintf("%d", t)
	case int32:
		return fmt.Sprintf("%d", t)
	case int64:
		return fmt.Sprintf("%d", t)
	default:
		return fmt.Sprintf("%v", t)
	}
}

func joinCheckboxes(v interface{}) string {
	switch arr := v.(type) {
	case []string:
		return strings.Join(arr, "; ")
	case []interface{}:
		out := make([]string, 0, len(arr))
		for _, it := range arr {
			if s, ok := it.(string); ok {
				out = append(out, s)
			}
		}
		return strings.Join(out, "; ")
	case primitive.A:
		out := make([]string, 0, len(arr))
		for _, it := range arr {
			if s, ok := it.(string); ok {
				out = append(out, s)
			}
		}
		return strings.Join(out, "; ")
	default:
		return ""
	}
}

// GET /api/forms/:id/responses/export.csv
func ExportResponsesCSV(c *fiber.Ctx) error {
	id := c.Params("id")
	form, resps, err := loadFormAndResponses(c, id)
	if err != nil {
		return err
	}

	buf := &bytes.Buffer{}
	w := csv.NewWriter(buf)

	// Header: responseId, submittedAt, then each field label (fallback to id)
	header := []string{"responseId", "submittedAt"}
	for _, f := range form.Fields {
		col := f.Label
		if strings.TrimSpace(col) == "" {
			col = f.ID
		}
		header = append(header, col)
	}
	if err := w.Write(header); err != nil {
		return err
	}

	// Rows
	for _, r := range resps {
		row := []string{r.ID, r.SubmittedAt.Format(time.RFC3339)}
		for _, f := range form.Fields {
			v, ok := r.Answers[f.ID]
			if !ok || v == nil {
				row = append(row, "")
				continue
			}
			switch f.Type {
			case "text", "multipleChoice":
				row = append(row, toString(v))
			case "checkboxes":
				row = append(row, joinCheckboxes(v))
			case "rating":
				row = append(row, toString(v))
			default:
				row = append(row, toString(v))
			}
		}
		if err := w.Write(row); err != nil {
			return err
		}
	}
	w.Flush()
	if err := w.Error(); err != nil {
		return err
	}

	filename := fmt.Sprintf("%s_responses.csv", safeName(form.Title))
	c.Attachment(filename)
	c.Type("csv")
	return c.Send(buf.Bytes())
}

// GET /api/forms/:id/responses/export.pdf
func ExportResponsesPDF(c *fiber.Ctx) error {
	id := c.Params("id")
	form, resps, err := loadFormAndResponses(c, id)
	if err != nil {
		return err
	}

	// Build analytics to include distributions
	an := analytics.Compute(form, resps)

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetTitle(fmt.Sprintf("Responses — %s", form.Title), false)
	pdf.AddPage()
	pdf.SetFont("Helvetica", "B", 16)
	pdf.Cell(0, 10, form.Title)
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "", 11)
	pdf.Cell(0, 6, fmt.Sprintf("Responses: %d", len(resps)))
	pdf.Ln(6)
	if form.LastResponseAt != nil {
		pdf.Cell(0, 6, fmt.Sprintf("Last response: %s", form.LastResponseAt.Format(time.RFC1123)))
		pdf.Ln(8)
	} else {
		pdf.Ln(2)
	}

	// Per-field breakdown
	for _, f := range an.PerField {
		pdf.SetFont("Helvetica", "B", 12)
		pdf.Cell(0, 7, f.Label)
		pdf.Ln(6)

		pdf.SetFont("Helvetica", "", 10)
		meta := f.Summary
		if f.Type == "rating" && f.Average != nil && f.Scale != nil {
			meta += fmt.Sprintf(" · avg %.2f / %d", *f.Average, *f.Scale)
		}
		if f.Type == "checkboxes" && f.Average != nil {
			meta += fmt.Sprintf(" · avg selected %.2f", *f.Average)
		}
		pdf.Cell(0, 5, meta)
		pdf.Ln(6)

		// Table header
		pdf.SetFillColor(240, 240, 240)
		pdf.SetFont("Helvetica", "B", 9)
		pdf.CellFormat(110, 6, "Option", "1", 0, "", true, 0, "")
		pdf.CellFormat(30, 6, "Count", "1", 0, "R", true, 0, "")
		pdf.CellFormat(30, 6, "Percent", "1", 0, "R", true, 0, "")
		pdf.Ln(-1)

		// Rows
		total := float64(max(1, f.ResponseN))
		pdf.SetFont("Helvetica", "", 9)
		for _, b := range f.Bars {
			pct := (float64(b.Value) / total) * 100.0
			label := b.Label
			if label == "" {
				label = "-"
			}
			pdf.CellFormat(110, 6, label, "1", 0, "", false, 0, "")
			pdf.CellFormat(30, 6, fmt.Sprintf("%d", b.Value), "1", 0, "R", false, 0, "")
			pdf.CellFormat(30, 6, fmt.Sprintf("%.0f%%", pct), "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
		pdf.Ln(4)
	}

	// Raw responses page (IDs + timestamps)
	pdf.AddPage()
	pdf.SetFont("Helvetica", "B", 12)
	pdf.Cell(0, 8, "Responses")
	pdf.Ln(8)
	pdf.SetFont("Helvetica", "", 9)

	// sort by SubmittedAt desc
	sort.Slice(resps, func(i, j int) bool { return resps[i].SubmittedAt.After(resps[j].SubmittedAt) })
	for _, r := range resps {
		pdf.CellFormat(60, 6, r.ID, "0", 0, "", false, 0, "")
		pdf.CellFormat(0, 6, r.SubmittedAt.Format(time.RFC1123), "0", 0, "", false, 0, "")
		pdf.Ln(5)
	}

	var out bytes.Buffer
	if err := pdf.Output(&out); err != nil {
		return err
	}

	filename := fmt.Sprintf("%s_responses.pdf", safeName(form.Title))
	c.Attachment(filename)
	c.Type("pdf")
	return c.Send(out.Bytes())
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
