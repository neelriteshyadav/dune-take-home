<!-- @format -->

# Form Builder Application

A dynamic, customizable form builder application that allows users to create forms, collect responses, and view live analytics about the responses in real time.

## Features

- **Dynamic Form Builder**: Create custom forms with various field types
- **Real-time Analytics**: Live dashboard showing form responses and insights
- **Flexible Data Storage**: MongoDB-based storage for forms and responses
- **Modern UI**: Built with Next.js and TailwindCSS
- **RESTful API**: Go Fiber backend for handling form operations

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **React Hook Form** - Form handling and validation

### Backend

- **Go** - High-performance server language
- **Fiber** - Fast HTTP web framework
- **MongoDB Driver** - Official Go MongoDB driver

### Database

- **MongoDB** - NoSQL database for flexible data storage
- **Mongo Express** - Web-based MongoDB admin interface

## Project Structure

```
dune-take-home/
├── frontend/           # Next.js frontend application
├── backend/            # Go Fiber backend API
├── docker-compose.yml  # MongoDB and Mongo Express setup
├── mongo-init.js      # MongoDB initialization script
└── README.md          # This file
```

## Prerequisites

- **Node.js** (v18 or higher)
- **Go** (v1.21 or higher)
- **Docker** and **Docker Compose**
- **Git**

## Setup Instructions

### 1. Clone and Navigate to Project

```bash
cd dune-take-home
```

### 2. Start MongoDB

```bash
docker-compose up -d
```

This will start:

- MongoDB on port 27017
- Mongo Express (admin interface) on port 8081

**Access Mongo Express**: http://localhost:8081

- Username: `admin`
- Password: `password`

### 3. Setup Backend

```bash
cd backend

# Install Go dependencies
go mod tidy

# Run the server
go run main.go
```

The backend will start on port 8080.

**API Endpoints**:

- `GET /` - Health check
- `GET /health` - Server status

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on port 3000.

**Frontend URL**: http://localhost:3000

## Environment Variables

### Backend (.env)

```
PORT=8080
MONGODB_URI=mongodb://localhost:27017
DB_NAME=form_builder
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Development

### Backend Development

- The Go server automatically reloads when you make changes
- MongoDB connection is established on startup
- CORS is configured to allow frontend requests

### Frontend Development

- Hot reloading enabled
- TypeScript compilation
- TailwindCSS with JIT compilation

## Database Schema

### Forms Collection

```json
{
	"_id": "ObjectId",
	"title": "string",
	"description": "string",
	"fields": [
		{
			"id": "string",
			"type": "text|email|textarea|select|checkbox|radio",
			"label": "string",
			"required": "boolean",
			"placeholder": "string",
			"options": ["array of options for select/radio"]
		}
	],
	"settings": {
		"allowMultipleResponses": "boolean",
		"requireAuthentication": "boolean",
		"theme": "string"
	},
	"created_at": "Date",
	"updated_at": "Date",
	"user_id": "string"
}
```

### Responses Collection

```json
{
	"_id": "ObjectId",
	"form_id": "ObjectId",
	"data": {
		"field_id": "response_value"
	},
	"submitted_at": "Date",
	"user_agent": "string",
	"ip_address": "string"
}
```

## Next Steps

1. **Form Builder Interface**: Create the drag-and-drop form builder
2. **Form Rendering**: Build dynamic form renderer
3. **Response Collection**: Implement form submission handling
4. **Analytics Dashboard**: Create real-time response visualization
5. **User Authentication**: Add user management system
6. **Real-time Updates**: Implement WebSocket connections for live updates

## Troubleshooting

### MongoDB Connection Issues

- Ensure Docker is running
- Check if ports 27017 and 8081 are available
- Verify MongoDB container is healthy: `docker-compose ps`

### Go Dependencies

- Run `go mod tidy` to clean up dependencies
- Ensure Go version is 1.21 or higher

### Frontend Issues

- Clear `.next` folder and restart: `rm -rf .next && npm run dev`
- Check Node.js version: `node --version`

## License

This project is part of the Dune take-home assignment.
