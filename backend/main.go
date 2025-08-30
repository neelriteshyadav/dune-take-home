package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"backend/api"
	"backend/db"
)

func main() {
	_ = godotenv.Load()

	if err := db.Connect(os.Getenv("MONGODB_URI"), os.Getenv("DB_NAME")); err != nil {
		log.Fatal(err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = db.Client().Disconnect(ctx)
	}()

	app := fiber.New(fiber.Config{
		AppName: "Form Builder API",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			log.Printf("ERROR %d %s %v", code, c.Path(), err)
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	allowed := os.Getenv("ALLOWED_ORIGINS")
	if allowed == "" {
		allowed = "http://localhost:3000"
	}

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // change to your frontend origin in prod
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))

	app.Get("/", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"ok": true}) })
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "ts": time.Now().UTC()})
	})

	api.Register(app.Group("/api"))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Form Builder API listening on :%s", port)
	log.Fatal(app.Listen(":" + port))
}
