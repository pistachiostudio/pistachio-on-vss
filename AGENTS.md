# AGENTS.md

pistachiostudio.net のソースリポジトリ。静的サイトジェネレーター [VSS](https://github.com/veltiosoft/vss)
で Markdown をビルドし、GitHub Pages に配信している。人向けの説明は `README.md`、
このファイルは AI エージェント(Claude など)向けの作業メモ。

## 基本ルール

- 返答・コミットメッセージ・PR説明は日本語(既存のコミット履歴に合わせる)。
- `main` へのプッシュ(マージ含む)は **本番サイトに自動デプロイされる**。
  作業は必ずブランチを切って行い、`main` に直接コミット/プッシュしない。
  コミット・プッシュ・PR作成は、ユーザーに頼まれたときだけ行う。
- ビルド成果物(`dist/`)と VSS のバイナリ(`vss` / `vss.exe` / `vss_linux_amd64*`)は
  `.gitignore` 済み。コミットしない。

## ビルドと確認

```bash
make setup-mac   # VSS本体を取得。Apple Silicon Mac。Linuxは `make setup`、Windowsは `make setup-win`
make build       # = ./vss build → dist/ に生成
vss serve        # ファイル変更を見ながらローカルプレビュー
```

- VSS が既に PATH にある場合(`~/.vss/bin/vss` など)は `vss build` を直接使ってよい。
- CI(`.github/workflows/pages.yml`)は `make setup`(最新版 vss を取得)→ `vss build` →
  `dist/` を Pages にアップロード。`README.md` / `AGENTS.md` / `.claude/**` / `archive/**`
  だけの変更ではデプロイは走らない(`paths-ignore`)。
- ローカルの vss が古いと CI と挙動が変わることがある(例: 手元が 0.11.0 で CI は最新)。
  `vss --version` を確認し、`make setup*` で更新してから検証すると確実。
- **ルート直下や `.claude/` 内の `.md` は、そのままだとページとして公開される**
  (`README.md` は今も `README.html` として出力される)。`AGENTS.md` と `SKILL.md` は
  `vss.toml` の `ignore_files`(ファイル名一致)で除外している。新しい説明用 `.md` を
  リポジトリに足すときは、公開したくなければ同様に `ignore_files` へ追加すること。
  最新版(0.18.0)で `dist/` に出ないことを確認済み。古い vss(0.11.0)ではこの除外が
  効かず、手元のビルドで `AGENTS.html` などが出力される(CI には影響しない)。
  なお `SKILL.md` の frontmatter は YAML として不正だと(`description` に `: ` を含めるなど)
  古い vss ではビルドエラーになる。
- `vss build` は `dist/` を掃除しない。過去のビルドの古いファイル
  (`dist/css/beach_style.css` など)が残っていることがあるが、無視してよい。
  クリーンな確認をしたいときは `dist/` ごと消してから再ビルドする。
- テストやリンターは無い。変更後は `vss build` が通ること、必要ならブラウザで
  実際の見た目を確認すること。

## 構成

```
*.md                 各ページの本文(index / past / social / contact / quojama など)
layouts/             HTMLテンプレート。ページと同名のlayoutがあればそれ、なければ default.html
  default.html         通常ページ用
  quojama.html         quojama.md 用
  20230826.html        20230826.md 用
static/              そのまま dist/ にコピーされる静的ファイル
  css/style.css        構造CSS + 配色のデフォルト値(:root の変数)
  css/vhs.css          VHS風スキャンライン/ノイズの構造CSS
  css/themes.css       ★ 現在のカラーテーマ(CSS変数の上書きだけ)
  css/dot/cat.css      左上のドット絵アイコン(box-shadowで描画)
  js/t.js              タイプライター演出(jQuery プラグイン)
vss.toml             サイト設定(title / description / base_url / build設定)
archive/             CNAME など。変更してもデプロイは走らない(paths-ignore)。基本触らない
.claude/skills/      プロジェクト用スキル(theme-swap)
```

- `vss.toml` の `allow_dangerous_html = true` により、Markdown 内の HTML コメントアウトが効く。
  (`index.md` の "Upcoming Party" の告知を隠す/出すのにコメントアウトを使っている。)
- レイアウトのテンプレート構文は `{{title}}` / `{{site_description}}` / `{{{contents}}}` など
  (VSS 標準)。3つのレイアウトは **ほぼ同じ中身の複製**なので、共通部分(ヘッダー、
  CSS読み込み、フッター、`data-theme`、"Theme: ..." 表記)を変えるときは
  **3ファイルとも同じ変更を入れる**こと。
- Markdown 本文は素の Markdown。ソーシャルリンクやヘッダーはレイアウト側にある。

## カラーテーマの仕組み(重要)

配色は CSS 変数で一本化されている。

- `static/css/style.css` の `:root` に **フォールバック値**(変数の宣言と既定色)がある。
- `static/css/themes.css` に、**有効なテーマ1つ分だけ**が
  `body[data-theme="<key>"] { --xxx: ...; }` として書かれている。
- 使うテーマは各 `layouts/*.html` の `<body data-theme="<key>">` で選ぶ。
- ヘッダーに表示される "Theme: <名前>" は各 `layouts/*.html` に直書き(3ファイル)。
- 左上のドット絵の色は `--dot-color-a` / `--dot-color-b`(themes.css側)。形は `dot/cat.css`。

**色を `style.css` / `vhs.css` に直接書かないこと。** 構造CSSは色を持たない方針。
新しい色が必要なら `style.css` の `:root` に変数を足し、`themes.css` で値を与える。
過去のテーマはコードとして残さず、名前だけ `themes.css` 冒頭コメントに記録する。

テーマを丸ごと変える作業は、専用スキル **`theme-swap`**(`.claude/skills/theme-swap/`)を使う。
候補の提示 → 選択 → 4か所の一括書き換え → ビルド確認までをカバーしている。

### 変数の一覧

`--main-bg-color` / `--main-font-color` / `--title-color` / `--link-color` /
`--link-hover-color` / `--social-button-color` / `--social-button-hover-color` /
`--selection-text-color` / `--selection-bg-color` / `--doggo-color` /
`--vhs-noise-color` / `--vhs-scanline-color` / `--dot-color-a` / `--dot-color-b`

### テーマ外に残っている直書きの色(要注意)

- `layouts/*.html` のタイプライターのキャレット `<span style="color:pink;">`(2か所×3ファイル)。
- `vhs.css` の `rgbText` アニメーションの `text-shadow`(RGBずれ演出。色相は固定)。
- `static/manifest.json` の `theme_color` / `background_color`。
- `static/css/dot/cc_cat_dot.css` はどのレイアウトからも読まれていない旧ファイル。
  `dot/cat.css` 冒頭コメントには、既に存在しない `padres_dot.css` などへの言及が残っている。

## 注意点

- フォントは Google Fonts の VT323、アイコンは Font Awesome(`style.css` で CDN から `@import`)。
  どちらも外部CDN依存で、ローカルにはコピーしていない。
- `layouts/*.html` に Google Analytics(gtag)と jQuery(Google CDN)が入っている。
  意図なく外さない。
- `static/js/t.js` はサードパーティ製の minified 風コード。編集しない。
- 相対パス(`css/...`, `./js/t.js`, `favicon.ico`)でアセットを参照している。
  ページを深いパスに置く場合は壊れるので、今はルート直下に置く運用。
- `.github/workflows/merge-schedule.yml` は「マージ予約」用
  ([gr2m/merge-schedule-action](https://github.com/gr2m/merge-schedule-action))。
  PR説明に `/schedule 日時` を書くとその時刻に squash merge される(1時間ごとに判定)。
  予約マージ = 本番デプロイのタイミングでもあるので、PRを作るとき予約文言を勝手に入れない。
- `.vscode/` はローカルのログ置き場で、追跡対象外。
