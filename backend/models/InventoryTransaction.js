import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  partId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  previousQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  newQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'inventory_transactions',
  timestamps: true,
  underscored: true
})

export default InventoryTransaction
