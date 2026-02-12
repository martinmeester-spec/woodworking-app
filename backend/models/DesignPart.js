import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const DesignPart = sequelize.define('DesignPart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  designId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  partType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  depth: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  positionX: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  positionY: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  positionZ: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  rotationX: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    defaultValue: 0
  },
  rotationY: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    defaultValue: 0
  },
  rotationZ: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    defaultValue: 0
  },
  material: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thickness: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  edgeBanding: {
    type: DataTypes.JSON,
    allowNull: true
  },
  drilling: {
    type: DataTypes.JSON,
    allowNull: true
  },
  hardware: {
    type: DataTypes.JSON,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  texture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  visible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  locked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code'
  },
  qrCodeData: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'qr_code_data'
  }
}, {
  tableName: 'design_parts',
  timestamps: true,
  underscored: true
})

export default DesignPart
