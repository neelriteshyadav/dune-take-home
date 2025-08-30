# Frontend

This is the frontend for the Form Builder application, built with Next.js, React, and Tailwind CSS.

## Getting Started

To get the frontend running locally:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Create a `.env.local` file:**
    Create a `.env.local` file in the `frontend` directory and add the following environment variable:
    ```
    NEXT_PUBLIC_API_BASE=http://localhost:8080
    ```
    This should point to the local backend server.

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Technologies Used

*   **Framework:** [Next.js](https://nextjs.org/)
*   **UI Library:** [React](https://reactjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Charting:** [Chart.js](https://www.chartjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)