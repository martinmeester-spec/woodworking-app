import sequelize from '../config/database.js'
import User from './User.js'
import CabinetDesign from './CabinetDesign.js'
import DesignTemplate from './DesignTemplate.js'
import ProductionOrder from './ProductionOrder.js'
import ProductionJob from './ProductionJob.js'
import Panel from './Panel.js'
import ProductionStation from './ProductionStation.js'
import QualityDefect from './QualityDefect.js'
import InventoryPart from './InventoryPart.js'
import Machine from './Machine.js'
import MachineMaintenance from './MachineMaintenance.js'
import DesignVersionModel from './DesignVersion.js'
import ActivityLog from './ActivityLog.js'
import CostEstimate from './CostEstimate.js'
import WorkLog from './WorkLog.js'
import ReworkOrder from './ReworkOrder.js'
import InventoryTransaction from './InventoryTransaction.js'
import MachineCalibration from './MachineCalibration.js'
import ReorderAlert from './ReorderAlert.js'
import SystemConfig from './SystemConfig.js'
import AuditLog from './AuditLog.js'
import Customer from './Customer.js'
import Supplier from './Supplier.js'
import HelpArticle from './HelpArticle.js'
import DesignPart from './DesignPart.js'
import UserPreference from './UserPreference.js'
import Notification from './Notification.js'
import ProductionSchedule from './ProductionSchedule.js'
import DebugLog from './DebugLog.js'
import Tutorial from './Tutorial.js'
import UserAction from './UserAction.js'
import PartTracking from './PartTracking.js'
import EventSubscription from './EventSubscription.js'
import PartProductionPlan from './PartProductionPlan.js'

const DesignVersion = DesignVersionModel(sequelize)

// User relationships
User.hasMany(CabinetDesign, { foreignKey: 'designerId', as: 'designs' })
CabinetDesign.belongsTo(User, { foreignKey: 'designerId', as: 'designer' })

User.hasMany(ProductionOrder, { foreignKey: 'createdBy', as: 'orders' })
ProductionOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })

// Design relationships
DesignTemplate.hasMany(CabinetDesign, { foreignKey: 'templateId', as: 'designs' })
CabinetDesign.belongsTo(DesignTemplate, { foreignKey: 'templateId', as: 'template' })

// Production relationships
CabinetDesign.hasMany(ProductionOrder, { foreignKey: 'designId', as: 'orders' })
ProductionOrder.belongsTo(CabinetDesign, { foreignKey: 'designId', as: 'design' })

ProductionOrder.hasMany(ProductionJob, { foreignKey: 'orderId', as: 'jobs' })
ProductionJob.belongsTo(ProductionOrder, { foreignKey: 'orderId', as: 'order' })

ProductionJob.hasMany(Panel, { foreignKey: 'jobId', as: 'panels' })
Panel.belongsTo(ProductionJob, { foreignKey: 'jobId', as: 'job' })

ProductionStation.hasMany(Panel, { foreignKey: 'currentStationId', as: 'panels' })
Panel.belongsTo(ProductionStation, { foreignKey: 'currentStationId', as: 'currentStation' })

// Quality relationships
Panel.hasMany(QualityDefect, { foreignKey: 'panelId', as: 'defects' })
QualityDefect.belongsTo(Panel, { foreignKey: 'panelId', as: 'panel' })

ProductionStation.hasMany(QualityDefect, { foreignKey: 'stationId', as: 'defects' })
QualityDefect.belongsTo(ProductionStation, { foreignKey: 'stationId', as: 'station' })

// Machine relationships
Machine.hasMany(MachineMaintenance, { foreignKey: 'machineId', as: 'maintenanceRecords' })
MachineMaintenance.belongsTo(Machine, { foreignKey: 'machineId', as: 'machine' })

// Design version relationships
CabinetDesign.hasMany(DesignVersion, { foreignKey: 'designId', as: 'versions' })
DesignVersion.belongsTo(CabinetDesign, { foreignKey: 'designId', as: 'design' })

// Cost estimate relationships
CabinetDesign.hasOne(CostEstimate, { foreignKey: 'designId', as: 'costEstimate' })
CostEstimate.belongsTo(CabinetDesign, { foreignKey: 'designId', as: 'design' })

export {
  sequelize,
  User,
  CabinetDesign,
  DesignTemplate,
  ProductionOrder,
  ProductionJob,
  Panel,
  ProductionStation,
  QualityDefect,
  InventoryPart,
  Machine,
  MachineMaintenance,
  DesignVersion,
  ActivityLog,
  CostEstimate,
  WorkLog,
  ReworkOrder,
  InventoryTransaction,
  MachineCalibration,
  ReorderAlert,
  SystemConfig,
  AuditLog,
  Customer,
  Supplier,
  HelpArticle,
  DesignPart,
  UserPreference,
  Notification,
  ProductionSchedule,
  DebugLog,
  Tutorial,
  UserAction,
  PartTracking,
  EventSubscription,
  PartProductionPlan
}
