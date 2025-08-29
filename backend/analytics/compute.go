package analytics

import (
	"backend/models"
)

type Bar struct {
	Label string `json:"label"`
	Value int    `json:"value"`
}

type FieldAnalytics struct {
	FieldID   string   `json:"fieldId"`
	Label     string   `json:"label"`
	Type      string   `json:"type"`
	Summary   string   `json:"summary"`
	Bars      []Bar    `json:"bars"`              // distributions
	Average   *float64 `json:"average,omitempty"` // rating avg or avg selected for checkboxes
	Scale     *int     `json:"scale,omitempty"`   // rating scale
	ResponseN int      `json:"responseN"`
}

type Analytics struct {
	FormID         string           `json:"formId"`
	ResponseCount  int64            `json:"responseCount"`
	LastResponseMs int64            `json:"lastResponseMs"`
	PerField       []FieldAnalytics `json:"perField"`
}

func Compute(form models.Form, responses []models.Response) Analytics {
	per := make([]FieldAnalytics, 0, len(form.Fields))

	// pre-index answers per field
	fieldMap := map[string]models.Field{}
	for _, f := range form.Fields {
		fieldMap[f.ID] = f
	}

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
			counts := map[string]int{}
			for _, o := range f.Options {
				counts[o] = 0
			}
			other := 0
			for _, v := range vals {
				if s, ok := v.(string); ok {
					if _, ok := counts[s]; ok {
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
			counts := map[string]int{}
			for _, o := range f.Options {
				counts[o] = 0
			}
			totalSelected := 0
			for _, v := range vals {
				if arr, ok := v.([]interface{}); ok {
					totalSelected += len(arr)
					for _, item := range arr {
						if s, ok := item.(string); ok {
							if _, ok := counts[s]; ok {
								counts[s]++
							}
						}
					}
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
			scale := 5
			if f.Scale != nil && *f.Scale > 0 && *f.Scale <= 10 {
				scale = *f.Scale
			}
			buckets := make([]int, scale)
			sum := 0.0
			n := 0
			for _, v := range vals {
				switch vv := v.(type) {
				case float64: // JSON numbers decode to float64
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
				case int32, int64, int:
					r := int(vv.(int))
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
				an.Bars = append(an.Bars, Bar{Label: string(rune('0' + i + 1)), Value: c})
			}
			if n > 0 {
				avg := sum / float64(n)
				an.Average = &avg
			}
			an.Scale = &scale
			an.Summary = "Rating"
		default: // text -> length histogram
			bins := []struct {
				label  string
				lo, hi int
			}{
				{"0–20", 0, 20}, {"21–50", 21, 50}, {"51–100", 51, 100},
				{"101–200", 101, 200}, {"200+", 201, 1 << 30},
			}
			counts := make([]int, len(bins))
			for _, v := range vals {
				s := ""
				if sv, ok := v.(string); ok {
					s = sv
				}
				l := len([]rune(s))
				for i, b := range bins {
					if l >= b.lo && l <= b.hi {
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
