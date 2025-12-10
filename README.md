# ProjectFlow - Jira-like Project Management Tool

A full-stack project management application with meeting scheduling, built with React, Node.js, and SQLite.

## Features

- **Project Management**: Create, update, and delete projects with custom colors and keys
- **Ticket/Issue Tracking**: Full CRUD operations for tickets with types (Task, Bug, Story, Epic)
- **Kanban Board**: Drag-and-drop board for visual task management
- **Meeting Scheduling**: Schedule meetings with participants, send invitations, accept/decline
- **Dashboard**: Overview of tasks, upcoming meetings, and project activity
- **Real-time Updates**: WebSocket integration for live updates
- **Authentication**: JWT-based authentication with secure login/registration
- **Comments & Activity**: Add comments to tickets, track all activity

## Tech Stack

### Frontend 
- React 18 with Vite
- TailwindCSS for styling
- React Router for navigation
- @hello-pangea/dnd for drag-and-drop
- React Hot Toast for notifications
- React DatePicker for date selection
- Recharts for statistics

### Backend
- Node.js with Express
- SQLite with better-sqlite3 (no external database needed)
- JWT for authentication
- WebSocket for real-time updates
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd projectflow
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the Database**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start the Backend Server**
   ```bash
   npm run dev
   ```
   The backend will run on http://localhost:5000

5. **Install Frontend Dependencies** (in a new terminal)
   ```bash
   cd frontend
   npm install
   ```

6. **Start the Frontend**
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:3000

### Demo Credentials

After running the seed command, you can login with:

- **Admin**: admin@projectflow.com / password123
- **User 1**: john@projectflow.com / password123
- **User 2**: jane@projectflow.com / password123

## Project Structure

```
projectflow/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth & error handling
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   ├── websocket/       # WebSocket handlers
│   │   └── index.js         # Entry point
│   ├── migrations/          # Database migrations & seeds
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── common/      # Shared components
│   │   │   ├── dashboard/   # Layout, Sidebar
│   │   │   └── kanban/      # Kanban board
│   │   ├── context/         # React Context providers
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API & WebSocket
│   │   ├── styles/          # CSS files
│   │   └── utils/           # Helper functions
│   ├── public/              # Static files
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/users` - List all users

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tickets
- `GET /api/tickets` - List tickets (with filters)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `PUT /api/tickets/:id/move` - Move ticket (Kanban)
- `GET /api/tickets/kanban/:projectId` - Get Kanban board
- `POST /api/tickets/:id/comments` - Add comment

### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Schedule meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Cancel meeting
- `POST /api/meetings/:id/respond` - Accept/Decline invitation

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/activity` - Get activity feed

### Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Free Deployment Options

### Backend (Choose one)
- **Railway.app** - Free tier with SQLite support
- **Render.com** - Free tier, sleeps after inactivity
- **Fly.io** - Free tier with persistent storage
- **Cyclic.sh** - Serverless, free tier

### Frontend (Choose one)
- **Vercel** - Best for React apps, free tier
- **Netlify** - Great free hosting
- **Cloudflare Pages** - Unlimited free bandwidth

### Database
The app uses SQLite which stores data in a file. For production:
- Most platforms support persistent storage for SQLite
- Alternatively, migrate to Turso (free tier) or PlanetScale (MySQL, free)

## Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=/api
VITE_WS_URL=ws://localhost:5000
```

## License

MIT License - Feel free to use this project for your portfolio!
