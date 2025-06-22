/// ===== ライブラリのインポート =====
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import multer from 'multer';
import OpenAI from 'openai';
// =====================================

import path from 'path';
import fs from 'fs';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import dotenv from 'dotenv';
dotenv.config();

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

// OpenAIのインスタンス化 (OpenAIを全く使わないならコメントアウトするか削除)
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // 必要なければこの行もコメントアウト
//AIを使わない場合は、以下の関数をコメントアウトまたは削除してください。
// カレンダーページ用のAIコメント関数 (固定コメントを返すバージョン)
async function getAIComment(income: number, expense: number): Promise<string> {
  // API呼び出しなし、固定コメントを返すだけ
  return Promise.resolve("これはテスト用のコメントです。API制限が解除されたら実際のコメントを取得します。");
}

// 地図ページ用のAIコメント関数 (固定コメントを返すバージョン)
async function getAICommentForMap(transactions: Transaction[]): Promise<string> {
  // API呼び出しなし、固定コメントを返すだけ
  return Promise.resolve("これはテスト用のコメントです。API制限が解除されたら実際のコメントを取得します。");
}
//ここまでAIを使わない場合のコード


// OpenAIを使いたくなった時のコード
/*
// OpenAIのインスタンス化
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// カレンダーページ用のAIコメント関数 (OpenAIを呼び出すバージョン)
async function getAIComment_OpenAI(income: number, expense: number): Promise<string> { // 名前を変えておく
   const prompt = `
 あなたは家計のアドバイザーです。今月の収入は${income}円、支出は${expense}円です。
 収支のバランスや節約のポイント、改善点などを踏まえて、ユーザーにわかりやすく具体的なアドバイスを一言で伝えてください。
 `;
   try {
     const completion = await openai.chat.completions.create({
       messages: [{ role: 'user', content: prompt }],
       model: 'gpt-4o',
       max_tokens: 100,
     });
     return completion.choices[0].message.content || 'コメントが取得できませんでした。';
   } catch (error) {
     console.error("OpenAI API Error (Dashboard):", error);
     return "AIコメントの取得中にエラーが発生しました。後でもう一度お試しください。";
   }
}

// 地図ページ用のAIコメント関数 (OpenAIを呼び出すバージョン)
async function getAICommentForMap_OpenAI(transactions: Transaction[]): Promise<string> { // 名前を変えておく
  const expenseTransactions = transactions.filter(tx =>
    tx.type.includes('支出') || tx.type.includes('expense') || tx.type.includes('サブスク') || tx.type.includes('単発')
  );

  if (expenseTransactions.length === 0) {
    return "今月の支出データが見つかりません。新しい支出を記録してみましょう！";
  }

  const locationExpenses: { [key: string]: number } = {};
  expenseTransactions.forEach(tx => {
    const location = tx.location_name || '場所不明';
    locationExpenses[location] = (locationExpenses[location] || 0) + tx.amount;
  });

  const sortedLocations = Object.entries(locationExpenses)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, 3);

  let locationSummary = '';
  if (sortedLocations.length > 0) {
    locationSummary = '特に支出が多かった場所は、';
    sortedLocations.forEach(([loc, amount], index) => {
      locationSummary += `${loc} (${amount.toLocaleString()}円)${index < sortedLocations.length - 1 ? '、' : ''}`;
    });
    locationSummary += 'です。';
  }

  const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const prompt = `
あなたは地図上で家計を分析するアドバイザーです。
ユーザーの今月の総支出は約${totalExpense.toLocaleString()}円です。
${locationSummary}

これらの情報に基づき、ユーザーにわかりやすく具体的なアドバイスを一言で伝えてください。
以下のような点を考慮してください：
- 特定の場所での支出が多いことについてコメントする。
- 全体的な支出の傾向について言及する。
- 節約や支出管理のヒントを提供する。
- 地図を見ているユーザーに語りかけるような言葉遣い。
- ポジティブで行動を促す表現を使う。
- 長すぎず、簡潔にまとめる。
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      max_tokens: 150,
    });
    return completion.choices[0].message.content || 'コメントが取得できませんでした。';
  } catch (error) {
    console.error("OpenAI API Error (Map):", error);
    return "地図データに基づくAIコメントの取得中にエラーが発生しました。";
  }
}
*/ 
//


  /* 全支出合計
  const totalExpense = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const prompt = `
あなたは地図上で家計を分析するアドバイザーです。
ユーザーの今月の総支出は約${totalExpense.toLocaleString()}円です。
${locationSummary}

これらの情報に基づき、ユーザーにわかりやすく具体的なアドバイスを一言で伝えてください。
以下のような点を考慮してください：
- 特定の場所での支出が多いことについてコメントする。
- 全体的な支出の傾向について言及する。
- 節約や支出管理のヒントを提供する。
- 地図を見ているユーザーに語りかけるような言葉遣い。
- ポジティブで行動を促す表現を使う。
- 長すぎず、簡潔にまとめる。
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o', // または 'gpt-3.5-turbo' など
      max_tokens: 150, // マップ用は少し長めでも良いかもしれない
    });
    return completion.choices[0].message.content || 'コメントが取得できませんでした。';
  } catch (error) {
    console.error("OpenAI API Error (Map):", error);
    return "地図データに基づくAIコメントの取得中にエラーが発生しました。";
  }
}*/
// ここまでだよ！！

// ===== TypeScriptの型定義 =====
declare module 'express-session' {
  interface SessionData {
    user?: { id: number; email: string; };
  }
}

// ===== 取引データの型定義（任意だが推奨） =====
interface Transaction {
  id: number;
  user_id: number;
  type: string;
  date: string;
  amount: number;
  description?: string;
  photo_filename?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  source_table?: 'paypay' | 'comecome'; // ★★★ 追加: どのテーブルから来たかを示すプロパティ ★★★
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
  
  app.get('/dashboard', isAuthenticated, async (req: Request, res: Response) => {
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
    
    const paypays: Transaction[] = []; 
    const comecomes: Transaction[] = []; 
    
    while (paypaysStmt.step()) { 
      const tx = paypaysStmt.getAsObject() as Transaction; 
      paypays.push({ ...tx, source_table: 'paypay' }); 
    }
    paypaysStmt.free();
    
    while (comecomesStmt.step()) { 
      const tx = comecomesStmt.getAsObject() as Transaction; 
      comecomes.push({ ...tx, source_table: 'comecome' }); 
    }
    comecomesStmt.free();

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

    const rawIncome = totalComecome;
    const rawExpense = totalPaypay;

    // 明示的に number 型に変換（null や undefined の場合は 0 にする）
    const income = typeof rawIncome === 'number' ? rawIncome : Number(rawIncome) || 0;
    const expense = typeof rawExpense === 'number' ? rawExpense : Number(rawExpense) || 0;

    let aiComment = '';

    if (!isNaN(income) && !isNaN(expense)) {
      aiComment = await getAIComment(income, expense);
    }
    res.render('calendar', { balance, paypays, comecomes, currentDate, totalPaypay, totalComecome, aiComment });
  });

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

  // ★★★ /map ルート ★★★
  app.get('/map', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    try {
      // paypayとcomecomeのデータを取得
      const paypaysStmt = db.prepare(`
        SELECT id, amount, type, description, location_name, latitude, longitude, date
        FROM paypay WHERE user_id = ?;
      `);
      paypaysStmt.bind([userId]);
      const paypays: Transaction[] = [];
      while (paypaysStmt.step()) {
        const tx = paypaysStmt.getAsObject() as Transaction;
        paypays.push({ ...tx, source_table: 'paypay' }); 
      }
      paypaysStmt.free();

      const comecomesStmt = db.prepare(`
        SELECT id, amount, type, description, location_name, latitude, longitude, date
        FROM comecome WHERE user_id = ?;
      `);
      comecomesStmt.bind([userId]);
      const comecomes: Transaction[] = [];
      while (comecomesStmt.step()) {
        const tx = comecomesStmt.getAsObject() as Transaction;
        comecomes.push({ ...tx, source_table: 'comecome' }); 
      }
      comecomesStmt.free();

      const allTransactions = [...paypays, ...comecomes];
      let aiCommentForMap = '';
      if (allTransactions.length > 0) { // 取引データがある場合のみAIコメントを生成
        aiCommentForMap = await getAICommentForMap(allTransactions);
      } else {
        aiCommentForMap = "支出データがありません。支出を記録して、マップで分析してみましょう！";
      }

      res.render('map', { user: req.session.user, transactions: allTransactions, aiCommentForMap: aiCommentForMap });

    } catch (error) {
      console.error('Error fetching transactions for map:', error);
      res.status(500).send('地図データを取得できませんでした。');
    }
  });


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

main()
  .catch(err => {
    console.error(err)
  })