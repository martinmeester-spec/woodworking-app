import express from 'express'
import { Customer } from '../models/index.js'

const router = express.Router()

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) where.status = status
    
    const customers = await Customer.findAll({
      where,
      order: [['companyName', 'ASC']]
    })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id)
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(customer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create customer
router.post('/', async (req, res) => {
  try {
    const customerNumber = `CUST-${Date.now()}`
    const customer = await Customer.create({
      ...req.body,
      customerNumber
    })
    res.status(201).json(customer)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id)
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    await customer.update(req.body)
    res.json(customer)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id)
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    await customer.destroy()
    res.json({ message: 'Customer deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
