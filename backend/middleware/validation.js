import { body, validationResult } from 'express-validator';

/**
 * Validation rules for user creation/update
 */
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters')
];

/**
 * Validation rules for claim creation
 */
export const validateClaim = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
    
  body('points')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Points must be between 1 and 10'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
    
  body('claimType')
    .optional()
    .isIn(['random', 'bonus', 'manual'])
    .withMessage('Invalid claim type')
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Middleware to validate MongoDB ObjectId parameters
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (validations) => {
  return [
    ...validations,
    (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }));
        
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors: formattedErrors
        });
      }
      
      next();
    }
  ];
};