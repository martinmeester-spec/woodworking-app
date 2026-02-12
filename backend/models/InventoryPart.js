import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const InventoryPart = sequelize.define('InventoryPart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  partNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'part_number'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('Materials', 'Hardware', 'Finishing', 'Tools', 'Consumables'),
    defaultValue: 'Materials'
  },
  type: {
    type: DataTypes.STRING(100)
  },
  supplierId: {
    type: DataTypes.UUID,
    field: 'supplier_id'
  },
  supplierName: {
    type: DataTypes.STRING(255),
    field: 'supplier_name'
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'unit_cost'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    field: 'min_quantity'
  },
  maxQuantity: {
    type: DataTypes.INTEGER,
    field: 'max_quantity'
  },
  unit: {
    type: DataTypes.STRING(20)
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2)
  },
  dimensions: {
    type: DataTypes.STRING(255)
  },
  location: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.ENUM('In Stock', 'Low Stock', 'Critical', 'Out of Stock'),
    defaultValue: 'In Stock'
  }
}, {
  tableName: 'inventory_parts',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default InventoryPart
