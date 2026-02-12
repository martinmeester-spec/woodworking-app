import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ProductionStation = sequelize.define('ProductionStation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stationName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'station_name'
  },
  stationType: {
    type: DataTypes.ENUM('Cutting', 'Drilling', 'Edge Banding', 'Sanding', 'Finishing', 'Assembly', 'QC'),
    field: 'station_type'
  },
  location: {
    type: DataTypes.STRING(100)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  currentPanelId: {
    type: DataTypes.UUID,
    field: 'current_panel_id'
  },
  operatorId: {
    type: DataTypes.UUID,
    field: 'operator_id'
  },
  operatorName: {
    type: DataTypes.STRING(100),
    field: 'operator_name'
  },
  totalProcessed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_processed'
  },
  uptimePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'uptime_percentage'
  }
}, {
  tableName: 'production_stations',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default ProductionStation
