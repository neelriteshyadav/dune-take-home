package api

import (
	"backend/realtime"

	"github.com/gofiber/fiber/v2"
)

var hub = realtime.NewHub()

func Register(r fiber.Router) {
	r.Get("/", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"ok": true, "api": true}) })

	forms := r.Group("/forms")
	forms.Post("/", CreateForm)
	forms.Get("/:id", GetForm)
	forms.Put("/:id", UpdateForm)

	forms.Post("/:id/responses", SubmitResponse)
	forms.Get("/:id/responses", ListResponses)

	// NEW: exports
	forms.Get("/:id/responses/export.csv", ExportResponsesCSV)
	forms.Get("/:id/responses/export.pdf", ExportResponsesPDF)

	forms.Get("/:id/analytics", GetAnalytics)
	forms.Get("/:id/analytics/longpoll", LongPollAnalytics)
}
