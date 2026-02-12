import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Tutorial = sequelize.define('Tutorial', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false
  },
  estimatedMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'beginner'
  },
  prerequisites: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'tutorials',
  timestamps: true,
  underscored: true
})

export default Tutorial
