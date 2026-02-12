import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const UserPreference = sequelize.define('UserPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  theme: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'light'
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'en'
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'UTC'
  },
  dateFormat: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'YYYY-MM-DD'
  },
  measurementUnit: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'mm'
  },
  defaultMaterial: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gridSnapEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  gridSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 10
  },
  showDimensions: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  showRulers: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  autoSave: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  autoSaveInterval: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  dashboardLayout: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'user_preferences',
  timestamps: true,
  underscored: true
})

export default UserPreference
