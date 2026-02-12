import express from 'express'
import { Supplier } from '../models/index.js'

const router = express.Router()

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query
    const where = {}
    if (status) where.status = status
    if (category) where.category = category
    
    const suppliers = await Supplier.findAll({
      where,
      order: [['companyName', 'ASC']]
    })
    res.json(suppliers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' })
    res.json(supplier)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create supplier
router.post('/', async (req, res) => {
  try {
    const supplierNumber = `SUP-${Date.now()}`
    const supplier = await Supplier.create({
      ...req.body,
      supplierNumber
    })
    res.status(201).json(supplier)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' })
    await supplier.update(req.body)
    res.json(supplier)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' })
    await supplier.destroy()
    res.json({ message: 'Supplier deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
