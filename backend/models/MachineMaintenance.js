import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const MachineMaintenance = sequelize.define('MachineMaintenance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  maintenanceId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'maintenance_id'
  },
  machineId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'machine_id'
  },
  maintenanceType: {
    type: DataTypes.ENUM('Scheduled', 'Preventive', 'Repair', 'Emergency', 'Calibration'),
    field: 'maintenance_type'
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    field: 'scheduled_date'
  },
  completedDate: {
    type: DataTypes.DATEONLY,
    field: 'completed_date'
  },
  technician: {
    type: DataTypes.STRING(100)
  },
  notes: {
    type: DataTypes.TEXT
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled'),
    defaultValue: 'Scheduled'
  }
}, {
  tableName: 'machine_maintenance',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default MachineMaintenance
