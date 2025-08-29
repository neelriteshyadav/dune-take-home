package api

import (
	"backend/db"
	"backend/models"
	"errors"
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func validateAnswers(form models.Form, ans map[string]interface{}) map[string]string {
	errs := map[string]string{}
	fieldByID := map[string]models.Field{}
	for _, f := range form.Fields {
		fieldByID[f.ID] = f
	}

	for _, f := range form.Fields {
		v, present := ans[f.ID]
		// Required checks
		if f.Required {
			switch f.Type {
			case "text":
				s := ""
				if present {
					s, _ = v.(string)
				}
				if s == "" {
					errs[f.ID] = "Required"
					continue
				}
			case "multipleChoice":
				s := ""
				if present {
					s, _ = v.(string)
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

		// Type-specific validation
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
			arr, _ := v.([]interface{})
			// convert to set of strings and ensure all in options
			opt := map[string]struct{}{}
			for _, o := range f.Options {
				opt[o] = struct{}{}
			}
			count := 0
			for _, item := range arr {
				if s, ok := item.(string); ok {
					if _, ok := opt[s]; ok {
						count++
					} else {
						errs[f.ID] = "Invalid option"
						break
					}
				}
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

func SubmitResponse(c *fiber.Ctx) error {
	id := c.Params("id")

	// Load form
	var form models.Form
	if err := db.Forms().FindOne(c.Context(), bson.M{"_id": id}).Decode(&form); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}

	var payload struct {
		Answers map[string]interface{} `json:"answers"`
	}
	if err := c.BodyParser(&payload); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON")
	}
	if payload.Answers == nil {
		return fiber.NewError(fiber.StatusBadRequest, "answers required")
	}

	errs := validateAnswers(form, payload.Answers)
	if len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

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

	// notify long-poll waiters
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

// --- small helper used by analytics endpoints ---
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

var errTimeout = errors.New("timeout")
