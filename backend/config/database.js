import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use SQLite for local development and Docker, PostgreSQL for production VPS
const usePostgres = process.env.USE_POSTGRES === 'true'

let sequelize

if (usePostgres && process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  })
} else {
  // SQLite for local development and Docker
  // Use DATABASE_PATH env var if set (Docker), otherwise use local path
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite')
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  })
}

export default sequelize
