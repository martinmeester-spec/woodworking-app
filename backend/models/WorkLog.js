import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const WorkLog = sequelize.define('WorkLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  panelId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  operatorId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'In Progress'
  },
  qualityCheck: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'work_logs',
  timestamps: true,
  underscored: true
})

export default WorkLog
