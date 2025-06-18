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

**:bangbang: 注意**

cloneができたら必ず以下のコマンドを実行してください。
```shell
$ cd mango-progate
$ git config --local core.hooksPath .githooks/ 
```

2. `first-pull-request`というブランチを作り、そのブランチに**switch**します
   ```shell
   $ cd <your working space>/mango-progate
   $ git branch first-pull-request
   $ git switch first-pull-request
   ```
3. README.md の中にある`@<your github id>` の部分をあなたのgithub idに書き換えてください
4. 書き換えた内容を **commit**します
   ```shell
   $ git status # Check your change
   $ git add README.md # README.mdの変更をcommit対象にする
   $ git commit -m "Update github id" # どんな変更を加えたのかを伝えるコメント
   ```
5. 変更内容をgithubに**push**します
   ```shell
   $ git push origin first-pull-request:first-pull-request
   ```
6. `https://github.com/<your github id>/mango-progate`を開き、**Pull Request**(PR)を作ります。
    - base repository: `<your github id>/mango-progate`
    - base branch: `main`
    - target branch: `first-pull-request`

## PRのレビューをする、PRのレビューをもらう
- PRができたら、チームメイトにそのPRのURLを見てもらいます
- 1人以上に`approve`をもらえたらそのPRをmainブランチにmergeします
- また、チームメイトのPRを開いて **変更内容を確認**し、`approve` しましょう。

---

**:book: Reference**
- [コードレビューの仕方](https://fujiharuka.github.io/google-eng-practices-ja/ja/review/reviewer/)


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
