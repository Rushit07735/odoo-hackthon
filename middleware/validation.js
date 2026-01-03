import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Auth validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('role')
    .optional()
    .isIn(['employee', 'manager', 'HR'])
    .withMessage('Role must be employee, manager, or HR'),
  handleValidationErrors
];

// Work Log validation rules
export const validateWorkLog = [
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid date is required'),
  body('task_description')
    .trim()
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ max: 5000 })
    .withMessage('Task description must not exceed 5000 characters'),
  body('status')
    .optional()
    .isIn(['planned', 'in-progress', 'completed'])
    .withMessage('Status must be planned, in-progress, or completed'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments must not exceed 2000 characters'),
  handleValidationErrors
];

// Skill validation rules
export const validateSkill = [
  body('skill_name')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required')
    .isLength({ max: 255 })
    .withMessage('Skill name must not exceed 255 characters'),
  body('learning_activity')
    .trim()
    .notEmpty()
    .withMessage('Learning activity is required')
    .isLength({ max: 5000 })
    .withMessage('Learning activity must not exceed 5000 characters'),
  body('progress')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

// Mood validation rules
export const validateMood = [
  body('mood')
    .isIn(['happy', 'neutral', 'stressed', 'tired'])
    .withMessage('Mood must be happy, neutral, stressed, or tired'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback must not exceed 2000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Order must be asc or desc'),
  handleValidationErrors
];

// Date range validation
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid start date is required'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid end date is required'),
  handleValidationErrors
];
