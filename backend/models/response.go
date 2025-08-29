package models

import "time"

type Response struct {
	ID          string                 `bson:"_id" json:"id"`
	FormID      string                 `bson:"formId" json:"formId"`
	SubmittedAt time.Time              `bson:"submittedAt" json:"submittedAt"`
	Answers     map[string]interface{} `bson:"answers" json:"answers"`
}
