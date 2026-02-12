import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const MachineCalibration = sequelize.define('MachineCalibration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  machineId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  calibrationType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  calibrationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  nextDueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  result: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pending'
  },
  technician: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  measurements: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'machine_calibrations',
  timestamps: true,
  underscored: true
})

export default MachineCalibration
