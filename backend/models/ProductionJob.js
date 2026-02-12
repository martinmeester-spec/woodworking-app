import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ProductionJob = sequelize.define('ProductionJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jobNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'job_number'
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id'
  },
  jobType: {
    type: DataTypes.ENUM('Cutting', 'Drilling', 'Edge Banding', 'Sanding', 'Finishing', 'Assembly'),
    allowNull: false,
    field: 'job_type'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'),
    defaultValue: 'Pending'
  },
  startDate: {
    type: DataTypes.DATE,
    field: 'start_date'
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date'
  },
  completionDate: {
    type: DataTypes.DATE,
    field: 'completion_date'
  },
  assignedStation: {
    type: DataTypes.STRING(100),
    field: 'assigned_station'
  },
  panelCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'panel_count'
  },
  completedPanelCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'completed_panel_count'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'production_jobs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default ProductionJob
