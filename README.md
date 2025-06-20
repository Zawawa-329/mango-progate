# STEP1: Git

このステップではGitとGitHubの使い方を学びます。


## Gitをインストールする
1. Gitをご自身のPCにインストールしてください。以下のコマンドが動けばOKです。
   ```shell
   $ git version
   ```

   * Macを使っている場合: [brew](https://brew.sh/index_ja) をインストールしてから `brew install git`を実行
   * For Windows user: Download [installer](https://gitforwindows.org/)

2. git configに自分の名前とemailアドレスを設定します。以下のコマンドを実行して最後にあなたのemailアドレスが表示されればOKです。
   ```shell
   $ git config --global user.name "<your name>"
   $ git config --global user.email "<your-email-address>"
   $ git config user.email
   <your-email-address>
   ```
   
## Gitの基本コマンドを使う

1. `https://github.com/<your github id>/mango-progate` を **clone**
   します。 cloneすると、github上のリポジトリを自分のローカルにDownloadできます。
   ```shell
   $ cd <your working space>
   $ git clone https://github.com/<your github id>/mango-progate
   ```
   <>はなくてOK
   "your github id" はさわちゃんのidにしましょう。

**:bangbang: 注意**

cloneができたら必ず以下のコマンドを実行してください。
```shell
$ cd mango-progate
$ git config --local core.hooksPath .githooks/ 
```

## VSCodeでプログラムを開く

VSCodeを起動し、メニューバーから表示、コマンドパレットを選択
`shell command`と入力し、`Shell Command: Install 'code' command in PATH`を選択
完了したらターミナルを再起動

```shell
$ cd mango-progate
$ code .
```


## Gitのプルリクエスト(PR)を使う(いったん飛ばして)

基本自分の作業は、mainブランチにコミットする前にチームメイトに確認してもらう

1. `(任意の名前)`というブランチを作り、そのブランチに**switch**します
   ```shell
   $ cd <your working space>/mango-progate
   $ git branch pull-request
   $ git switch pull-request
   ```
   今回はpull-requestという名前とします

2. 書き換えた内容を **commit**します
   ```shell
   $ git status # Check your change
   $ git add README.md # README.mdの変更をcommit対象にする
   $ git commit -m "Update github id" # どんな変更を加えたのかを伝えるコメント
   ```
3. 変更内容をgithubに**push**します
   ```shell
   $ git push origin pull-request:pull-request
   ```
4. `https://github.com/<your github id>/mango-progate`を開き、**Pull Request**(PR)を作ります。
    - base repository: `<your github id>/mango-progate`
    - base branch: `main`
    - target branch: `pull-request`

## PRのレビューをする、PRのレビューをもらう
- PRができたら、チームメイトにそのPRのURLを見てもらいます
- 1人以上に`approve`をもらえたらそのPRをmainブランチにmergeします
- また、チームメイトのPRを開いて **変更内容を確認**し、`approve` しましょう。

---

**:book: Reference**
- [コードレビューの仕方](https://fujiharuka.github.io/google-eng-practices-ja/ja/review/reviewer/)


---

# STEP2: npm
1. nvmのインストール
   ```shell
      cd mango-progate
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```
   その後、以下を .zshrc または .bash_profile に追記して有効化（zsh を使っている場合）：
   ```shell
      export NVM_DIR="$HOME/.nvm"
      source "$NVM_DIR/nvm.sh"
      source ~/.zshrc  # または ~/.bash_profile
   ```
2. Node.jsのインストール
   ```shell
      nvm install --lts
      nvm use --lts
   ```
   動作確認
   ```shell
      node -v
      npm -v
   ```
3. TypeScript & ts-node のインストール
   ```shell
      npm install --save-dev typescript ts-node @types/node
      npm install express sql.js ejs
      npm install --save-dev @types/express
      npm install dotenv
      npx tsc
   ```
4. .envファイルの作成
   プロジェクト直下に .env ファイルを作成し、以下を記述してください：
   `PORT=3000`
5. 依存パッケージのインストール
   ```shell
      npm install
   ```

# 実行方法

```shell
    cd mango-progate
    npm run dev
```
`http://localhost:3000`に移動すると表示される

---

## 最新の変更をpullする

共同作業中、チームメイトの変更がコミットされたときに

自身のPCの状態を更新する

```bash
git fetch origin
git stash
git merge origin/main
git stash pop
```
git stashとgit stash popは自身の作業中のものを一時保存して更新するもの
一度mainブランチにmergeしてから行うのが理想

---
## 確認
できたら半角の×をVSCodeで入力して、
Gitのプルリクエスト(PR)を使うに沿ってプルリクエスト作ってみて
- [xx] **こいけ** 
- [] **なかい** 
- [] **もりわき** 
- [×] **やなぎさわ** 
- [×] **やまざき** nvm use --lts
