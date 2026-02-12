// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({ field: e.path, message: e.message }))
    })
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate Entry',
      details: err.errors.map(e => ({ field: e.path, message: e.message }))
    })
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' })
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

// Not found middleware
export const notFound = (req, res, next) => {
  res.status(404).json({ error: `Not Found - ${req.originalUrl}` })
}

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default { errorHandler, notFound, asyncHandler }
