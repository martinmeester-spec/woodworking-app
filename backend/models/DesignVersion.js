import { DataTypes } from 'sequelize'

export default (sequelize) => {
  const DesignVersion = sequelize.define('DesignVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    designId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    modelData: {
      type: DataTypes.JSON,
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
    material: {
      type: DataTypes.STRING
    },
    finish: {
      type: DataTypes.STRING
    },
    changeDescription: {
      type: DataTypes.TEXT
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'design_versions',
    timestamps: true,
    underscored: true
  })

  return DesignVersion
}
