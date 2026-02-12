import express from 'express'
import jwt from 'jsonwebtoken'
import { User, UserPreference } from '../models/index.js'

const router = express.Router()

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      order: [['created_at', 'DESC']]
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create user
router.post('/', async (req, res) => {
  try {
    const user = await User.create({
      ...req.body,
      passwordHash: req.body.password
    })
    const { passwordHash, ...userData } = user.toJSON()
    res.status(201).json(userData)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await user.update(req.body)
    const { passwordHash, ...userData } = user.toJSON()
    res.json(userData)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    await user.destroy()
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ where: { email } })
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Check plain text password first (for seeded test users), then try hash validation
    let isValidPassword = user.passwordHash === password
    if (!isValidPassword && user.validatePassword) {
      isValidPassword = await user.validatePassword(password)
    }
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    await user.update({ lastLogin: new Date() })
    
    const { passwordHash, ...userData } = user.toJSON()
    res.json({ user: userData, token })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user preferences
router.get('/:id/preferences', async (req, res) => {
  try {
    let preferences = await UserPreference.findOne({ where: { userId: req.params.id } })
    if (!preferences) {
      preferences = await UserPreference.create({ userId: req.params.id })
    }
    res.json(preferences)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user preferences
router.put('/:id/preferences', async (req, res) => {
  try {
    let preferences = await UserPreference.findOne({ where: { userId: req.params.id } })
    if (!preferences) {
      preferences = await UserPreference.create({ userId: req.params.id, ...req.body })
    } else {
      await preferences.update(req.body)
    }
    res.json(preferences)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
