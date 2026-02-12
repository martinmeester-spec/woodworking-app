import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  supplierNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'USA'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Active'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  leadTimeDays: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  minimumOrderValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paymentTerms: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Net 30'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  underscored: true
})

export default Supplier
