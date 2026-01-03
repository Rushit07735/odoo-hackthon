import express from 'express';
import {
  getAllWorkLogs,
  getWorkLogById,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog
} from '../controllers/workLogController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateWorkLog, validateId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', validatePagination, getAllWorkLogs);
router.get('/:id', validateId, getWorkLogById);
router.post('/', validateWorkLog, createWorkLog);
router.put('/:id', validateId, validateWorkLog, updateWorkLog);
router.delete('/:id', validateId, deleteWorkLog);

export default router;


