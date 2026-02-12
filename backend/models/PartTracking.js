import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const PartTracking = sequelize.define('PartTracking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  partId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'part_id'
  },
  partName: {
    type: DataTypes.STRING(255),
    field: 'part_name'
  },
  orderId: {
    type: DataTypes.UUID,
    field: 'order_id'
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    field: 'order_number'
  },
  station: {
    type: DataTypes.ENUM('wallsaw', 'cnc', 'banding', 'packaging', 'complete'),
    allowNull: false
  },
  previousStation: {
    type: DataTypes.STRING(50),
    field: 'previous_station'
  },
  scannedBy: {
    type: DataTypes.STRING(100),
    field: 'scanned_by'
  },
  scannedByName: {
    type: DataTypes.STRING(255),
    field: 'scanned_by_name'
  },
  scanTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'scan_time'
  },
  status: {
    type: DataTypes.ENUM('arrived', 'in_progress', 'completed', 'issue'),
    defaultValue: 'arrived'
  },
  notes: {
    type: DataTypes.TEXT
  },
  barcode: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'part_tracking',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default PartTracking
