# bm-lh-react

BM-Lastheard React re-implementation with PostgreSQL database backend.

## Overview

This is a full-stack application for monitoring Brandmeister (BM) DMR network activity. It displays real-time "Last Heard" information about radio transmissions on the Brandmeister network.

## Technology Stack

### Frontend
- React 18 with TypeScript
- Create React App
- Responsive CSS design

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- RESTful API
- Email service with SMTP support
- User authentication and session management

### DevOps
- Docker & Docker Compose
- Nginx (for production frontend)

## Project Structure

```
bm-lh-react/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main application component
│   ├── Dockerfile         # Frontend Docker configuration
│   └── nginx.conf         # Nginx configuration for production
│
├── backend/               # Node.js/Express backend API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   └── server.ts      # Express server
│   ├── database/          # Database schemas
│   └── Dockerfile         # Backend Docker configuration
│
└── docker-compose.yml     # Docker orchestration
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (or use Docker)
- Docker and Docker Compose (optional, for containerized deployment)

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/ea7klk/bm-lh-react.git
cd bm-lh-react
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

### Manual Setup

#### Database Setup

1. Create PostgreSQL database:
```bash
createdb bm_lastheard
```

2. Initialize the schema:
```bash
psql -d bm_lastheard -f backend/database/schema.sql
```

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
```
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/bm_lastheard
NODE_ENV=development
```

5. Start the development server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm start
```

The application will open at http://localhost:3000

## Email Service Configuration

The application includes a comprehensive email service for user authentication. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed configuration instructions.

### Quick Email Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Configure email in `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

3. For development, keep `EMAIL_ENABLED=false` to log emails to console instead.

## Authentication Features

- **User Registration**: Ham radio callsign-based registration with email verification
- **Email Verification**: Secure token-based email confirmation
- **Password Reset**: Email-based password recovery system
- **Email Change**: Secure email address update with confirmation
- **Session Management**: Secure session-based authentication
- **Multi-language Support**: Authentication forms in EN/ES/DE/FR

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify/:token` - Email verification
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset
- `POST /api/auth/email-change` - Request email change
- `POST /api/auth/email-change/confirm/:token` - Confirm email change
- `GET /api/auth/profile` - Get user profile

### Last Heard

- `GET /api/lastheard` - Get list of last heard entries
  - Query params: `limit` (default: 50), `offset` (default: 0)
  
- `GET /api/lastheard/:id` - Get specific entry by ID

- `POST /api/lastheard` - Create new entry (for data ingestion)

### Health Check

- `GET /health` - API health status

## Database Schema

The `last_heard` table stores DMR transmission information:

- `id` - Unique identifier
- `callsign` - Radio callsign
- `name` - Operator name
- `dmr_id` - DMR ID number
- `target_id` - Target talk group or reflector ID
- `target_name` - Target name
- `source` - Network source (e.g., "BM Master")
- `duration` - Transmission duration in seconds
- `timestamp` - Time of transmission
- `slot` - Time slot (1 or 2)
- `reflector` - Reflector number

## Development

### Backend Development

```bash
cd backend
npm run dev  # Start with hot reload
npm run build  # Build TypeScript
npm start  # Run production build
```

### Frontend Development

```bash
cd frontend
npm start  # Start development server
npm test  # Run tests
npm run build  # Create production build
```

## Production Deployment

1. Build and start containers:
```bash
docker-compose up -d --build
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop services:
```bash
docker-compose down
```

## Features

- ✅ Real-time last heard data display
- ✅ Automatic refresh every 30 seconds
- ✅ Responsive design for mobile and desktop
- ✅ RESTful API with pagination
- ✅ PostgreSQL database with indexed queries
- ✅ Docker support for easy deployment
- ✅ TypeScript for type safety

## Future Enhancements

- WebSocket support for real-time updates
- Advanced filtering and search
- User authentication and favorites
- Charts and statistics
- Export functionality

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

For questions or support, please open an issue on GitHub.
