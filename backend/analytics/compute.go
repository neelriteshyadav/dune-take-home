package analytics

import (
	"backend/models"
	"strconv"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ---------- Public payloads returned to the frontend ----------

type Bar struct {
	Label string `json:"label"`
	Value int    `json:"value"`
}

type FieldAnalytics struct {
	FieldID   string   `json:"fieldId"`
	Label     string   `json:"label"`
	Type      string   `json:"type"`
	Summary   string   `json:"summary"`
	Bars      []Bar    `json:"bars"`
	Average   *float64 `json:"average,omitempty"` // rating avg or avg selected for checkboxes
	Scale     *int     `json:"scale,omitempty"`   // rating scale (for ratings)
	ResponseN int      `json:"responseN"`
}

type Analytics struct {
	FormID         string           `json:"formId"`
	ResponseCount  int64            `json:"responseCount"`
	LastResponseMs int64            `json:"lastResponseMs"`
	PerField       []FieldAnalytics `json:"perField"`
}

// ---------- Compute aggregates from a form + its responses ----------

func Compute(form models.Form, responses []models.Response) Analytics {
	per := make([]FieldAnalytics, 0, len(form.Fields))

	// Gather values per field ID
	answersByField := map[string][]interface{}{}
	for _, r := range responses {
		for k, v := range r.Answers {
			answersByField[k] = append(answersByField[k], v)
		}
	}

	for _, f := range form.Fields {
		vals := answersByField[f.ID]
		an := FieldAnalytics{
			FieldID:   f.ID,
			Label:     f.Label,
			Type:      f.Type,
			ResponseN: len(vals),
			Bars:      []Bar{},
		}

		switch f.Type {
		case "multipleChoice":
			// Count each selected option; bucket unknowns into "Other"
			counts := map[string]int{}
			for _, o := range f.Options {
				counts[o] = 0
			}
			other := 0
			for _, v := range vals {
				if s, ok := v.(string); ok {
					if _, exists := counts[s]; exists {
						counts[s]++
					} else {
						other++
					}
				}
			}
			for _, o := range f.Options {
				an.Bars = append(an.Bars, Bar{Label: o, Value: counts[o]})
			}
			if other > 0 {
				an.Bars = append(an.Bars, Bar{Label: "Other", Value: other})
			}
			an.Summary = "Multiple choice"

		case "checkboxes":
			// Count each option across arrays. Handle []interface{}, []string, primitive.A.
			counts := map[string]int{}
			for _, o := range f.Options {
				counts[o] = 0
			}
			totalSelected := 0

			for _, v := range vals {
				switch arr := v.(type) {
				case []interface{}:
					totalSelected += len(arr)
					for _, item := range arr {
						if s, ok := item.(string); ok {
							if _, exists := counts[s]; exists {
								counts[s]++
							}
						}
					}
				case []string:
					totalSelected += len(arr)
					for _, s := range arr {
						if _, exists := counts[s]; exists {
							counts[s]++
						}
					}
				case primitive.A:
					totalSelected += len(arr)
					for _, item := range arr {
						if s, ok := item.(string); ok {
							if _, exists := counts[s]; exists {
								counts[s]++
							}
						}
					}
				default:
					// ignore other types
				}
			}

			for _, o := range f.Options {
				an.Bars = append(an.Bars, Bar{Label: o, Value: counts[o]})
			}
			if an.ResponseN > 0 {
				avg := float64(totalSelected) / float64(an.ResponseN)
				an.Average = &avg
			}
			an.Summary = "Checkboxes"

		case "rating":
			// Bucket by 1..scale, compute average
			scale := 5
			if f.Scale != nil && *f.Scale > 0 && *f.Scale <= 10 {
				scale = *f.Scale
			}
			buckets := make([]int, scale)
			sum := 0.0
			n := 0

			for _, v := range vals {
				switch vv := v.(type) {
				case float64:
					r := int(vv + 0.5)
					if r < 1 {
						r = 1
					}
					if r > scale {
						r = scale
					}
					buckets[r-1]++
					sum += float64(r)
					n++
				case int:
					r := vv
					if r < 1 {
						r = 1
					}
					if r > scale {
						r = scale
					}
					buckets[r-1]++
					sum += float64(r)
					n++
				case int32:
					r := int(vv)
					if r < 1 {
						r = 1
					}
					if r > scale {
						r = scale
					}
					buckets[r-1]++
					sum += float64(r)
					n++
				case int64:
					r := int(vv)
					if r < 1 {
						r = 1
					}
					if r > scale {
						r = scale
					}
					buckets[r-1]++
					sum += float64(r)
					n++
				}
			}

			for i, c := range buckets {
				an.Bars = append(an.Bars, Bar{Label: strconv.Itoa(i + 1), Value: c})
			}
			if n > 0 {
				avg := sum / float64(n)
				an.Average = &avg
			}
			an.Scale = &scale
			an.Summary = "Rating"

		default: // text: length distribution
			bins := []struct {
				label     string
				lo, hiInt int
			}{
				{"0–20", 0, 20},
				{"21–50", 21, 50},
				{"51–100", 51, 100},
				{"101–200", 101, 200},
				{"200+", 201, 1 << 30},
			}
			counts := make([]int, len(bins))
			for _, v := range vals {
				s, _ := v.(string)
				l := len([]rune(s))
				for i, b := range bins {
					if l >= b.lo && l <= b.hiInt {
						counts[i]++
						break
					}
				}
			}
			for i, b := range bins {
				an.Bars = append(an.Bars, Bar{Label: b.label, Value: counts[i]})
			}
			an.Summary = "Text"
		}

		per = append(per, an)
	}

	lastMs := int64(0)
	if form.LastResponseAt != nil {
		lastMs = form.LastResponseAt.UnixMilli()
	}

	return Analytics{
		FormID:         form.ID,
		ResponseCount:  form.ResponseCount,
		LastResponseMs: lastMs,
		PerField:       per,
	}
}
