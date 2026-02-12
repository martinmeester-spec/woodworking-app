import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, department } = req.body
    
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    
    const user = await User.create({
      email,
      passwordHash: password,
      firstName,
      lastName,
      role: role || 'Operator',
      department
    })
    
    const { passwordHash, ...userData } = user.toJSON()
    res.status(201).json(userData)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Test users for development (auto-created if not in DB)
const testUsers = {
  'admin@woodworking.com': { password: 'admin123', role: 'Admin', firstName: 'Admin', lastName: 'User' },
  'manager@woodworking.com': { password: 'manager123', role: 'Manager', firstName: 'Manager', lastName: 'User' },
  'designer@woodworking.com': { password: 'designer123', role: 'Designer', firstName: 'Designer', lastName: 'User' },
  'operator@woodworking.com': { password: 'operator123', role: 'Operator', firstName: 'Operator', lastName: 'User' },
  'scanner@woodworking.com': { password: 'scanner123', role: 'Scanner', firstName: 'Scanner', lastName: 'User' },
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    let user = await User.findOne({ where: { email } })
    
    // Auto-create test users if they don't exist
    if (!user && testUsers[email]) {
      const testUser = testUsers[email]
      if (password === testUser.password) {
        user = await User.create({
          email,
          passwordHash: testUser.password,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role,
          department: 'Production'
        })
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // For test users, check plain password; for real users, use validatePassword
    const isValidPassword = testUsers[email] 
      ? password === testUsers[email].password
      : await user.validatePassword(password)
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    )
    
    await user.update({ lastLogin: new Date() })
    
    const { passwordHash, ...userData } = user.toJSON()
    res.json({ user: userData, token })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Logout (client-side token removal, but we can log it)
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Refresh token
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    )
    res.json({ token })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
