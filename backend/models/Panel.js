import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Panel = sequelize.define('Panel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  panelNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'panel_number'
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'job_id'
  },
  qrCode: {
    type: DataTypes.STRING(255),
    unique: true,
    field: 'qr_code'
  },
  material: {
    type: DataTypes.STRING(100)
  },
  width: {
    type: DataTypes.DECIMAL(10, 2)
  },
  height: {
    type: DataTypes.DECIMAL(10, 2)
  },
  thickness: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Defective', 'Rework'),
    defaultValue: 'Pending'
  },
  currentStationId: {
    type: DataTypes.UUID,
    field: 'current_station_id'
  },
  qualityScore: {
    type: DataTypes.INTEGER,
    field: 'quality_score'
  }
}, {
  tableName: 'panels',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default Panel
