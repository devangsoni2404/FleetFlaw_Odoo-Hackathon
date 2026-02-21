import express from 'express';
import dotenv from 'dotenv';
import './configs/db.js';
import roleRouter from './routes/role.route.js';
import shipmentRouter from './routes/shipment.route.js';
import tripRouter from './routes/trip.route.js';
import expenseRouter from './routes/expense.route.js';
import userRouter from './routes/user.route.js';
import driverRouter from "./routes/driver.route.js";
import vehicleRouter from "./routes/vehicle.route.js";
import safetyRouter from "./routes/safety.route.js";

dotenv.config();

const app = express();
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/roles', roleRouter);
app.use('/api/shipments', shipmentRouter);
app.use('/api/trips', tripRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/auth', userRouter);
app.use("/api/roles", roleRouter);
app.use("/api/users", userRouter);
app.use("/api/drivers", driverRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/safety", safetyRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
