package db

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var dbName string

func Connect(uri, name string) error {
	if uri == "" {
		uri = "mongodb://localhost:27017"
	}
	if name == "" {
		return errors.New("DB_NAME not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	c, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}
	if err := c.Ping(ctx, nil); err != nil {
		return err
	}
	client = c
	dbName = name

	// Indexes
	Forms().Indexes().CreateOne(ctx, mongo.IndexModel{Keys: map[string]int{"updatedAt": -1}})
	Responses().Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    map[string]int{"formId": 1, "submittedAt": -1},
		Options: options.Index().SetBackground(true),
	})
	return nil
}

func Client() *mongo.Client { return client }

func DB() *mongo.Database {
	return client.Database(dbName)
}

func Forms() *mongo.Collection {
	return DB().Collection("forms")
}

func Responses() *mongo.Collection {
	return DB().Collection("responses")
}
