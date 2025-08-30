# Form Builder

A full-stack form builder application with a React-based frontend and a Go backend. This project allows users to create custom forms, share them with others, and view real-time analytics of the responses.

## Live Demo

*   **Frontend (Vercel):** [https://dune-take-home.vercel.app/](https://dune-take-home.vercel.app/)
*   **Backend (Render):** [https://dune-take-home-backend.onrender.com](https://dune-take-home-backend.onrender.com)

## Local Setup

To set up the project locally, you will need to have Node.js and Go installed.

### Backend

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    go mod tidy
    ```

3.  **Create a `.env` file:**
    Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    MONGODB_URI=<your_mongodb_connection_string>
    DB_NAME=<your_database_name>
    CORS_ORIGIN=http://localhost:3000
    ```

4.  **Run the backend server:**
    ```bash
    go run main.go
    ```
    The backend will be running at `http://localhost:8080`.

### Frontend

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env.local` file:**
    Create a `.env.local` file in the `frontend` directory and add the following environment variable:
    ```
    NEXT_PUBLIC_API_BASE=http://localhost:8080
    ```

4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:3000`.

## Assumptions and Challenges

### Assumptions

*   **MongoDB:** I assumed that MongoDB would be a suitable database for this project due to its flexible schema, which is well-suited for storing form data and responses.
*   **Real-time Analytics:** I assumed that a long-polling approach would be sufficient for the real-time analytics feature, providing a good balance between real-time updates and server resources.

### Challenges

*   **Deployment:** The initial deployment to Render failed due to the MongoDB Atlas IP access list not being configured to allow connections from Render's IP addresses. This was resolved by adding `0.0.0.0/0` to the IP access list.
*   **TypeScript Errors:** The Vercel deployment initially failed due to a TypeScript type mismatch in the frontend code. This was resolved by correcting the props passed to the `AnalyticsDashboard` component and ensuring the component was treated as a client-side component.

## Testing Real-time Analytics

1.  **Open the form builder** and create a new form.
2.  **Add a few fields** to the form and save it.
3.  **Open the analytics page** for the form.
4.  **In a separate browser window or tab, open the form** using the shareable link.
5.  **Submit a few responses** to the form.
6.  **Observe the analytics page.** The response count and field-level analytics should update in real-time without needing to refresh the page.