# 🚛 FleetFlow — Modular Fleet & Logistics Management System

> A robust RESTful API backend for managing fleets, drivers, shipments, trips, maintenance, fuel, and safety operations — built for the **Odoo Hackathon**.

---

## 🚀 Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Runtime          | Node.js (ESM)                    |
| Framework        | Express.js                       |
| Database         | MySQL 8+ (via `mysql2/promise`)  |
| Validation       | Zod                              |
| Authentication   | JWT (Bearer Token)               |
| Password Hashing | PBKDF2-SHA512 (Node.js `crypto`) |
| Dev Server       | Nodemon                          |

---

## 📁 Project Structure

```
Backend/
├── configs/
│   └── db.js                  # MySQL connection pool
├── controllers/               # Request handlers
│   ├── role.controller.js
│   ├── user.controller.js
│   ├── driver.controller.js
│   ├── vehicle.controller.js
│   ├── safety.controller.js
│   ├── maintenanceLog.controller.js
│   ├── fuelLog.controller.js
│   ├── driverStatusLog.controller.js
│   ├── vehicleStatusLog.controller.js
│   ├── shipment.controller.js
│   ├── trip.controller.js
│   └── expense.controller.js
├── middleware/
│   ├── auth.middleware.js      # JWT authentication
│   ├── role.middleware.js      # RBAC authorization
│   ├── validate.js             # Zod validation factory
│   └── errorHandler.js        # Global error handler
├── models/                    # Database layer (raw SQL)
├── routes/                    # Express routers
├── validators/                # Zod schemas
├── utils/
│   └── password.js            # PBKDF2 hash & verify
├── Db/
│   ├── fleetflow_schema.sql   # Full DB schema
│   └── fleetflow_seed.sql     # Seed data
├── seed.js                    # DB seeder script
├── server.js                  # App entry point
└── .env.example               # Environment variable template
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/devangsoni2404/FleetFlaw_Odoo-Hackathon.git
cd FleetFlaw_Odoo-Hackathon/Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fleetflow
DB_CONNECTION_LIMIT=10

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1h
```

### 4. Set up the database

```bash
# Create database and tables
mysql -u root -p < Db/fleetflow_schema.sql
```

### 5. Seed initial data

```bash
node seed.js
```

This creates:

- 4 roles: `Manager`, `Dispatcher`, `Safety Officer`, `Financial Analyst`
- Default admin user: `admin@fleetflow.com` / `Admin@123`

### 6. Start the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:3000`

---

## 🌐 API Reference

### Health Check

```
GET  /          → Server status
GET  /health    → Uptime + timestamp
```

### Authentication

```
POST /api/users/login
```

### Roles

```
GET    /api/roles
POST   /api/roles
GET    /api/roles/:roleId
PUT    /api/roles/:roleId
DELETE /api/roles/:roleId
```

### Users

```
GET    /api/users
POST   /api/users
GET    /api/users/:userId
PUT    /api/users/:userId
DELETE /api/users/:userId
```

### Vehicles

```
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:vehicleId
PATCH  /api/vehicles/:vehicleId
DELETE /api/vehicles/:vehicleId
```

### Drivers

```
GET    /api/drivers
POST   /api/drivers
GET    /api/drivers/:driverId
PATCH  /api/drivers/:driverId
DELETE /api/drivers/:driverId
```

### Safety

```
GET    /api/safety
POST   /api/safety
```

### Maintenance Logs

```
GET    /api/maintenance-logs
POST   /api/maintenance-logs
GET    /api/maintenance-logs/:id
PATCH  /api/maintenance-logs/:id
PATCH  /api/maintenance-logs/:id/status
DELETE /api/maintenance-logs/:id
```

**Status flow:** `Scheduled → In Progress → Completed / Cancelled`

### Fuel Logs

```
GET    /api/fuel-logs
POST   /api/fuel-logs
GET    /api/fuel-logs/:id
PATCH  /api/fuel-logs/:id
DELETE /api/fuel-logs/:id
```

### Driver Status Logs

```
GET    /api/driver-status-logs
POST   /api/driver-status-logs
GET    /api/driver-status-logs/:id
GET    /api/driver-status-logs/driver/:driverId
DELETE /api/driver-status-logs/:id
```

### Vehicle Status Logs

```
GET    /api/vehicle-status-logs
POST   /api/vehicle-status-logs
GET    /api/vehicle-status-logs/:id
GET    /api/vehicle-status-logs/vehicle/:vehicleId
DELETE /api/vehicle-status-logs/:id
```

### Shipments

```
GET    /api/shipments
POST   /api/shipments
GET    /api/shipments/:id
PATCH  /api/shipments/:id
DELETE /api/shipments/:id
```

### Trips

```
GET    /api/trips
POST   /api/trips
GET    /api/trips/:id
PATCH  /api/trips/:id
PATCH  /api/trips/:id/status
DELETE /api/trips/:id
```

**Status flow:** `Draft → Dispatched → In Transit → Completed / Cancelled`

### Expenses

```
GET    /api/expenses
POST   /api/expenses
```

---

## 🔑 Authentication

All protected routes require a JWT Bearer token:

```
Authorization: Bearer <your_token>
```

Get a token by calling `POST /api/users/login` with email and password.

---

## 🗃️ Database Schema

The full schema is in [`Db/fleetflow_schema.sql`](./Db/fleetflow_schema.sql). Key tables:

| Table                 | Description                                      |
| --------------------- | ------------------------------------------------ |
| `roles`               | User roles (Manager, Dispatcher, etc.)           |
| `users`               | System users                                     |
| `vehicles`            | Fleet vehicles                                   |
| `drivers`             | Driver profiles                                  |
| `shipments`           | Cargo shipments                                  |
| `trips`               | Trip records linking vehicle + driver + shipment |
| `maintenance_logs`    | Vehicle maintenance history                      |
| `fuel_logs`           | Fuel fill-up records                             |
| `driver_status_logs`  | Driver status change audit trail                 |
| `vehicle_status_logs` | Vehicle status change audit trail                |
| `expenses`            | Trip-related expenses                            |

---

## ✅ Key Features

- **JWT Authentication** with role-based access control (RBAC)
- **Zod validation** on all endpoints with field-level error messages
- **Soft deletes** across all entities — data is never permanently lost
- **Database transactions** for operations that touch multiple tables
- **Auto-generated codes** for maintenance logs (`MNT-`), fuel logs (`FL-`), shipments (`SHP-`), trips (`TRP-`)
- **Status machines** for maintenance logs and trips with enforced transitions
- **Safety scores** auto-updated on driver status log creation
- **Trip fuel cost** auto-recalculated when fuel logs are created/updated/deleted

---

## 👥 Team

Built for the **Odoo Hackathon** by the FleetFlow team.

---

## 📄 License

This project is for hackathon purposes only.
