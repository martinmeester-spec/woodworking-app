import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ProductionOrder = sequelize.define('ProductionOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number'
  },
  designId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'design_id'
  },
  customerId: {
    type: DataTypes.UUID,
    field: 'customer_id'
  },
  customerName: {
    type: DataTypes.STRING(255),
    field: 'customer_name'
  },
  orderDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'order_date'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date'
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending', 'In Progress', 'Cutting', 'Drilling', 'Edge Banding', 'Sanding', 'Finishing', 'Assembly', 'QC', 'Completed', 'Cancelled'),
    defaultValue: 'Draft'
  },
  totalPanels: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_panels'
  },
  completedPanels: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'completed_panels'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium'
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'created_by'
  }
}, {
  tableName: 'production_orders',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default ProductionOrder
