// ===== ライブラリのインポート =====
import express, { Request, Response, NextFunction } from 'express'
import session from 'express-session';
import bcrypt from 'bcrypt';
// =====================================

import path from 'path'
import fs from 'fs'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import dotenv from 'dotenv'
dotenv.config()

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
    db.run(`CREATE TABLE paypay (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, description TEXT, FOREIGN KEY (user_id) REFERENCES users (id));`);
    db.run(`CREATE TABLE comecome (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, description TEXT, FOREIGN KEY (user_id) REFERENCES users (id));`);
    
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

  // ===== セッション機能の有効化 =====
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-default-secret-key-12345',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, 
      maxAge: 1000 * 60 * 60 * 24 
    }
  }));

  // すべてのEJSテンプレートでユーザー情報を使えるようにするミドルウェア
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
      res.redirect('/'); // ★ 変更: ログインページへ
    } catch (error) {
      console.error("Signup Error:", error);
      res.redirect('/signup');
    }
  });

  // ★ 変更: app.get('/login')は不要になったので削除し、app.get('/')がその役割を担う

  // ログイン処理
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
        return res.redirect('/dashboard'); // ★ 変更: ログイン後の遷移先を/dashboardに
      }
    }
    stmt.free();
    res.redirect('/'); // ★ 変更: 失敗時はログインページ（ルート）へ
  });

  // ログアウト処理
  app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) { console.error("Logout Error:", err); return res.redirect('/'); }
      res.redirect('/'); // ★ 変更: ログアウト後はログインページ（ルート）へ
    });
  });

  // ===== 認証チェックミドルウェア =====
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) {
      return next();
    }
    res.redirect('/'); // ★ 変更: 未ログイン時はログインページ（ルート）へ
  };

  // ===== アプリケーションのメインルート =====

  // ★ 変更: トップページ (/) はログイン画面に
  app.get('/', (req: Request, res: Response) => {
    if (req.session.user) {
      // もし既にログインしていたら、ダッシュボードにリダイレクト
      return res.redirect('/dashboard');
    }
    // 未ログインなら、ログインページを表示
    res.render('login');
  });
  
  // ★ 新設: ログイン後のダッシュボード（カレンダーページ）
  app.get('/dashboard', isAuthenticated, (req: Request, res: Response) => {
    const userId = req.session.user!.id; 
    const balanceStmt = db.prepare('SELECT * FROM balances WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1;');
    balanceStmt.bind([userId]);
    const balance = balanceStmt.getAsObject() as any
    balanceStmt.free()

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

    res.render('calendar', { balance, paypays, comecomes, currentDate: new Date() })
  })

  // Registration page
  app.get('/register', isAuthenticated, (req: Request, res: Response) => {
    res.render('register')
  })

  // Handle balance registration
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

  // Handle transaction registration
  app.post('/register-paypay', isAuthenticated, (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('INSERT INTO paypay (user_id, type, date, amount, description) VALUES (?, ?, ?, ?, ?);')
    stmt.bind([userId, type, date, parseFloat(amount), description])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  app.post('/register-comecome', isAuthenticated, (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('INSERT INTO comecome (user_id, type, date, amount, description) VALUES (?, ?, ?, ?, ?);')
    stmt.bind([userId, type, date, parseFloat(amount), description])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/register')
  })

  // Edit transaction form
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

  // Handle transaction edit
  app.post('/edit-paypay/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('UPDATE paypay SET type = ?, date = ?, amount = ?, description = ? WHERE id = ? AND user_id = ?;')
    stmt.bind([type, date, parseFloat(amount), description, id, userId])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/dashboard') // ★ 変更: 完了後はダッシュボードへ
  })

  app.post('/edit-comecome/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const { type, date, amount, description } = req.body
    const stmt = db.prepare('UPDATE comecome SET type = ?, date = ?, amount = ?, description = ? WHERE id = ? AND user_id = ?;')
    stmt.bind([type, date, parseFloat(amount), description, id, userId])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/dashboard') // ★ 変更: 完了後はダッシュボードへ
  })

  // Delete transaction
  app.get('/delete-paypay/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const stmt = db.prepare('DELETE FROM paypay WHERE id = ? AND user_id = ?;')
    stmt.bind([id, userId])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/dashboard') // ★ 変更: 完了後はダッシュボードへ
  })

  app.get('/delete-comecome/:id', isAuthenticated, (req: Request, res: Response) => {
    const id = req.params.id
    const userId = req.session.user!.id;
    const stmt = db.prepare('DELETE FROM comecome WHERE id = ? AND user_id = ?;')
    stmt.bind([id, userId])
    stmt.step()
    stmt.free()
    saveDatabase()
    res.redirect('/dashboard') // ★ 変更: 完了後はダッシュボードへ
  })

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

main()
  .catch(err => {
    console.error(err)
  })