package api

import (
	"backend/analytics"
	"backend/db"
	"backend/models"
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func GetAnalytics(c *fiber.Ctx) error {
	id := c.Params("id")
	form, resps, err := loadFormAndResponses(c, id)
	if err != nil {
		return err
	}
	an := analytics.Compute(form, resps)
	return c.JSON(an)
}

// Long-poll analytics:
// Client sends ?since=<ms_unix>. Server returns updated analytics when
// form.LastResponseAt.UnixMilli() > since OR timeout (~25s).
func LongPollAnalytics(c *fiber.Ctx) error {
	id := c.Params("id")
	sinceStr := c.Query("since", "0")
	sinceMs, _ := strconv.ParseInt(sinceStr, 10, 64)

	// Quick check: if already newer, return immediately
	var form models.Form
	if err := db.Forms().FindOne(c.Context(), bson.M{"_id": id}).Decode(&form); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	current := int64(0)
	if form.LastResponseAt != nil {
		current = form.LastResponseAt.UnixMilli()
	}
	if current > sinceMs {
		// Compute and return
		cur, _ := db.Responses().Find(c.Context(), bson.M{"formId": id})
		var resps []models.Response
		_ = cur.All(c.Context(), &resps)
		an := analytics.Compute(form, resps)
		return c.JSON(an)
	}

	// Wait for up to 25s (or until request canceled)
	ctx, cancel := context.WithTimeout(c.Context(), 25*time.Second)
	defer cancel()
	if err := hub.Wait(ctx, id, 25*time.Second); err != nil {
		// timeout -> tell client to poll again
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"timeout": true, "lastResponseMs": current})
	}

	// Something changed, reload and reply
	if err := db.Forms().FindOne(c.Context(), bson.M{"_id": id}).Decode(&form); err != nil {
		return fiber.NewError(fiber.StatusNotFound, "form not found")
	}
	cur, _ := db.Responses().Find(c.Context(), bson.M{"formId": id})
	var resps []models.Response
	_ = cur.All(c.Context(), &resps)
	an := analytics.Compute(form, resps)
	return c.JSON(an)
}
