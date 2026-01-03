import express from 'express';
import { getDashboardAnalytics, exportData } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/dashboard', getDashboardAnalytics);
router.get('/export/:type', exportData);

export default router;
