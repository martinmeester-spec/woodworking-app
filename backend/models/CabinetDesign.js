import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const CabinetDesign = sequelize.define('CabinetDesign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  designerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'designer_id'
  },
  templateId: {
    type: DataTypes.UUID,
    field: 'template_id'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  width: {
    type: DataTypes.DECIMAL(10, 2)
  },
  height: {
    type: DataTypes.DECIMAL(10, 2)
  },
  depth: {
    type: DataTypes.DECIMAL(10, 2)
  },
  material: {
    type: DataTypes.STRING(100)
  },
  finish: {
    type: DataTypes.STRING(100)
  },
  modelData: {
    type: DataTypes.JSONB,
    field: 'model_data'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('Draft', 'In Review', 'Approved', 'Archived'),
    defaultValue: 'Draft'
  }
}, {
  tableName: 'cabinet_designs',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default CabinetDesign
