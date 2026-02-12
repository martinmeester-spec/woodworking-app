import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ReworkOrder = sequelize.define('ReworkOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reworkNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  panelId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  defectId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pending'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  reworkStation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Medium'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'rework_orders',
  timestamps: true,
  underscored: true
})

export default ReworkOrder
