import express from 'express';
import {
  getAllMoods,
  getMoodById,
  createMood,
  updateMood,
  deleteMood
} from '../controllers/moodController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateMood, validateId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', validatePagination, getAllMoods);
router.get('/:id', validateId, getMoodById);
router.post('/', validateMood, createMood);
router.put('/:id', validateId, validateMood, updateMood);
router.delete('/:id', validateId, deleteMood);

export default router;


