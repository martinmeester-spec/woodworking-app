import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const DebugLog = sequelize.define('DebugLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  level: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'info'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dataFlow: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestBody: {
    type: DataTypes.JSON,
    allowNull: true
  },
  responseStatus: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  responseBody: {
    type: DataTypes.JSON,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stackTrace: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'debug_logs',
  timestamps: true,
  underscored: true
})

export default DebugLog
