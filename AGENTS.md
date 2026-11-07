# AGENTS.md

pistachiostudio.net のソースリポジトリ。静的サイトジェネレーター [VSS](https://github.com/veltiosoft/vss)
で Markdown をビルドし、GitHub Pages に配信している。人向けの説明は `README.md`、
このファイルは AI エージェント(Claude など)向けの作業メモ。

## 基本ルール

- 返答・コミットメッセージ・PR説明は日本語(既存のコミット履歴に合わせる)。
- `main` へのプッシュ(マージ含む)は **本番サイトに自動デプロイされる**。
  作業は必ずブランチを切って行い、`main` に直接コミット/プッシュしない。
  コミット・プッシュ・PR作成は、ユーザーに頼まれたときだけ行う。
- ビルド成果物(`dist/`)と VSS のバイナリ(`vss` / `vss.exe` / `vss_*.tar.gz` / `vss_*.zip`)は
  `.gitignore` 済み。コミットしない。

## ビルドと確認

```bash
make setup-mac   # VSS本体を取得。Apple Silicon Mac。Linuxは `make setup`、Windowsは `make setup-win`
make build       # = ./vss build → dist/ に生成
vss serve        # ファイル変更を見ながらローカルプレビュー
```

- VSS が既に PATH にある場合(`~/.vss/bin/vss` など)は `vss build` を直接使ってよい。
- CI(`.github/workflows/pages.yml`)は `make setup`(固定した版の vss を取得し SHA256 を検証)→
  `make build` → `dist/` を Pages にアップロード。`README.md` / `AGENTS.md` / `.claude/**` /
  `archive/**` だけの変更ではデプロイは走らない(`paths-ignore`)。PR ではビルドだけ走り、
  デプロイはしない。
- vss のバージョンは `Makefile` の `VSS_VERSION` で固定している(latest だと破壊的変更が
  そのまま本番に入るため)。上げるときは `VSS_VERSION` と3つの `VSS_SHA256_*` を一緒に更新し、
  リリースノートの CHANGE 項目を確認したうえで、旧版と新版で `dist/` を比べるとよい。
- ローカルの vss が CI と違う版だと挙動が変わることがある(例: 手元が 0.11.0)。
  `vss --version` を確認し、`make setup*` で入れ直してから検証すると確実。
- **ルート直下などの `.md` は、そのままだとページとして公開される**
  `README.md` / `AGENTS.md` / `SKILL.md` は
  `vss.toml` の `ignore_files`(ファイル名一致)で除外している。新しい説明用 `.md` を
  リポジトリに足すときは、公開したくなければ同様に `ignore_files` へ追加すること。
  0.21.0 で `dist/` に出ないことを確認済み。古い vss(0.11.0)ではこの除外が
  効かず、手元のビルドで `AGENTS.html` などが出力される(CI には影響しない)。
  なお `SKILL.md` の frontmatter は YAML として不正だと(`description` に `: ` を含めるなど)
  古い vss ではビルドエラーになる。
- vss 0.21.0 からは `.` 始まりのディレクトリ(`.claude/` など)の `.md` は自動でページ化
  されない。`SKILL.md` を `ignore_files` に残しているのは、PATH にある古い vss 向けの保険。
  また 0.21.0 以降はシンボリックリンクがビルド対象外になったので、入力は通常のファイルとして置く。
- `vss build` は `dist/` を掃除しない。過去のビルドの古いファイル
  (`dist/css/beach_style.css` など)が残っていることがあるが、無視してよい。
  クリーンな確認をしたいときは `dist/` ごと消してから再ビルドする。
- テストやリンターは無い。変更後は `vss build` が通ること、必要ならブラウザで
  実際の見た目を確認すること。

## 構成

```
*.md                 各ページの本文。先頭の frontmatter `title:` がタブと見出しになる
  index.md             トップ。タイトルだけで、中身は partials/ にある
  past.md              過去の公演。<div class="past"> の中に年・日付・出演を書く
partials/            トップの各ブロックの中身(ひとこと / next_shows / members / find_us)。単独のページにはならない
layouts/             HTMLテンプレート。ページと同名のlayoutがあればそれ、なければ default.html
  index.html           トップ用(犬のデータ dogs.js も読む)
  default.html         下のページ用(景色だけ。"← Top" とページ見出しを出す)
static/              そのまま dist/ にコピーされる静的ファイル
  css/style.css        すべての CSS。色は :root のトークンだけ
  js/scene.js          うしろの canvas に、夜の川べり(と犬)を文字で描く
  js/dogs.js           犬の濃淡と形のデータ(写真から作ったもの。約 220KB。手で編集しない)
vss.toml             サイト設定(title / description / base_url / build設定)
archive/             CNAME など。変更してもデプロイは走らない(paths-ignore)。基本触らない
.claude/skills/      プロジェクト用スキル(live-update)
prototypes/          (追跡対象外)デザインの試作。コミットしない
```

- `vss.toml` の `allow_dangerous_html = true` により、Markdown 内の HTML とコメントアウトが効く(partials/ にも効く)。
- レイアウトのテンプレート構文は `{{title}}` / `{{site_title}}` / `{{site_description}}` /
  `{{base_url}}` / `{{{contents}}}`(VSS 標準)。`{{title}}` は各 .md の frontmatter `title:`。
  書き忘れるとタブのタイトルが空になる(以前は全ページ空だった)。
- 2つのレイアウトは **ほぼ同じ中身の複製**。共通部分(head の GA・OGP・favicon・フォント、
  ヘッダー、フッター、外部リンクを新しいタブで開くスクリプト)を変えるときは **2ファイルとも** 直す。
- スクリプトや長い CSS はレイアウトに直書きせず `static/` に置く(テンプレートの `{{ }}` と
  ぶつからないように)。

### トップページの中身(partials/)

トップの4ブロックは、VSS の Markdown パーシャル機能で `partials/` の .md から差し込んでいる。
`partials/` の .md は単独のページにならない。`index.md` 自体はタイトルだけで、中身はない。

| ファイル | ブロック | 書き方 |
|---|---|---|
| `partials/ひとこと.md` | ひとこと | 普通の文章。話題ごとに空行で区切る。空にするとブロックごと消える |
| `partials/next_shows.md` | NEXT SHOWS | past.md と同じ。`YYYY.MM.DD` の行、空行、`  - 出演 @会場, 地名`。詳細未定は `  - TBA (;@_@)`。空にすると "Nothing on the calendar yet!" |
| `partials/members.md` | MEMBERS | `- [名前](URL)`。リンクが複数ある人は `- 名前` の下に `  - [web](URL)` のように字下げして並べる(押すと開く形になる) |
| `partials/find_us.md` | FIND US | `- [名前](URL)` のリスト |

- 見出し、`<section>`、「Past shows」「All accounts →」のリンク、空のときの文は `layouts/index.html` にある。
- レイアウトでは `{{{partials.名前}}}` で差し込み、`{{#partials.名前}}…{{/partials.名前}}` はファイルが空なら出ない、
  `{{^partials.名前}}…{{/partials.名前}}` は空のときだけ出る。名前は `partials/` からの相対パスで拡張子なし。
  ramhorns の `{{>file}}` は使えない(ビルドエラー)。
- MEMBERS の開閉と、NEXT SHOWS の TBA を暗くするのは `layouts/index.html` の短いスクリプト。
- 外部リンク(`http` で始まる href)は、レイアウトのスクリプトが自動で新しいタブで開くようにする。

## 見た目の仕組み(重要)

夜の川べりを、文字のマス目で canvas に描いている(`static/js/scene.js`)。文字(HTML)は左の列に重ねる。

- 景色: 星(たまに流れ星)、向こう岸の高架と窓の明かり、ときどき通る電車、川のさざなみと映り込み、手前の草。
- 川べりの人と船(試作): 手前の岸の右はしに釣り人がいつも座っていて(光る電気ウキ)、ときどき竿を振って投げ直す。
  魚が釣れるのは、ページを見ているあいだが 8 分たつごと(超レア)。屋形船は 4 分ごとに川を通る(赤い提灯が川に映る)。
  どちらもタブが裏のあいだは時間を数えない。懐中電灯で散歩する人は保留中で、`?walk` のときだけ出る。
- 犬: トップページだけ。`dogs.js` の `window.DOGS` に [0] 座っている犬 / [1] 寝ている犬。
  開くたびに 10 回に 1 回くらい寝ている犬になる。URL に `?dog=sit` / `?dog=sleep` を付けると選べる。
  `window.DOGS` がないページ(下のページ)は、犬を描かず景色だけ。
- 文字のある行は、canvas 側でその下の絵を空ける(テキストの位置を測って毎回マスクを作る)。
- 広い画面(820px 以上)は犬を右寄り、スマホ幅は真ん中。スマホ幅では中身のあとに 1 画面ぶんの余白があり、
  下までスクロールすると絵だけになる。ヘッダー(サイト名とタグライン)は上に固定。
- 動きを減らす設定(`prefers-reduced-motion`)では、絵は 1 コマだけ描いて止まる。
- 試しに見るときの URL パラメータ: `?shoot`(流れ星をすぐ出す)、`?boat` / `?walk` / `?fish` / `?cast`(屋形船 / 散歩の人 / 魚が釣れる / 竿の投げ直しをすぐ出す)、`?sim=秒`(乱数を固定して指定秒ぶん進めた絵)。

### 色

**色は `static/css/style.css` の `:root` のトークンだけで管理する。** canvas もここから色を読む。
ほかの場所に色を直接書かないこと。新しい色が要るときは `:root` にトークンを足す。

`--bg` / `--fur-dim` / `--fur` / `--white` / `--tongue` / `--scene-dim` / `--scene` / `--water` / `--lamp` / `--lantern` / `--float`

例外: `static/manifest.json` の `theme_color` / `background_color` と、レイアウトの
`<meta name="theme-color">` は `--bg` と同じ値(#202020)を直書きしている。`--bg` を変えたら合わせる。

## 注意点

- フォントは Google Fonts の M PLUS 1 Code(SIL OFL 1.1)。`layouts/*.html` の `<head>` で読み込む外部CDN依存。
  canvas の絵も同じフォントで描くので、フォントを変えると犬の見え方も変わる。
- `layouts/*.html` に Google Analytics(gtag)が入っている。意図なく外さない。
- 以前の仕組み(カラーテーマの切り替えと theme-swap スキル、左上のドット絵の猫、t.js と jQuery の
  タイプライター演出、Font Awesome のアイコン、VHS 風の RGB ずれ)は 2026-11 の作り直しで廃止した。
- 相対パス(`css/...`, `js/...`, `favicon.ico`)でアセットを参照している。
  ページを深いパスに置く場合は壊れるので、今はルート直下に置く運用。
- `.github/workflows/merge-schedule.yml` は「マージ予約」用
  ([gr2m/merge-schedule-action](https://github.com/gr2m/merge-schedule-action))。
  PR説明に `/schedule 日時` を書くとその時刻に squash merge される(1時間ごとに判定)。
  予約マージ = 本番デプロイのタイミングでもあるので、PRを作るとき予約文言を勝手に入れない。
- `.vscode/` はローカルのログ置き場で、追跡対象外。
