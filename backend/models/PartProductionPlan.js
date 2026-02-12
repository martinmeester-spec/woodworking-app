import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const PartProductionPlan = sequelize.define('PartProductionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  partId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'part_id'
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'order_id'
  },
  // Wall Saw Station Data
  wallSawPlan: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'wall_saw_plan',
    defaultValue: {
      slabId: null,
      slabMaterial: 'MDF 18mm',
      slabWidth: 2800,
      slabHeight: 2070,
      positionX: 0,
      positionY: 0,
      cutSequence: 1,
      otherParts: []
    }
  },
  // CNC Station Data
  cncPlan: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'cnc_plan',
    defaultValue: {
      programId: null,
      gcode: '',
      toolChanges: [],
      estimatedTime: 0,
      drillHoles: [],
      routingPaths: [],
      pocketOperations: []
    }
  },
  // Edge Banding Station Data
  bandingPlan: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'banding_plan',
    defaultValue: {
      bandingSequence: [],
      bandingMaterial: 'ABS 2mm',
      bandingColor: 'White',
      edges: {
        top: { band: false, order: 0 },
        bottom: { band: false, order: 0 },
        left: { band: false, order: 0 },
        right: { band: false, order: 0 }
      }
    }
  },
  // Packaging Station Data
  packagingPlan: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'packaging_plan',
    defaultValue: {
      packageGroup: null,
      protectionType: 'Standard',
      labelPosition: 'Top',
      specialInstructions: ''
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
    defaultValue: 'pending'
  },
  currentStation: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'current_station'
  },
  completedStations: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'completed_stations',
    defaultValue: []
  }
}, {
  tableName: 'part_production_plans',
  timestamps: true,
  underscored: true
})

export default PartProductionPlan
