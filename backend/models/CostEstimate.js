import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const CostEstimate = sequelize.define('CostEstimate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  designId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  materialCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  laborCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  overheadCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  profitMargin: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR'
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'cost_estimates',
  timestamps: true,
  underscored: true
})

export default CostEstimate
