# QueSkip Backend API

A robust Node.js Express API server for the QueSkip queue management system. This backend serves both the mobile app and business dashboard, providing comprehensive queue management, user authentication, business management, and real-time communication features.

## 🚀 Features

### Authentication & User Management
- **User Registration & Login** - Complete authentication flow with JWT tokens
- **Email Verification** - Token-based email verification system
- **Password Management** - Secure password hashing, reset, and change functionality
- **Profile Management** - User profile creation and updates
- **Referral System** - Built-in referral tracking and rewards

### Queue Management
- **Real-time Queues** - Join, leave, and track queue positions
- **Business Integration** - Multi-business queue support
- **Wait Time Estimation** - Intelligent wait time calculations
- **Queue Status Tracking** - Comprehensive status management (waiting, notified, completed)

### Business Features
- **Business Registration** - Complete business onboarding
- **Location Services** - GPS-based business discovery
- **Category Management** - Multiple business categories support
- **Operating Hours** - Flexible scheduling system

### Communication
- **Real-time Messaging** - User-business communication
- **Push Notifications** - Queue updates and notifications
- **Review System** - Business rating and review management

## 🏗️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, CORS, rate limiting
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Validation**: express-validator

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AwaisMuhammad13/QueSkip-Server.git
   cd QueSkip-Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=queskip_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   
   # JWT Secrets
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb queskip_db
   
   # Run schema (choose the corrected version)
   psql -d queskip_db -f scripts/schema-corrected.sql
   ```

5. **Build and Start**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit:
- **API Documentation**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 🔐 Authentication Flow

The API supports the complete mobile app authentication flow:

### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890",
  "referralCode": "OPTIONAL123"
}
```

### 2. Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

### 3. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### 4. Access Protected Routes
```http
GET /api/auth/profile
Authorization: Bearer your-jwt-token
```

## 🏢 Business Endpoints

### Business Registration
```http
POST /api/businesses/register
```

### Search Businesses
```http
GET /api/businesses/search?latitude=40.7128&longitude=-74.0060&radius=5
```

## 🏃‍♀️ Queue Management

### Join Queue
```http
POST /api/queues/join
Authorization: Bearer your-jwt-token

{
  "businessId": "business-uuid"
}
```

### Get Queue Status
```http
GET /api/queues/status/:queueId
Authorization: Bearer your-jwt-token
```

## 📂 Project Structure

```
QueSkip-Backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point
│   ├── config/
│   │   └── database.ts     # Database configuration
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts
│   │   ├── businessController.ts
│   │   ├── queueController.ts
│   │   └── reviewController.ts
│   ├── middleware/         # Custom middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   │   ├── authRoutes.ts
│   │   ├── businessRoutes.ts
│   │   ├── queueRoutes.ts
│   │   └── reviewRoutes.ts
│   ├── services/          # Business logic
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   └── utils/             # Utility functions
│       └── index.ts
├── scripts/
│   ├── schema.sql         # Original database schema
│   └── schema-corrected.sql # Corrected schema (use this one)
├── .env.example           # Environment variables template
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure access and refresh token system
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Cross-origin request handling
- **Security Headers**: Helmet.js security headers
- **Account Lockout**: Failed login attempt protection

## 🧪 Testing

The backend has been tested with all authentication endpoints:
- ✅ User registration and login
- ✅ Email verification workflow
- ✅ Token refresh and logout
- ✅ Password reset functionality
- ✅ Profile management
- ✅ Error handling and validation

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=production-secret-key
JWT_REFRESH_SECRET=production-refresh-secret
```

### Build for Production
```bash
npm run build
npm start
```

## 📄 License

This project is licensed under the ISC License.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Note**: This backend is specifically designed to support the QueSkip mobile application with all the authentication flows and queue management features shown in the mobile app mockups.

##  Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate limiting
- **Payment**: Stripe
- **File Upload**: Multer
- **Environment**: dotenv

##  Prerequisites

Before running this project, make sure you have:

- Node.js 18.0 or higher
- PostgreSQL 12 or higher with PostGIS extension
- npm or yarn package manager
- Git

##  Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QueSkip-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/queskip_db
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=queskip_db
   DB_USER=your_username
   DB_PASSWORD=your_password

   # Server
   PORT=5000
   NODE_ENV=development

   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_REFRESH_EXPIRES_IN=30d

   # Other configurations...
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb queskip_db
   
   # Run migrations
   psql -d queskip_db -f scripts/schema.sql
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

##  Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run prod
```

### Building
```bash
npm run build
```

The server will start on `http://localhost:5000` (or your configured PORT).

##  API Documentation

Once the server is running, you can access:

- **API Documentation**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`

##  Project Structure

```
src/
 config/          # Configuration files
    database.ts  # Database connection
 controllers/     # Route controllers
    authController.ts
    businessController.ts
    queueController.ts
 middleware/      # Express middleware
    auth.ts      # Authentication middleware
    validation.ts # Validation middleware
    errorHandler.ts # Error handling
 models/          # Database models (if using ORM)
 routes/          # API routes
    authRoutes.ts
    businessRoutes.ts
    queueRoutes.ts
 services/        # Business logic services
 types/           # TypeScript type definitions
 utils/           # Utility functions
 app.ts          # Main application file
```

##  Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and profiles
- **businesses** - Business information and settings
- **queues** - Queue entries and status
- **subscriptions** - User subscription plans
- **payments** - Payment transactions
- **messages** - Chat messages
- **notifications** - Push notifications
- **reviews** - Business reviews and ratings
- **referrals** - Referral system

##  API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Businesses
- `GET /api/businesses` - Get all businesses (with filters)
- `GET /api/businesses/:id` - Get business by ID
- `GET /api/businesses/categories` - Get business categories
- `GET /api/businesses/search` - Search businesses
- `GET /api/businesses/nearby` - Get nearby businesses
- `GET /api/businesses/:id/reviews` - Get business reviews

### Queue Management
- `POST /api/queues/join` - Join a queue
- `PATCH /api/queues/:id/leave` - Leave a queue
- `GET /api/queues/my-queues` - Get user''s queue history
- `GET /api/queues/current` - Get current active queue
- `GET /api/queues/:id` - Get queue details
- `PATCH /api/queues/:id/notes` - Update queue notes

##  Deployment

### Render Deployment

1. **Prepare for deployment**
   ```bash
   # Ensure all dependencies are in package.json
   npm install --production
   ```

2. **Environment Variables on Render**
   Set these environment variables in your Render dashboard:
   ```
   NODE_ENV=production
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_production_jwt_secret
   JWT_REFRESH_SECRET=your_production_refresh_secret
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

3. **Build Command**
   ```
   npm install && npm run build
   ```

4. **Start Command**
   ```
   npm start
   ```

### PostgreSQL Setup on Render
1. Create a PostgreSQL database service on Render
2. Add PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Run the schema migration
4. Update your `DATABASE_URL` environment variable

##  Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Data sanitization
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **SQL Injection Prevention** - Parameterized queries

##  Monitoring & Logging

- **Winston** for structured logging
- **Morgan** for HTTP request logging
- **Health check** endpoint for monitoring
- **Error tracking** with stack traces
- **Request/Response logging** in development

##  Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m ''Add some amazing feature''`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

##  Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Ensure database exists

2. **JWT Token Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **CORS Issues**
   - Update ALLOWED_ORIGINS in `.env`
   - Check frontend domain configuration

4. **Port Already in Use**
   - Change PORT in `.env`
   - Kill process using the port: `lsof -ti:5000 | xargs kill`

##  Support

For support and questions:
- Email: support@queskip.com
- Issues: GitHub Issues
- Documentation: `/api-docs` endpoint

##  License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**QueSkip Backend API** - Streamlining queue management for businesses and customers worldwide. 
