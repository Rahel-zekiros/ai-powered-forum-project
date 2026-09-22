import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { db } from './db/config.js';
import { mainRouter } from './src/api/routes.js';
import { errorHandler } from './src/middleware/error-handler.js';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api', mainRouter);

app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connection = await db.getConnection();

    console.log('Database connection established successfully.');
    connection.release();

    app.listen(port, err => {
      if (err) {
        console.error('Failed to start the server:', err.message);
        process.exit(1);
      }
      console.log(`Server running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      'Failed to connect to the database. Server not started.',
      error.message,
    );
    process.exit(1);
  }
};

startServer();
