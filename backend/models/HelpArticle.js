import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const HelpArticle = sequelize.define('HelpArticle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  relatedArticles: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  examples: {
    type: DataTypes.JSON,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'help_articles',
  timestamps: true,
  underscored: true
})

export default HelpArticle
