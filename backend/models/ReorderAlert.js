import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ReorderAlert = sequelize.define('ReorderAlert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  partId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  currentQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reorderQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Open'
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Medium'
  },
  acknowledgedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'reorder_alerts',
  timestamps: true,
  underscored: true
})

export default ReorderAlert
