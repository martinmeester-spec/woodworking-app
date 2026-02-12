import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'
import bcrypt from 'bcryptjs'

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  firstName: {
    type: DataTypes.STRING(100),
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    field: 'last_name'
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Manager', 'Operator', 'Designer', 'Scanner'),
    allowNull: false,
    defaultValue: 'Operator'
  },
  department: {
    type: DataTypes.STRING(100)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash)
}

User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10)
  }
})

export default User
