# 説明書

## 構成
    project-root/
    ├── public/                # CSSなどの公開ファイル
    ├── src/                   # Reactフロントエンドのロジック
    ├── views/                 # EJSテンプレート
    ├── data.db                # SQLiteデータベース
    ├── server.ts              # Expressサーバー本体
    ├── .env                   # 環境変数
    └── package.json           # npmスクリプト

## 今ある機能

### ページ
    TOPページ
    登録ページ
    編集ページ

### データテーブル
    balances テーブル
        id          INTEGER (PK)	自動増加ID
        balance	    REAL	        残高
        updated_at	TEXT	        ISO形式の更新日時 

    transactions テーブル
        id          INTEGER (PK)	自動増加ID
        type        TEXT            収入or支出
        date        TEXT            日付
        amount      REAL            金額
        description TEXT            メモ

### ルートマップ
    1.[トップページにアクセス] 
        ユーザー → ブラウザで http://localhost:3000 を開く
        ↓
        GET /
        ↓
        - 残高を balances テーブルから最新1件取得
        - 全取引 transactions を日付順に取得
        ↓
        calendar.ejs を表示
        → 📅 残高と取引一覧カレンダーが表示される

    2.[登録ページを開く]
        ユーザー → 「登録ページへ」リンクをクリック
        ↓
        GET /register
        ↓
        register.ejs を表示
        → 📝 残高・取引の登録フォームが表示される

    3.[残高を登録する]
        ユーザー → 残高入力フォームに数値を入力し「送信」
        ↓
        POST /register-balance
        ↓
        - balances テーブルに { balance, updated_at } を挿入
        - DB保存（saveDatabase）
        ↓
        リダイレクト → /register
        → ✅ 登録成功して登録ページへ戻る

    4.[取引を登録する]
        ユーザー → タイプ/日付/金額/メモを入力して送信
        ↓
        POST /register-transaction
        ↓
        - transactions テーブルに新しい取引を挿入
        - DB保存（saveDatabase）
        ↓
        リダイレクト → /register
        → ✅ 取引が登録されてフォームに戻る

    5.[取引を編集する]
        ユーザー → 編集ボタンを押す（例：/edit-transaction/5）
        ↓
        GET /edit-transaction/:id
        ↓
        - id に該当する取引を DB から取得
        ↓
        edit-transaction.ejs を表示
        → ✏️ 編集フォームが表示される

    6.[取引の編集を保存]
        ユーザー → フォームを修正して送信
        ↓
        POST /edit-transaction/:id
        ↓
        - 該当 id の transactions を UPDATE
        - DB保存（saveDatabase）
        ↓
        リダイレクト → /
        → 🏠 トップに戻って修正が反映されたカレンダーを見る

    7.[取引を削除する]
        ユーザー → 削除ボタンを押す（例：/delete-transaction/3）
        ↓
        GET /delete-transaction/:id
        ↓
        - 該当 id の transactions を DELETE
        - DB保存（saveDatabase）
        ↓
        リダイレクト → /
        → 🗑️ 削除された状態でカレンダーに戻る



## ファイル一覧


### public/styles.css
    body                    全体のレイアウトの設定
    header                  ヘッダーの設定
    nav a                   
    main                    メイン部の設定
    h1, h2                  見出しの設定
    .form-section           フォームを選ぶ部分の設定
    input, select, button   ボタンの設定
    .calendar-grid          カレンダーのレイアウトの設定
    .calendar-cell          カレンダーのコマの設定
    .calendar-cell.header   カレンダーのヘッダーの設定
    .calendar-cell.empty    カレンダーの空っぽのコマの設定
    .date-number            カレンダーの数字の設定
    .transaction            編集後の文字の設定

### src/App.jsx
    銀行残高と、取引情報の登録
    登録フォームの管理
    transactionsに情報を登録し、Calendar.jsxに送信

### src/Calendar.jsx
    現在の年月のカレンダーを表示
    各日付のマスに、その日に登録された支払い（引き落とし）を表示
    transactionsByDate  日付ごとの情報をまとめた辞書を作成
    カレンダーのグリッドの作成
    日付に描く情報の中身に何を書くのか

### src/main.jsx
    土台の管理

### src/styles.jsx
    viewsにあるオブジェクトごとのレイアウトを管理
    public/styles.cssと名前がかぶっててやってることもほぼ一緒だし謎
    多分こっちをメインに編集していいと思うよ

### views/calendar.jsx
    カレンダーページの設定
    class = ~~  そのエリアに名前を付けて、styles.cssでエリアごとに設定
    <link rel="stylesheet" href="/styles.css" />    styles.cssのレイアウトを利用
    <a href="/">トップ</a> |
    <a href="/register">登録ページ</a>  リンクとボタンの文字

### views/edit-transcation.jsx
    取引編集ページの設定
    受け取った値の反映

### views/register.jsx
    取引、口座登録ページの設定

### .env
    ポート番号の設定

### .gitignore
    GitHubにコミットできないファイルの設定
    ここにあるものは各々管理

### data.db
    データベースの管理
    勝手に更新される

### index.html
    ウィンドウの設定

### package-lock.json

### package.json

### server.ts
    PORT                                ポート番号の設定
    initDatabase                        データベースのテーブルの作成
                                        新しく作りたい場合はここで製作
    saveDatabase                        データベースの保存
    app.get '/'                         トップページの表示
                                        トップページで利用するデータベースの管理
                                        calender.ejsにデータの送信し、移行
    app.get '/register'                 登録画面の表示
                                        register.ejsに移行
    app.post '/register-balance'        口座登録情報の追加を行う
                                        データベースに登録情報を保存し、/registerに移行
    app.post '/register-transaction'    取引登録情報の追加を行う
                                        データベースに登録情報を保存し、/registerに移行
    app.get '/edit-transaction/:id'     取引編集画面の表示
                                        どのデータを編集するのかを選択し、
                                        edit-transaction.ejsに移行
    app.post '/edit-transaction/:id'    選択されたIDのデータの変更を行う
                                        データベースを保存しトップページに移行
    app.get '/delete-transaction/:id'   取引削除画面の表示
                                        データベースを保存しトップページに移行
    app.listen                          サーバー起動時ターミナルにログを出力

### tsconfig.json

---
# やりたいこと

1.カレンダーに他の月の追加
    _Calendar.jsxで実装？
2.月末、15日に残高の表示
    _Calendar.jsxで実装？
     そもそも今残高を計算するものがない、引き算ができていない
     データベース移行時に変更する必要あり？
3.定期的な引き落とし、クレジット払いを選択したら引き落とし日に引かれるように設定したい
4.部費とかサブスクの引き落としを期間と金額、日付を決めたら自動で毎月引かれるように
    _server.tsのPOST？期間決めるejsも必要では？
5.レイアウトの変更
    _cssで変更だけど、全部のページを一個のファイルでまとめるのは大変
     ページごとにファイルを分けると作業しやすいかも

---