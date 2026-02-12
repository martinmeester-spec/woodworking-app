import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const EventSubscription = sequelize.define('EventSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'event_type'
  },
  eventCategory: {
    type: DataTypes.STRING(50),
    field: 'event_category'
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_enabled'
  },
  notifyEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'notify_email'
  },
  notifyInApp: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'notify_in_app'
  },
  notifyPush: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'notify_push'
  }
}, {
  tableName: 'event_subscriptions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default EventSubscription
