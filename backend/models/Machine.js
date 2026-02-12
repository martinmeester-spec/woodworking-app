import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Machine = sequelize.define('Machine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  machineId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'machine_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('CNC Router', 'Panel Saw', 'Edge Bander', 'Drill Press', 'Sander', 'Finishing', 'Assembly'),
    defaultValue: 'CNC Router'
  },
  manufacturer: {
    type: DataTypes.STRING(100)
  },
  modelNumber: {
    type: DataTypes.STRING(100),
    field: 'model_number'
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    field: 'serial_number'
  },
  location: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.ENUM('Running', 'Idle', 'Maintenance', 'Offline', 'Error'),
    defaultValue: 'Idle'
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    field: 'purchase_date'
  },
  operatingHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'operating_hours'
  },
  uptimePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    field: 'uptime_percentage'
  },
  lastMaintenance: {
    type: DataTypes.DATEONLY,
    field: 'last_maintenance'
  },
  nextMaintenance: {
    type: DataTypes.DATEONLY,
    field: 'next_maintenance'
  }
}, {
  tableName: 'machines',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default Machine
