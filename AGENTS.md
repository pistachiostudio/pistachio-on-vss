# AGENTS.md

[pistachiostudio.net](https://pistachiostudio.net/) のソースリポジトリ。静的サイトジェネレーター
[VSS](https://github.com/veltiosoft/vss) で Markdown を HTML にビルドし、GitHub Actions から GitHub Pages に配信している。

このファイルは、AI エージェント(Claude Code など)がこのリポジトリで作業するための **唯一の手引き**。
`README.md` は人向けの短い入口で、細かいことはすべてここに書く。ルール、構成、仕組み、落とし穴を
変えたら、このファイルも同じコミットで直すこと。

---

## 1. 基本ルール(必ず守る)

- **返答・コミットメッセージ・PR 説明は日本語。** 既存のコミット履歴に合わせる。
  コミットメッセージは 1 行目に「何をしたか」、空行のあとに「なぜ」を書く。
- **`main` に入ったもの(プッシュもマージも)は、そのまま本番サイトに自動デプロイされる。**
  - 作業は必ずブランチを切って行う。`main` に直接コミット・プッシュしない。
  - コミット・プッシュ・PR 作成・マージは、ユーザーに頼まれたときだけ行う。
  - ユーザーが「公開して」「main に push して」と言っても、ブランチ → PR → ユーザーの OK でマージ、の順で進める。
- **ビルド成果物とバイナリはコミットしない。** `dist/` と VSS のバイナリ(`vss` / `vss.exe` /
  `vss_*.tar.gz` / `vss_*.zip`)は `.gitignore` 済み。`prototypes/`(デザインの試作)と `.vscode/`(ローカルのログ置き場)も追跡対象外。
- **色は `static/css/style.css` の `:root` のトークンだけで管理する**(→ [8. 見た目の仕組み](#色))。
- **2 つのレイアウト(`layouts/index.html` と `layouts/default.html`)はほぼ同じ中身の複製。**
  共通部分を変えるときは 2 ファイルとも直す(→ [7. レイアウト](#7-レイアウト))。
- **PR に予約マージの文言(`/schedule 日時`)を勝手に入れない。** 予約マージ = 本番公開のタイミングになる。
- 変更後は `vss build` が通ることを確かめる。見た目に関わる変更は、ブラウザで実際の表示も見る。テストやリンターは無い。

---

## 2. よくある依頼と触るファイル

| 依頼の例 | 触るファイル | 注意 |
|---|---|---|
| 「ひとことを『◯◯』に変えて」「ひとことに 1 行足して」 | `partials/ひとこと.md` | 普通の文章。話題ごとに空行で区切る。空にするとブロックごと消える |
| 「NEXT SHOWS に 12/20 の告知を載せて。会場は◯◯」 | `partials/next_shows.md` | **`live-update` スキルを使う**(`.claude/skills/live-update/`)。現在日時を確認してから、まずサンプルを見せる |
| 「終わったライブを past に移して」 | `partials/next_shows.md` → `past.md` | 同じく `live-update` スキル |
| 「NEXT SHOWS を "Nothing on the calendar yet!" に戻して」 | `partials/next_shows.md` | ファイルを空にする(文言はレイアウト側にある) |
| 「PAST SHOWS の 2025 に 03.08 Pistachio Studio @WWW, Shibuya を足して」 | `past.md` | `<div class="past">` の中。`### YYYY`、`MM.DD`、`  - 出演 @会場, 地名` の順 |
| 「MEMBERS に◯◯さんを追加して。SoundCloud はこれ」 | `partials/members.md` | リンクが複数ある人は字下げで並べる(→ [6. トップページ](#6-トップページの中身partials)) |
| 「social ページに◯◯の X アカウントを足して」 | `social.md` | 見出し(`### X` など)ごとの `- [@名前](URL)` のリスト。`_` は `\_` にエスケープ |
| 「公式アカウント(FIND US)を足して/直して」 | `partials/find_us.md` | **`layouts/index.html` の JSON-LD の `sameAs` と `static/llms.txt` の 2 か所も合わせる** |
| 「新しいページを作って」 | ルートに `名前.md` | frontmatter に `title` / `description` / `post_slug` を書き、`static/sitemap.xml` にも足す(→ [9. 検索まわり](#9-検索まわりseo-と-ai-向け)) |
| 「告知を一時的に隠して」 | 該当の `.md` | HTML コメント `<!-- ... -->` で囲む(`allow_dangerous_html = true` なので効く) |
| 「表示を確認して」 | — | `vss build` → `vss serve`(→ [3. ビルドとプレビュー](#3-ビルドとプレビュー)) |
| 「公開して」 | — | ブランチ → コミット → PR → ユーザーの OK でマージ → 本番を確認(→ [10. 公開の流れ](#10-公開の流れと-ci)) |

---

## 3. ビルドとプレビュー

```bash
make setup-mac   # VSS 本体を取得(Apple Silicon Mac)。Linux は `make setup`、Windows は `make setup-win`
make build       # = ./vss build → dist/ に生成
vss serve        # ファイル変更を見ながらローカルプレビュー(http://localhost:8080)
```

- `make` と `git` が要る。`make setup*` は、固定した版の VSS をダウンロードし、SHA256 を検証してから展開する。
- VSS が既に PATH にある場合(`~/.vss/bin/vss` など)は `vss build` を直接使ってよい。
- Claude Code のプレビュー用に `.claude/launch.json` がある(名前 `pistachio-serve`、`vss serve`、ポート 8080)。
- **VSS のバージョンは `Makefile` の `VSS_VERSION` で固定している**(今は `v0.21.0`。latest だと破壊的変更がそのまま本番に入るため)。
  - 上げるときは `VSS_VERSION` と 3 つの `VSS_SHA256_*`(Linux / macOS / Windows)を一緒に更新する。
    ハッシュは `gh api repos/veltiosoft/vss/releases/tags/<版> -q '.assets[] | "\(.name) \(.digest)"'` で見られる。
  - リリースノートの CHANGE 項目を確認し、旧版と新版で `dist/` を比べるとよい。
- **ローカルの vss が CI と違う版だと挙動が変わることがある**(例: 手元が 0.11.0)。
  `vss --version` を確認し、違えば `make setup*` で入れ直してから検証する。
- **`vss build` は `dist/` を掃除しない。** 過去のビルドの古いファイル(`dist/css/beach_style.css` など)が残っていることがあるが、無視してよい。
  クリーンな確認をしたいときは `rm -rf dist` してから再ビルドする。
- **ルート直下などの `.md` は、そのままだとページとして公開される。**
  - `README.md` / `AGENTS.md` / `SKILL.md` は `vss.toml` の `ignore_files` で除外している。
    `ignore_files` はパスに含まれる文字列での一致で、glob ではない。
  - 説明用の `.md` を新しく足すとき、公開したくなければ `ignore_files` に追加する。
    0.21.0 で `dist/` に出ないことを確認済み。古い vss(0.11.0)ではこの除外が効かず、
    手元のビルドで `AGENTS.html` などが出る(CI には影響しない)。
  - そのため、このファイルを複数の `.md` に分けない。
- vss 0.21.0 からは、`.` 始まりのディレクトリ(`.claude/` など)の `.md` は自動でページ化されない。
  `SKILL.md` を `ignore_files` に残しているのは、PATH にある古い vss 向けの保険。
  なお `SKILL.md` の frontmatter が YAML として不正だと(`description` に `: ` を含めるなど)、古い vss ではビルドエラーになる。
- 0.21.0 以降、シンボリックリンクはビルド対象外。入力は通常のファイルとして置く。
- `static/` の中身はそのまま `dist/` にコピーされる。隠しパスはコピーされないが、`static/.well-known/` だけは例外でコピーされる。

---

## 4. 構成

```
*.md                 各ページの本文(frontmatter → 5. ページと frontmatter)
  index.md             トップ。frontmatter だけで、中身は partials/ にある
  past.md              過去の公演。<div class="past"> の中に年・日付・出演を書く(2016 年から)
  social.md            Pistachio Studio とメンバーの Web サイト・X・Instagram などの一覧
  contact.md           連絡先。メールアドレスとコピーボタン(js/copy.js)
  cbscin.md            CBS と Chicken Is Nice(ハウスバンド)のメンバーとパート
  game.md / oldnews.md / 20230826.md   どこからもリンクされていないページ(sitemap.xml にも載せていない)
partials/            トップの各ブロックの中身(ひとこと / next_shows / members / find_us)。単独のページにはならない
layouts/             HTML テンプレート。ページと同名の layout があればそれ、なければ default.html
  index.html           トップ用(犬のデータ dogs.js も読む。JSON-LD もここだけ)
  default.html         下のページ用(景色だけ。"← Top" とページ見出しを出す。copy.js を読む)
static/              そのまま dist/ にコピーされる静的ファイル
  css/style.css        すべての CSS。色は :root のトークンだけ
  js/scene.js          うしろの canvas に、夜の川べり(と犬)を文字で描く(約 58KB)
  js/dogs.js           犬の濃淡と形のデータ(写真から作ったもの。約 220KB。手で編集しない)
  js/copy.js           data-copy のボタンでコピーして copied! を出す(contact.md のメールアドレス。default.html が読む)
  sitemap.xml          Search Console に送るサイトマップ。手書き。リンクのあるページだけ載せている
  robots.txt           全部許可と、sitemap.xml の場所
  llms.txt             AI 向けのサイト案内(llmstxt.org の形式)。変わりにくい事実とページへのリンクだけ書く
  .well-known/security.txt  脆弱性の連絡先(RFC 9116)。**`Expires`(今は 2027-11-08)が来る前に日付を延ばす**
  manifest.json        PWA のマニフェスト。theme_color / background_color は #202020
  favicon.ico / apple-touch-icon.png / manifest_logo*.png / og_image_banana_maru.png(OGP 画像、620×620)
vss.toml             サイト設定(site_title / site_description / base_url / build 設定)
Makefile             VSS の取得(版と SHA256 を固定)とビルド
.github/
  workflows/pages.yml           ビルドとデプロイ(→ 10.)
  workflows/merge-schedule.yml  予約マージ(→ 10.)
  dependabot.yml                アクションの更新 PR を月 1 回まとめて作る
.claude/
  skills/live-update/  プロジェクト用スキル。NEXT SHOWS の追加と、終わった公演の past.md への移動
  launch.json          プレビュー用の dev サーバー設定
prototypes/          (追跡対象外)デザインの試作。コミットしない
```

---

## 5. ページと frontmatter

各ページの .md の先頭に、次の frontmatter を書く。

```yaml
---
title: Past Shows
description: "検索結果に出る説明文。ページの中身から事実だけを短く"
post_slug: "past"
---
```

| キー | 役割 | 書かないと |
|---|---|---|
| `title` | タブのタイトルとページ見出し、`og:title` | タブのタイトルが空になる |
| `description` | `<meta name="description">` と `og:description` | `vss.toml` の `site_description` が使われる |
| `post_slug` | canonical と `og:url` の URL(`https://pistachiostudio.net/<post_slug>`) | canonical と `og:url` が出ない |

- 値は引用符で囲む。とくに `description` は `: ` を含むとビルドエラーになり、`post_slug` は `"20230826"` のような数字だけの名前だと数値扱いでエラーになる。
- **`post_slug` は出力先を変えない**(VSS では出力パスは .md のファイルパスで決まる)。必ずファイル名(`.html` なし)と同じにする。
  違うと、検索エンジンに存在しない URL を教えてしまう。
- URL は `.html` なしの形(`/past`)で統一している。GitHub Pages は `/past` と `/past.html` のどちらでも 200 を返すので、
  canonical でどちらが正しいかを伝えている。サイト内リンクも sitemap.xml も `.html` なし。
- VSS の frontmatter で使えるキーは決まっている(`title` / `description` / `author` / `pub_datetime` / `post_slug` / `is_post` / `draft` / `og_image` / `tags`)。
  それ以外のキーはテンプレートに渡らない。
- `vss.toml` の `allow_dangerous_html = true` により、Markdown 内の HTML とコメントアウトが効く(partials/ にも効く)。
  告知を一時的に隠すときは `<!-- ... -->` で囲む。

---

## 6. トップページの中身(partials/)

トップの 4 ブロックは、VSS の Markdown パーシャル機能で `partials/` の .md から差し込んでいる。
`partials/` の .md は単独のページにならず、frontmatter も公開されない。`index.md` 自体は frontmatter だけで、中身はない。

| ファイル | ブロック | 書き方 |
|---|---|---|
| `partials/ひとこと.md` | ひとこと | 普通の文章。話題ごとに空行で区切る。空にするとブロックごと消える |
| `partials/next_shows.md` | NEXT SHOWS | past.md と同じ。`YYYY.MM.DD` の行、空行、`  - 出演 @会場, 地名`。詳細未定は `  - TBA (;@_@)`。空にすると "Nothing on the calendar yet! L(@_@;)" |
| `partials/members.md` | MEMBERS | `- [名前](URL)`。リンクが複数ある人は `- 名前` の下に `  - [web](URL)` のように字下げして並べる(押すと開く形になる) |
| `partials/find_us.md` | FIND US | `- [名前](URL)` のリスト。変えたら JSON-LD の `sameAs` と `llms.txt` も合わせる |

- 見出し、`<section>`、「Past shows →」「All accounts →」のリンク、空のときの文は `layouts/index.html` にある。
- レイアウトでは `{{{partials.名前}}}` で差し込む。`{{#partials.名前}}…{{/partials.名前}}` はファイルが空なら出ない、
  `{{^partials.名前}}…{{/partials.名前}}` は空のときだけ出る。名前は `partials/` からの相対パスで拡張子なし(`partials.ひとこと` のように日本語も可)。
- MEMBERS の開閉(入れ子のリストを `<details>` にする)と、NEXT SHOWS の TBA を暗くするのは `layouts/index.html` の短いスクリプト。
  スクリプトが動かないときは、入れ子のリストのまま見える。
- 外部リンク(`http` で始まる href)は、レイアウトのスクリプトが自動で `target="_blank" rel="noopener"` にする。
  Markdown 側で `target` を書く必要はない。

---

## 7. レイアウト

- テンプレートは Mustache(VSS は ramhorns を使う)。使える値:
  - `{{site_title}}` / `{{site_description}}` / `{{base_url}}`(`vss.toml` から)
  - `{{title}}` / `{{description}}` / `{{post_slug}}` など、各 .md の frontmatter の値
  - `{{{contents}}}`(本文の HTML。三重波括弧はエスケープしない)
  - `{{{partials.名前}}}`(→ [6. トップページの中身](#6-トップページの中身partials))
- `{{#値}}…{{/値}}` は値があるときだけ、`{{^値}}…{{/値}}` は値がないときだけ出る。
  ramhorns の `{{>file}}`(HTML の include)は使えない(ビルドエラー)。
- **2 つのレイアウトはほぼ同じ中身の複製。** 共通部分を変えるときは 2 ファイルとも直す。共通部分は次のとおり。
  - `<head>` の GA・OGP・favicon・manifest・フォント・CSS
  - ヘッダー(サイト名とタグライン)、フッター
  - 外部リンクを新しいタブで開くスクリプト、`©` の年を入れるスクリプト
- **ただし `<head>` には、わざと違う部分がある。** 片方からもう片方へそのまま写さないこと。

  | | `index.html`(トップ) | `default.html`(下のページ) |
  |---|---|---|
  | `<title>` / `og:title` | `{{site_title}}` | `{{title}} \| {{site_title}}` |
  | canonical / `og:url` | `{{base_url}}` をそのまま | `{{#post_slug}}` のガード付きで `{{base_url}}{{post_slug}}` |
  | JSON-LD | ある(WebSite と Organization) | ない |
  | 読むスクリプト | `dogs.js` → `scene.js` | `copy.js` → `scene.js` |
  | canvas の `aria-label` | 川べりの黒い犬 | 夜の川べり |

- スクリプトや長い CSS はレイアウトに直書きせず `static/` に置く(テンプレートの `{{ }}` とぶつからないように)。
  JSON-LD のように直書きするときは、`}}` が続かないよう閉じかっこを行で分ける。
- 2 つのレイアウトの先頭(`<!DOCTYPE html>` の前)のコメントに、figlet の ASCII ロゴがある。README のロゴと同じもの。
- `{{title}}` は各 .md の frontmatter `title:`。書き忘れるとタブのタイトルが空になる(以前は全ページ空だった)。

---

## 8. 見た目の仕組み(重要)

夜の川べりを、文字のマス目で canvas に描いている(`static/js/scene.js`)。文字(HTML)は左の列に重ねる。

### 景色と登場するもの

- 景色: 星(たまに流れ星)、向こう岸の高架と窓の明かり、ときどき通る電車、川のさざなみと映り込み、手前の草。
- 川べりの人と船:
  - 手前の岸の右はしに釣り人がいつも座っている(蛍光グリーンの電気ウキ)。ときどき竿を振って投げ直す。
  - 魚が釣れるのは、ページを見ているあいだが 8 分たつごと(超レア)。
  - 屋形船は 4 分ごとに川を通る(赤い提灯が川に映る)。
  - どちらも、タブが裏にあるあいだは時間を数えない。
  - 懐中電灯で散歩する人は保留中で、`?walk` のときだけ出る。
- 犬: トップページだけ。
  - `dogs.js` の `window.DOGS` に [0] 座っている犬 / [1] 寝ている犬。開くたびに 10 回に 1 回くらい寝ている犬になる。
  - `window.DOGS` がないページ(下のページ)は、犬を描かず景色だけ。
  - しぐさ: `look`(見回す)/ `snap`(パッと向く)/ `tilt`(首をかしげる)/ `pant`(ハアハア)/ `lick`(舌なめずり)/
    `sniff`(においをかぐ)/ `yawn`(あくび)/ `shake`(ぶるぶる)が重み付きでランダムに出る。
    寝ている犬は `rest`(じっとする)/ `twitch`(耳がぴくっと動く)/ `sigh`(ため息)だけ。
  - カーソルを目で追う。速く動かすと、パッとそっちを向く。カーソルを見ているあいだは見回すことが多い。
  - クリック(タップ)すると、`tilt` / `pant` / `lick` のどれかをする。
  - 犬の上でカーソルを動かすと、なでたことになる(毛並みが動き、続けると目を細める)。
  - リンクにカーソルが乗ると、耳がぴくっと上がる。まばたきもする。

### 配置と動き

- 文字のある行は、canvas 側でその下の絵を空ける(`.site` の中の文字の位置を測ってマスクを作る。スクロールや MEMBERS の開閉でも作り直す)。
- 広い画面(820px 以上)は犬を右寄り、スマホ幅は真ん中。
- スマホ幅では中身のあとに 1 画面ぶんの余白があり、下までスクロールすると絵だけになる。ヘッダー(サイト名とタグライン)は上に固定。
  手前の岸(釣り人がいるところ)は、スマホでもいつも見えている高さに収めている。
- 動きを減らす設定(`prefers-reduced-motion`)では、絵は 1 コマだけ描いて止まる。
- フォントは M PLUS 1 Code。canvas の絵も同じフォントで描くので、フォントを変えると犬の見え方も変わる。

### 試しに見るときの URL パラメータ

| パラメータ | 効果 |
|---|---|
| `?dog=sit` / `?dog=sleep` | 座っている犬 / 寝ている犬を選ぶ |
| `?act=しぐさの名前` | `?sim` と一緒に使う。そのしぐさのまま進めた絵を描く(`?sim=1&act=tilt` など。名前は上の一覧) |
| `?shoot` | 流れ星をすぐ出す |
| `?boat` / `?walk` / `?fish` / `?cast` | 屋形船 / 散歩の人 / 魚が釣れる / 竿の投げ直しをすぐ出す |
| `?sim=秒` | 乱数を固定し、指定した秒数ぶん進めた絵を 1 枚描く(タブのタイトルに JSON で状態が出る) |
| `?bench` | `?sim` と一緒に使う。描画 1 回あたりのミリ秒を測ってタイトルに出す |
| `?eyes=0` | 閉じた目を描かない(お試し用) |
| `?shadow=0` | 寝ている犬の下の景色を消す処理をしない(体の下に景色が透けて見える) |
| `?sink=数値` | 寝ている犬を画面の下に沈める量(画面の高さに対する割合。既定 0.02)を上書きする |

### 色

**色は `static/css/style.css` の `:root` のトークンだけで管理する。** canvas もここから色を読む。
ほかの場所に色を直接書かないこと。新しい色が要るときは `:root` にトークンを足す。

`--bg` / `--fur-dim` / `--fur` / `--white` / `--tongue` / `--scene-dim` / `--scene` / `--water` / `--lamp` / `--lantern` / `--float`

例外: `static/manifest.json` の `theme_color` / `background_color` と、レイアウトの
`<meta name="theme-color">` は `--bg` と同じ値(#202020)を直書きしている。`--bg` を変えたら合わせる。

---

## 9. 検索まわり(SEO と AI 向け)

- **ページを足すときは `title` / `description` / `post_slug` を書き、`static/sitemap.xml` にも足す**(→ [5.](#5-ページと-frontmatter))。
  - sitemap.xml には、サイト内からリンクのあるページだけ載せている(トップ / past / social / contact / cbscin)。
    game / oldnews / 20230826 は載せていない。ページを足したり消したりしたら合わせる。
- `<head>` に出しているもの: description、canonical、OGP(`og:type` / `og:site_name` / `og:locale=ja_JP` / `og:title` /
  `og:description` / `og:url` / `og:image`)、`twitter:card=summary`(OGP 画像が正方形なので `summary_large_image` にしない)、`twitter:site=@pstchstd`。
- トップ(`layouts/index.html`)の `<head>` には JSON-LD を直書きしている。
  - WebSite(検索結果のサイト名に使われる)と Organization(名前・説明・ロゴ・メール・`sameAs`)。
  - **公式アカウントの一覧は `partials/find_us.md`・JSON-LD の `sameAs`・`static/llms.txt` の 3 か所にある。** find_us.md を変えたら残りの 2 つも合わせる。
  - 変えたら、`dist/index.html` から JSON-LD を取り出し、JSON として読めるかを確かめる
    (例: `python -c "import re,json;h=open('dist/index.html',encoding='utf-8').read();json.loads(re.search(r'ld\+json\">(.*?)</script>',h,re.S).group(1))"`)。
  - 本番では Google のリッチリザルトテストで、Organization が「有効」と出ることを確認済み。
- `static/llms.txt` は AI 向けのサイト案内。ライブ予定やメンバーのような変わりやすい中身は書かず、ページへの案内にとどめる。
- `static/robots.txt` はすべて許可(AI のクローラーも含む)と、sitemap.xml の場所だけ。
- Google Search Console は、ドメインプロパティ(`pistachiostudio.net`)で DNS の TXT により確認済み。
  - ドメインプロパティでは、サイトマップを `https://pistachiostudio.net/sitemap.xml` と `https://` から全部入力する(`sitemap.xml` だけだと「無効」になる)。
  - DNS(ムームードメイン)には、以前からの `google-site-verification` の TXT も残している。
    MX が Google Workspace なので、その確認用かもしれない。**消さない。**

---

## 10. 公開の流れと CI

### 公開の流れ

1. ブランチを切って作業し、`rm -rf dist && vss build` が通ることを確かめる。
2. 頼まれたらコミット → プッシュ → `gh pr create --base main`(PR 説明は日本語。予約マージの文言は入れない)。
3. PR では CI のビルドだけが走る(デプロイはしない)。
4. ユーザーの OK が出たら `gh pr merge <番号> --merge --delete-branch` でマージする
   (履歴には「Merge pull request #NN from …」のマージコミットで残す)。
5. `main` の pages.yml の run が成功したかを `gh run list --workflow pages.yml --branch main` で見て、
   本番を `curl` などで確かめる。

### pages.yml(ビルドとデプロイ)

- `make setup`(固定した版の vss を取得し SHA256 を検証)→ `make build` → `dist/` を Pages にアップロード → デプロイ。
- `main` へのプッシュで動く。PR ではビルドだけ走り、`configure-pages` / `upload-pages-artifact` / `deploy` は飛ばす。
  **そのため、ワークフローの権限やアクションの不具合は PR の CI では見つからない。** ワークフローを変えたら、マージ後のデプロイの成功を必ず確かめる。
  失敗しても、前に公開したものがそのまま残る。
- `README.md` / `AGENTS.md` / `.claude/**` だけの変更ではデプロイは走らない(`paths-ignore`)。
- **`upload-pages-artifact` に `include-hidden-files: true` を付けている。** v4 からドットで始まるファイルが既定で外れるため。
  消すと `.well-known/security.txt` が本番から消える。
- 本番のドメインは GitHub Pages の設定のカスタムドメイン(`pistachiostudio.net`)。HTTPS は強制、`www.` と `http://` は `https://pistachiostudio.net/` に 301 で転送される。

### アクションの固定と更新

- ワークフローのアクションは、タグではなくコミットの SHA で固定している(`uses: actions/checkout@<SHA> # v7.0.1`)。
  タグを書き換えられる攻撃(2025 年の tj-actions/changed-files の事件など)への対策。
- 手で足すときは `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha` で SHA を取り、行末に `# vX.Y.Z` のコメントを付ける。
- 更新は `.github/dependabot.yml` が月 1 回、まとめて PR を作る。
  **メジャー更新や破壊的変更を含むことがあるので、各アクションのリリースノートを読んでからマージする**
  (例: upload-pages-artifact v4 の隠しファイル除外)。
- 各ワークフローの `permissions:` は最小にしてある(リポジトリの既定が write のため、書かないと全権限が付く)。
  - pages.yml: `contents: read` / `pages: write` / `id-token: write`(GitHub 公式の Pages スターターと同じ)
  - merge-schedule.yml: `contents: write` / `pull-requests: write` / `checks: read` / `statuses: read`
  - アクションを足して権限が足りなければ、そのジョブにだけ足す。
- checkout には `persist-credentials: false` を付け、ジョブ内にトークンを残さない。

### 予約マージ(merge-schedule.yml)

- [gr2m/merge-schedule-action](https://github.com/gr2m/merge-schedule-action) を使う。
  PR 説明に `/schedule 日時` を書くと、その時刻に squash merge される(1 時間ごとに判定。タイムゾーンは Asia/Tokyo。チェックがすべて成功している PR だけ)。
- フォークからの PR は、定時の処理でも PR 作成時の処理でも除外される(アクションのソースで確認済み)。外部の人には使えない。
- **予約マージ(GITHUB_TOKEN でのマージ)は、GitHub の仕様で `push` のワークフローを起動しない。**
  つまり予約マージしても pages.yml のデプロイは走らないはず(まだ使われた記録がないので未確認)。
  使ったら、デプロイが走ったかを Actions で確かめ、走っていなければ Actions タブから pages.yml を手動で実行する(`workflow_dispatch` あり)。
- 2026-11 に一度 `disabled_inactivity`(長く動かなかったため GitHub が停止)になっていたが、#30 でワークフローを変えたあと active に戻った。
  使う前に `gh workflow list --all` で状態を見るとよい。

---

## 11. 注意点・落とし穴

- フォントは Google Fonts の M PLUS 1 Code(SIL OFL 1.1)。`layouts/*.html` の `<head>` で読み込む外部 CDN 依存。
- `layouts/*.html` に Google Analytics(gtag、`G-5W20EVMG6T`)が入っている。意図なく外さない。
- アセットは相対パス(`css/...`, `js/...`, `favicon.ico`)で参照している。ページを深いパスに置くと壊れるので、ページはルート直下に置く。
  同じ理由で、独自の 404 ページは作っていない(深い URL の 404 では CSS が読めない)。
- `<meta>` での CSP は入れていない。レイアウトにインラインのスクリプトがあり効果が薄いうえ、GA を壊すおそれがあるため。
- `security.txt` の `Expires` は 1 年以内が決まり。期限(今は 2027-11-08)が来る前に日付を延ばす。
- 以前の仕組み(カラーテーマの切り替えと theme-swap スキル、左上のドット絵の猫、t.js と jQuery の
  タイプライター演出、Font Awesome のアイコン、VHS 風の RGB ずれ)は 2026-11 の作り直しで廃止した。
- 改行コードはファイルによって LF と CRLF が混在している(`git ls-files --eol` で見られる)。既存ファイルを編集するときは、
  そのファイルの改行コードを保つ。`sed -i` などで変わると、全行が差分に出る(past.md は一度これで LF になった)。
- `.claude/worktrees/` は Claude Code の作業用で、`.git/info/exclude` で除外している。

---

## 12. 人が AI を使わずに直すとき

- ページの中身は、ルートと `partials/` の Markdown を直接編集するだけ(→ [2. よくある依頼](#2-よくある依頼と触るファイル))。書き方は既存の行をまねる。
- ヘッダーとフッターは Markdown ではなく `layouts/*.html` にある。
- 手元で確かめるには、[3. ビルドとプレビュー](#3-ビルドとプレビュー) の手順で VSS を入れて `vss serve`。

---

## 13. 参考リンク

- VSS: [GitHub](https://github.com/veltiosoft/vss) / [ドキュメント](https://vss.veltiosoft.dev/)
- GitHub Pages: [カスタム GitHub Actions ワークフローで公開する](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow) /
  [カスタムドメインの管理](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [llms.txt](https://llmstxt.org/) / [security.txt(RFC 9116)](https://www.rfc-editor.org/rfc/rfc9116)
