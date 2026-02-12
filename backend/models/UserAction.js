import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const UserAction = sequelize.define('UserAction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'user_id'
  },
  userName: {
    type: DataTypes.STRING(255),
    field: 'user_name'
  },
  userRole: {
    type: DataTypes.STRING(50),
    field: 'user_role'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  actionType: {
    type: DataTypes.ENUM('view', 'create', 'update', 'delete', 'scan', 'move', 'login', 'logout', 'other'),
    defaultValue: 'other',
    field: 'action_type'
  },
  entityType: {
    type: DataTypes.STRING(50),
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.UUID,
    field: 'entity_id'
  },
  entityName: {
    type: DataTypes.STRING(255),
    field: 'entity_name'
  },
  page: {
    type: DataTypes.STRING(100)
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  station: {
    type: DataTypes.STRING(100)
  },
  previousStation: {
    type: DataTypes.STRING(100),
    field: 'previous_station'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  }
}, {
  tableName: 'user_actions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default UserAction
