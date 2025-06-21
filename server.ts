// ===== ライブラリのインポート =====
import express, { Request, Response, NextFunction } from 'express'
import session from 'express-session';
import bcrypt from 'bcrypt';
import multer from 'multer';
// =====================================

import path from 'path'
import fs from 'fs'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import dotenv from 'dotenv'
dotenv.config()

// ===== multerの設定: ファイルの保存場所とファイル名を定義 =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
// ==========================================================

// ===== TypeScriptの型定義 =====
declare module 'express-session' {
  interface SessionData {
    user?: { id: number; email: string; };
  }
}
// =====================================

const PORT = process.env.PORT || 3000

// Database file path
const DB_FILE = path.join(__dirname, 'data.db')
let db: Database

async function initDatabase() {
  const SQL: SqlJsStatic = await initSqlJs({ locateFile: file => `node_modules/sql.js/dist/${file}` })
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE)
    db = new SQL.Database(new Uint8Array(fileBuffer))
    console.log("Database loaded from file.");
  } else {
    db = new SQL.Database()
    console.log("New database created. Initializing tables...");

    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL);`);
    db.run(`CREATE TABLE balances (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, balance REAL NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users (id));`);
    
    db.run(`
      CREATE TABLE paypay (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, description TEXT,
        photo_filename TEXT, latitude REAL, longitude REAL, location_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    db.run(`
      CREATE TABLE comecome (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, description TEXT,
        photo_filename TEXT, latitude REAL, longitude REAL, location_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    
    saveDatabase()
    console.log("Tables created and database saved.");
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

  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-default-secret-key-12345',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
  }));

  app.use((req: Request, res: Response, next) => {
    res.locals.user = req.session.user;
    next();
  });

  // ===== 認証ルート =====
  app.get('/signup', (req: Request, res: Response) => { res.render('signup'); });
  app.post('/signup', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) { return res.redirect('/signup'); }
    try {
      const password_hash = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?);');
      stmt.bind([email, password_hash]);
      stmt.run();
      stmt.free();
      saveDatabase();
      res.redirect('/');
    } catch (error) {
      console.error("Signup Error:", error);
      res.redirect('/signup');
    }
  });

  app.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?;');
    stmt.bind([email]);
    if (stmt.step()) {
      const user = stmt.getAsObject() as any;
      stmt.free();
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        req.session.user = { id: user.id, email: user.email };
        return res.redirect('/dashboard');
      }
    }
    stmt.free();
    res.redirect('/');
  });

  app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) { console.error("Logout Error:", err); return res.redirect('/'); }
      res.redirect('/');
    });
  });

  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) { return next(); }
    res.redirect('/');
  };

  // ===== アプリケーションのメインルート =====
  app.get('/', (req: Request, res: Response) => {
    if (req.session.user) { return res.redirect('/dashboard'); }
    res.render('login');
  });
  
  app.get('/dashboard', isAuthenticated, (req: Request, res: Response) => {
    const userId = req.session.user!.id; 
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
    const currentDate = new Date(year, month - 1, 1);

    let balance: any = null;
  const balanceStmt = db.prepare('SELECT * FROM balances WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1;');
  balanceStmt.bind([userId]);
  if (balanceStmt.step()) {
    balance = balanceStmt.getAsObject();
  }
  balanceStmt.free();
    const paypaysStmt = db.prepare('SELECT * FROM paypay WHERE user_id = ? ORDER BY date;');
    paypaysStmt.bind([userId]);
    const comecomesStmt = db.prepare('SELECT * FROM comecome WHERE user_id = ? ORDER BY date;');
    comecomesStmt.bind([userId]);
    const paypays: any[] = [];
    const comecomes: any[] = [];
    while (paypaysStmt.step()) { paypays.push(paypaysStmt.getAsObject()) }
    paypaysStmt.free()
    while (comecomesStmt.step()) { comecomes.push(comecomesStmt.getAsObject()) }
    comecomesStmt.free()

    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

// 金額合計を計算（部分一致でその月のデータに限定）
    const sumPaypayStmt = db.prepare(`
      SELECT SUM(amount) AS total FROM paypay
      WHERE user_id = ? AND date LIKE ?;
    `);
    sumPaypayStmt.bind([userId, `${yearMonth}%`]);
    const totalPaypay = sumPaypayStmt.step() ? sumPaypayStmt.getAsObject().total : 0;
    sumPaypayStmt.free();

    const sumComecomeStmt = db.prepare(`
      SELECT SUM(amount) AS total FROM comecome
      WHERE user_id = ? AND date LIKE ?;  
    `);
    sumComecomeStmt.bind([userId, `${yearMonth}%`]);
    const totalComecome = sumComecomeStmt.step() ? sumComecomeStmt.getAsObject().total : 0;
    sumComecomeStmt.free();
    res.render('calendar', { balance, paypays, comecomes, currentDate,totalPaypay,  totalComecome })
  })

app.get('/register', isAuthenticated, (req: Request, res: Response) => {
  const userId = req.session.user!.id;
  const stmt = db.prepare('SELECT * FROM balances WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1;');
  stmt.bind([userId]);
  const balance = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  res.render('register', { balance });
});

  app.post('/register-balance', isAuthenticated, (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { balance } = req.body
    const updatedAt = new Date().toISOString()
    const stmt = db.prepare('INSERT INTO balances (user_id, balance, updated_at) VALUES (?, ?, ?);')
    stmt.bind([userId, parseFloat(balance), updatedAt])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  app.post('/register-paypay', isAuthenticated, upload.single('transactionPhoto'), (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { type, date, amount, description, latitude, longitude, locationName } = req.body;
    const photoFilename = req.file ? req.file.filename : null;
    const stmt = db.prepare('INSERT INTO paypay (user_id, type, date, amount, description, photo_filename, latitude, longitude, location_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);')
    stmt.bind([userId, type, date, parseFloat(amount), description, photoFilename, parseFloat(latitude) || null, parseFloat(longitude) || null, locationName])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  app.post('/register-comecome', isAuthenticated, upload.single('transactionPhoto'), (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { type, date, amount, description, latitude, longitude, locationName } = req.body;
    const photoFilename = req.file ? req.file.filename : null;
    const stmt = db.prepare('INSERT INTO comecome (user_id, type, date, amount, description, photo_filename, latitude, longitude, location_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);')
    stmt.bind([userId, type, date, parseFloat(amount), description, photoFilename, parseFloat(latitude) || null, parseFloat(longitude) || null, locationName])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  app.get('/edit-paypay/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const stmt = db.prepare('SELECT * FROM paypay WHERE id = ? AND user_id = ?;')
    stmt.bind([id, userId])
    let paypay: any = {}
    if (stmt.step()) { paypay = stmt.getAsObject() }
    stmt.free()
    res.render('edit-paypay', { paypay })
  })

  app.get('/edit-comecome/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const stmt = db.prepare('SELECT * FROM comecome WHERE id = ? AND user_id = ?;')
    stmt.bind([id, userId])
    let comecome: any = {}
    if (stmt.step()) { comecome = stmt.getAsObject() }
    stmt.free()
    res.render('edit-comecome', { comecome })
  })

  // =================================================================
  // ===== ここからが今回の修正箇所 =====
  // =================================================================

  app.post('/edit-paypay/:id', isAuthenticated, upload.single('transactionPhoto'), async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = req.session.user!.id;
    const { type, date, amount, description, latitude, longitude, locationName } = req.body;
    
    const photoFilename = req.file ? req.file.filename : null;
  
    // SQL文を動的に構築
    let sql = 'UPDATE paypay SET type = ?, date = ?, amount = ?, description = ?, latitude = ?, longitude = ?, location_name = ?';
    const params: (string | number | null)[] = [type, date, parseFloat(amount), description, parseFloat(latitude) || null, parseFloat(longitude) || null, locationName];
  
    if (photoFilename) {
      // 新しい写真がある場合のみ、photo_filenameを更新
      sql += ', photo_filename = ?';
      params.push(photoFilename);
    }
  
    sql += ' WHERE id = ? AND user_id = ?;';
    params.push(id, userId);
  
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    saveDatabase();
    res.redirect('/dashboard');
  });
  
  app.post('/edit-comecome/:id', isAuthenticated, upload.single('transactionPhoto'), async (req: Request, res: Response) => {
    const id = req.params.id;
    const userId = req.session.user!.id;
    const { type, date, amount, description, latitude, longitude, locationName } = req.body;
    
    const photoFilename = req.file ? req.file.filename : null;
  
    let sql = 'UPDATE comecome SET type = ?, date = ?, amount = ?, description = ?, latitude = ?, longitude = ?, location_name = ?';
    const params: (string | number | null)[] = [type, date, parseFloat(amount), description, parseFloat(latitude) || null, parseFloat(longitude) || null, locationName];
  
    if (photoFilename) {
      sql += ', photo_filename = ?';
      params.push(photoFilename);
    }
  
    sql += ' WHERE id = ? AND user_id = ?;';
    params.push(id, userId);
  
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    saveDatabase();
    res.redirect('/dashboard');
  });

  // =================================================================
  // ===== 修正箇所ここまで =====
  // =================================================================


  app.get('/delete-paypay/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const stmt = db.prepare('DELETE FROM paypay WHERE id = ? AND user_id = ?;')
    stmt.bind([id, userId])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/dashboard')
  })

  app.get('/delete-comecome/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const stmt = db.prepare('DELETE FROM comecome WHERE id = ? AND user_id = ?;')
    stmt.bind([id, userId])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/dashboard')
  })

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

main()
  .catch(err => {
    console.error(err)
  })