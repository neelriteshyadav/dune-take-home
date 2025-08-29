package api

import (
	"backend/db"
	"backend/models"
	"context"
	"errors"
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

type formPayload struct {
	Title  string         `json:"title"`
	Fields []models.Field `json:"fields"`
}

func validateField(f models.Field) error {
	if f.ID == "" || f.Label == "" || f.Type == "" {
		return errors.New("field must have id, label, and type")
	}
	switch f.Type {
	case "text":
		if f.MinLength != nil && *f.MinLength < 0 {
			return errors.New("minLength must be >= 0")
		}
		if f.MaxLength != nil && *f.MaxLength < 0 {
			return errors.New("maxLength must be >= 0")
		}
		if f.MinLength != nil && f.MaxLength != nil && *f.MinLength > *f.MaxLength {
			return errors.New("minLength cannot exceed maxLength")
		}
	case "multipleChoice":
		if len(f.Options) == 0 {
			return errors.New("multipleChoice requires options")
		}
	case "checkboxes":
		if len(f.Options) == 0 {
			return errors.New("checkboxes requires options")
		}
		if f.MinChecked != nil && *f.MinChecked < 0 {
			return errors.New("minChecked must be >= 0")
		}
		if f.MaxChecked != nil && *f.MaxChecked < 0 {
			return errors.New("maxChecked must be >= 0")
		}
		if f.MinChecked != nil && f.MaxChecked != nil && *f.MinChecked > *f.MaxChecked {
			return errors.New("minChecked cannot exceed maxChecked")
		}
	case "rating":
		scale := 5
		if f.Scale != nil {
			scale = *f.Scale
		}
		if scale < 1 || scale > 10 {
			return errors.New("rating scale must be 1..10")
		}
		if f.Min != nil && *f.Min < 0 {
			return errors.New("rating min must be >= 0")
		}
	default:
		return errors.New("unknown field type")
	}
	return nil
}

func validateFormPayload(p formPayload) error {
	if p.Title == "" {
		return errors.New("title required")
	}
	if len(p.Fields) == 0 {
		return errors.New("fields required")
	}
	for _, f := range p.Fields {
		if err := validateField(f); err != nil {
			return err
		}
	}
	return nil
}

func CreateForm(c *fiber.Ctx) error {
	var p formPayload
	if err := c.BodyParser(&p); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON")
	}
	if err := validateFormPayload(p); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	now := time.Now().UTC()
	id := primitive.NewObjectID().Hex()
	form := models.Form{
		ID:            id,
		Title:         p.Title,
		Fields:        p.Fields,
		CreatedAt:     now,
		UpdatedAt:     now,
		ResponseCount: 0,
	}

	if _, err := db.Forms().InsertOne(c.Context(), form); err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(form)
}

func GetForm(c *fiber.Ctx) error {
	id := c.Params("id")
	var form models.Form
	if err := db.Forms().FindOne(c.Context(), bson.M{"_id": id}).Decode(&form); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	return c.JSON(form)
}

func UpdateForm(c *fiber.Ctx) error {
	id := c.Params("id")
	var p formPayload
	if err := c.BodyParser(&p); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON")
	}
	if err := validateFormPayload(p); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	now := time.Now().UTC()
	update := bson.M{
		"$set": bson.M{"title": p.Title, "fields": p.Fields, "updatedAt": now},
	}
	res := db.Forms().FindOneAndUpdate(c.Context(), bson.M{"_id": id}, update, nil)
	if res.Err() != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	var form models.Form
	if err := db.Forms().FindOne(context.Background(), bson.M{"_id": id}).Decode(&form); err != nil {
		return err
	}
	return c.JSON(form)
}
