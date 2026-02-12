import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const DesignTemplate = sequelize.define('DesignTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  templateName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'template_name'
  },
  category: {
    type: DataTypes.STRING(100)
  },
  baseWidth: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'base_width'
  },
  baseHeight: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'base_height'
  },
  baseDepth: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'base_depth'
  },
  baseMaterial: {
    type: DataTypes.STRING(100),
    field: 'base_material'
  },
  thumbnailImage: {
    type: DataTypes.STRING(500),
    field: 'thumbnail_image'
  },
  modelTemplate: {
    type: DataTypes.JSONB,
    field: 'model_template'
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'usage_count'
  }
}, {
  tableName: 'design_templates',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default DesignTemplate
