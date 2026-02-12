import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ProductionSchedule = sequelize.define('ProductionSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  batchId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scheduleType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'production'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Scheduled'
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'normal'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true
  },
  machineId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  stationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  actualHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#3b82f6'
  },
  isAllDay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  recurrence: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'production_schedules',
  timestamps: true,
  underscored: true
})

export default ProductionSchedule
