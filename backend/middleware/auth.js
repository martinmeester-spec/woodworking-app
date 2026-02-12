import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// Authentication middleware
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Role-based access control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

// Admin only middleware
export const adminOnly = requireRole('Admin')

// Manager or Admin middleware
export const managerOrAdmin = requireRole('Admin', 'Manager')

export default { authMiddleware, requireRole, adminOnly, managerOrAdmin }
