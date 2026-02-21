# 🚛 FleetFlow — Modular Fleet & Logistics Management System

> **Odoo Hackathon Project** — A centralized, rule-based digital hub that replaces manual logbooks to optimize fleet lifecycle, monitor driver safety, and track financial performance.

---
## Video Link

https://drive.google.com/drive/folders/1vBK61l1OtHTahUToMtojXWds97Df1aSZ?usp=drive_link

---


## 👥 Target Users

| Role                  | Responsibility                                        |
| --------------------- | ----------------------------------------------------- |
| **Fleet Manager**     | Vehicle health, asset lifecycle, scheduling           |
| **Dispatcher**        | Create trips, assign drivers, validate cargo loads    |
| **Safety Officer**    | Driver compliance, license expirations, safety scores |
| **Financial Analyst** | Fuel spend, maintenance ROI, operational costs        |

---

## 🗂️ Project Structure

```
FleetFlow/
├── Backend/     # Node.js + Express REST API
└── Frontend/    # React + PrimeReact SPA
```

---

## 🔧 Backend

### Tech Stack

|            |                             |
| ---------- | --------------------------- |
| Runtime    | Node.js (ESM)               |
| Framework  | Express.js                  |
| Database   | MySQL 8+ (`mysql2/promise`) |
| Validation | Zod                         |
| Auth       | JWT (Bearer Token)          |
| Password   | PBKDF2-SHA512 (`crypto`)    |

### Setup

```bash
cd Backend

# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# → fill in DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET

# 3. Create database schema
mysql -u root -p < Db/fleetflow_schema.sql

# 4. Seed initial roles + admin user
node seed.js
# → admin@fleetflow.com / Admin@123

# 5. Start server
npm run dev    # → http://localhost:3000
```

### API Modules

| Module              | Base Route                 | Features                   |
| ------------------- | -------------------------- | -------------------------- |
| Auth / Users        | `/api/users`               | Login (JWT), CRUD          |
| Roles               | `/api/roles`               | CRUD                       |
| Vehicles            | `/api/vehicles`            | CRUD, soft-delete, restore |
| Drivers             | `/api/drivers`             | CRUD, soft-delete, restore |
| Trips               | `/api/trips`               | CRUD, status machine       |
| Shipments           | `/api/shipments`           | CRUD, auto SHP- code       |
| Maintenance Logs    | `/api/maintenance-logs`    | CRUD, status transitions   |
| Fuel Logs           | `/api/fuel-logs`           | CRUD                       |
| Driver Status Logs  | `/api/driver-status-logs`  | Audit trail                |
| Vehicle Status Logs | `/api/vehicle-status-logs` | Audit trail                |
| Safety              | `/api/safety`              | Safety records             |
| Expenses            | `/api/expenses`            | Cost tracking              |

### Business Logic

- **Trip dispatch** → Vehicle + Driver → `On Trip`; Shipment → `Assigned`
- **Trip complete** → Vehicle + Driver → `Available`; Shipment → `Delivered`
- **Maintenance log** → Vehicle auto-set to `In Shop`
- **All transitions** write audit entries to `driver_status_logs` + `vehicle_status_logs`

---

## 🎨 Frontend

### Tech Stack

|            |                                     |
| ---------- | ----------------------------------- |
| Framework  | React 18 (Vite)                     |
| UI Library | PrimeReact + PrimeIcons + PrimeFlex |
| Theme      | `lara-dark-indigo`                  |
| Routing    | React Router v6                     |
| HTTP       | Axios with JWT interceptor          |

### Setup

```bash
cd Frontend
npm install
npm run dev    # → http://localhost:5173
```

> Backend must be running on `http://localhost:3000` first.

### MVC Architecture

```
src/
├── models/       # Axios API calls per entity
├── controllers/  # Custom hooks (state + business logic)
├── views/        # Page components
├── components/   # Shared UI (AppLayout, StatCard)
├── context/      # AuthContext (JWT session)
└── router/       # React Router config
```

### Pages

| Page                    | Route                  | Key Features                                                            |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------- |
| Login                   | `/login`               | JWT auth, dark premium UI                                               |
| Command Center          | `/dashboard`           | Active Fleet, Utilization %, Pending Cargo, license alerts              |
| Vehicle Registry        | `/vehicles`            | CRUD, status tags, Out of Service toggle                                |
| Driver Profiles         | `/drivers`             | CRUD, license expiry warnings 🔴, safety score badges                   |
| **Trip Dispatcher**     | `/trips`               | Available-only dropdowns, **cargo capacity validation**, status machine |
| Maintenance Logs        | `/maintenance-logs`    | CRUD, status transitions (Scheduled → In Progress → Completed)          |
| Fuel Logs               | `/fuel-logs`           | CRUD, auto total cost                                                   |
| Driver Status Logs      | `/driver-status-logs`  | Read-only audit trail                                                   |
| Vehicle Status Logs     | `/vehicle-status-logs` | Read-only audit trail                                                   |
| **Analytics & Reports** | `/analytics`           | Fuel efficiency (km/L), Vehicle ROI, CSV export                         |

---

## 🔐 Default Login

```
Email:    admin@fleetflow.com
Password: Admin@123
```

---

## ⚙️ Core Business Rules

| Rule                    | Behavior                                                |
| ----------------------- | ------------------------------------------------------- |
| Cargo weight check      | Trip blocked if `cargo_weight > vehicle.max_load_kg`    |
| Dispatcher pool         | Only `status = Available` vehicles/drivers shown        |
| Maintenance auto-status | Adding service log → Vehicle `In Shop`                  |
| License compliance      | Expired license flagged — blocks assignment             |
| Trip completion         | Odometer updated → Vehicle + Driver back to `Available` |

---

## 📊 Analytics Metrics

- **Fuel Efficiency**: Total km ÷ Total liters (km/L)
- **Vehicle ROI**: `(Revenue − Maintenance − Fuel) / Acquisition Cost × 100%`
- **Total Operational Cost**: Fuel spend + Maintenance cost per vehicle
- **CSV Export**: Fuel logs + vehicle cost breakdown

---

## 🗃️ Database Schema

Key tables: `roles`, `users`, `vehicles`, `drivers`, `trips`, `shipments`, `maintenance_logs`, `fuel_logs`, `driver_status_logs`, `vehicle_status_logs`, `expenses`

Full schema: [`Backend/Db/fleetflow_schema.sql`](./Backend/Db/fleetflow_schema.sql)

---

## 📄 License

Built for the **Odoo Hackathon 2026**. All rights reserved by the FleetFlow team.
