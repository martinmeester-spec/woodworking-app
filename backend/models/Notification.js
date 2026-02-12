import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'normal'
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true
})

export default Notification
