package models

import "time"

// FieldType: "text" | "multipleChoice" | "checkboxes" | "rating"
type Field struct {
	ID          string   `bson:"id" json:"id"`
	Label       string   `bson:"label" json:"label"`
	Type        string   `bson:"type" json:"type"`
	Required    bool     `bson:"required" json:"required"`
	Placeholder *string  `bson:"placeholder,omitempty" json:"placeholder,omitempty"`
	MinLength   *int     `bson:"minLength,omitempty" json:"minLength,omitempty"`
	MaxLength   *int     `bson:"maxLength,omitempty" json:"maxLength,omitempty"`
	Options     []string `bson:"options,omitempty" json:"options,omitempty"`
	MinChecked  *int     `bson:"minChecked,omitempty" json:"minChecked,omitempty"`
	MaxChecked  *int     `bson:"maxChecked,omitempty" json:"maxChecked,omitempty"`
	Scale       *int     `bson:"scale,omitempty" json:"scale,omitempty"` // rating
	Min         *int     `bson:"min,omitempty" json:"min,omitempty"`     // rating min
}

type Form struct {
	ID             string     `bson:"_id" json:"id"`
	Title          string     `bson:"title" json:"title"`
	Fields         []Field    `bson:"fields" json:"fields"`
	CreatedAt      time.Time  `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time  `bson:"updatedAt" json:"updatedAt"`
	ResponseCount  int64      `bson:"responseCount" json:"responseCount"`
	LastResponseAt *time.Time `bson:"lastResponseAt,omitempty" json:"lastResponseAt,omitempty"`
}
