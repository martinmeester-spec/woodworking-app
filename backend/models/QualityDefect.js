import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const QualityDefect = sequelize.define('QualityDefect', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  panelId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'panel_id'
  },
  stationId: {
    type: DataTypes.UUID,
    field: 'station_id'
  },
  defectType: {
    type: DataTypes.STRING(100),
    field: 'defect_type'
  },
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  description: {
    type: DataTypes.TEXT
  },
  location: {
    type: DataTypes.STRING(255)
  },
  detectedBy: {
    type: DataTypes.UUID,
    field: 'detected_by'
  },
  detectedByName: {
    type: DataTypes.STRING(100),
    field: 'detected_by_name'
  },
  status: {
    type: DataTypes.ENUM('Open', 'In Rework', 'Resolved', 'Rejected'),
    defaultValue: 'Open'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    field: 'resolved_at'
  }
}, {
  tableName: 'quality_defects',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default QualityDefect
