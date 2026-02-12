import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  configKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  configValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dataType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isEditable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'system_configs',
  timestamps: true,
  underscored: true
})

export default SystemConfig
