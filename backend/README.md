# Backend

This is the backend for the Form Builder application, built with Go and the Fiber web framework.

## Getting Started

To get the backend running locally:

1.  **Install dependencies:**
    ```bash
    go mod tidy
    ```

2.  **Create a `.env` file:**
    Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    MONGODB_URI=<your_mongodb_connection_string>
    DB_NAME=<your_database_name>
    CORS_ORIGIN=http://localhost:3000
    ```

3.  **Run the server:**
    ```bash
    go run main.go
    ```

    The server will be running at `http://localhost:8080`.

## Technologies Used

*   **Language:** [Go](https://golang.org/)
*   **Web Framework:** [Fiber](https://gofiber.io/)
*   **Database:** [MongoDB](https://www.mongodb.com/)
*   **Go Driver for MongoDB:** [mongo-go-driver](https://github.com/mongodb/mongo-go-driver)
