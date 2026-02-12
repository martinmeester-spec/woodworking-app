import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  underscored: true
})

export default ActivityLog
