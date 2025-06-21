import express, { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 3000


// Database file path
const DB_FILE = path.join(__dirname, 'data.db')
let db: Database

// Initialize SQL.js and database
async function initDatabase() {
  const SQL: SqlJsStatic = await initSqlJs({ locateFile: file => `node_modules/sql.js/dist/${file}` })
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE)
    db = new SQL.Database(new Uint8Array(fileBuffer))
  } else {
    db = new SQL.Database()
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      balance REAL NOT NULL,
      updated_at TEXT NOT NULL
    );`)
    db.run(`CREATE TABLE IF NOT EXISTS paypay (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT
    );`)
    db.run(`CREATE TABLE IF NOT EXISTS comecome (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT
    );`)
    saveDatabase()
  }
}

function saveDatabase() {
  const data = db.export()
  fs.writeFileSync(DB_FILE, Buffer.from(data))
}

async function main() {
  await initDatabase()
  const app = express()
  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, 'views'))
  app.use(express.urlencoded({ extended: true }))
  app.use(express.static(path.join(__dirname, 'public')))

  // Top page: calendar view
  app.get('/', (req: Request, res: Response) => {
    // Get latest bank balance
    const balanceStmt = db.prepare('SELECT * FROM balances ORDER BY updated_at DESC LIMIT 1;')
    const balance = balanceStmt.getAsObject() as any
    balanceStmt.free()

    // Get all transactions
    const paypaysStmt = db.prepare('SELECT * FROM paypays ORDER BY date;')
    const comecomesStmt = db.prepare('SELECT * FROM comecomes ORDER BY date;')
    const paypays: any[] = []
    const comecomes: any[] = []
    
    while (paypaysStmt.step()) {
      paypays.push(paypaysStmt.getAsObject())
    }
    paypaysStmt.free()
    
    while (comecomesStmt.step()) {
      comecomes.push(comecomesStmt.getAsObject())
    }
    comecomesStmt.free()

    res.render('calendar', { balance, paypays, comecomes, currentDate: new Date() })
  })

  // Registration page for balances and transactions
  app.get('/register', (req: Request, res: Response) => {
    res.render('register')
  })

  // Handle balance registration
  app.post('/register-balance', (req: Request, res: Response) => {
    const { balance } = req.body
    const updatedAt = new Date().toISOString()
    const stmt = db.prepare('INSERT INTO balances (balance, updated_at) VALUES (?, ?);')
    stmt.bind([parseFloat(balance), updatedAt])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  // Handle transaction registration
  app.post('/register-paypay', (req: Request, res: Response) => {
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('INSERT INTO paypay (type, date, amount, description) VALUES (?, ?, ?, ?);')
    stmt.bind([type, date, parseFloat(amount), description])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  app.post('/register-comecome', (req: Request, res: Response) => {
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('INSERT INTO comecome (type, date, amount, description) VALUES (?, ?, ?, ?);')
    stmt.bind([type, date, parseFloat(amount), description])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  // Edit transaction form
  app.get('/edit-paypay/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const stmt = db.prepare('SELECT * FROM paypay WHERE id = ?;')
    stmt.bind([id])
    let paypay: any = {}
    if (stmt.step()) {
      paypay = stmt.getAsObject()
    }
    stmt.free()
    res.render('edit-paypay', { paypay })
  })

  app.get('/edit-comecome/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const stmt = db.prepare('SELECT * FROM comecome WHERE id = ?;')
    stmt.bind([id])
    let comecome: any = {}
    if (stmt.step()) {
      comecome = stmt.getAsObject()
    }
    stmt.free()
    res.render('edit-comecome', { comecome })
  })

  // Handle transaction edit
  app.post('/edit-paypay/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('UPDATE paypay SET type = ?, date = ?, amount = ?, description = ? WHERE id = ?;')
    stmt.bind([type, date, parseFloat(amount), description, id])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/')
  })

  app.post('/edit-comecome/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('UPDATE comecome SET type = ?, date = ?, amount = ?, description = ? WHERE id = ?;')
    stmt.bind([type, date, parseFloat(amount), description, id])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/')
  })

  // Delete transaction
  app.get('/delete-paypay/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const stmt = db.prepare('DELETE FROM paypay WHERE id = ?;')
    stmt.bind([id])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/')
  })

  app.get('/delete-comecome/:id', (req: Request, res: Response) => {
    const id = req.params.id
    const stmt = db.prepare('DELETE FROM comecome WHERE id = ?;')
    stmt.bind([id])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/')
  })

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

main()
  .catch(err => {
    console.error(err)
  })
