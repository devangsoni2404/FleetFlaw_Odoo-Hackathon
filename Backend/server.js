import express from 'express';
import dotenv from 'dotenv';
import './configs/db.js';
import roleRouter from './routes/role.route.js';

dotenv.config();

const app = express();
const PORT = Number.parseInt(process.env.SERVER_PORT, 10) || Number.parseInt(process.env.PORT, 10) || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/roles', roleRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
