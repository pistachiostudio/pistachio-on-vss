# pistachio-on-vss

[![Deploy vss site to Pages](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml/badge.svg)](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml)

Pistachio Studio の公式サイト → **https://pistachiostudio.net/**

このリポジトリは **AI エージェント（Claude Code など）に操作させること**を前提に作っています。
コードを書ける人も書けない人も、やりたいことを日本語で頼めば、AI が更新・ビルド・確認までやってくれます。

## AI に頼む

1. このリポジトリを AI エージェントで開く（`git clone` してそのフォルダで起動するだけ）。
2. やりたいことを日本語で伝える。

AI は最初に [`AGENTS.md`](AGENTS.md) を読みます。ファイル構成、コマンド、カラーテーマの仕組み、落とし穴はすべてそこに書いてあるので、人間が細かく説明する必要はありません。

### 頼み方の例

| やりたいこと | 頼み方の例 |
|---|---|
| 次のパーティ告知を出す | 「Upcoming Party に 12/20 の告知を載せて。会場は◯◯、開演は◯時」 |
| 告知を引っ込める | 「Upcoming Party を "Nothing on the calendar yet!" に戻して」 |
| 過去のパーティを追加 | 「Past Parties の 2025 に 03.08 Pistachio Studio @WWW, Shibuya を追加して」 |
| メンバーを追加 | 「Members に◯◯さんを追加して。SoundCloud はこれ」 |
| SNS リンクを追加・修正 | 「social ページに◯◯の X アカウントを足して」 |
| 配色を変える | 「テーマを変えて」（`theme-swap` スキルが候補を名前つきで出します。気に入ったものを選ぶと全ページに適用） |
| 変更を確認する | 「ビルドして、`vss serve` で表示を確認して」 |
| 公開する | 「commit して main に push して」 |

- **`main` への push は、そのまま本番サイトに公開されます。** AI は頼まれない限り commit / push しない決まりになっています。公開したいときは、はっきり頼んでください。
- 作業内容に自信がなければ、「push はしないで、差分だけ見せて」と頼めば安心です。
- 公開日時を指定したいときは「その日にマージされるようにして」と頼めます（[マージ予約](#公開の仕組み)）。

### カラーテーマを変えるとき

サイト全体の配色は、`static/css/themes.css` の **有効なテーマ 1 つ分**の CSS 変数で決まります。
「テーマを変えて」と頼むと、AI は次の順に進めます。

1. 今のテーマを確認して、雰囲気の違う候補を 4〜5 案、**テーマ名つき**で見せる（名前は `Neon Drive` のような 2 単語が基本）。
2. あなたが選ぶまで、ファイルは書き換えない。
3. 選ばれたら、次をまとめて書き換える。
   - `static/css/themes.css` の配色ブロック
   - 3 つのレイアウト（`layouts/default.html` / `quojama.html` / `20230826.html`）の `data-theme` 属性
   - ヘッダーの "Theme: ..." 表記
   - 左上のドット絵アイコンの色（ドットの形そのものを変えたいときは別途相談してください）
4. `vss build` で確認する。

現在のテーマは **Neon Drive**（ダークパープル背景 × ネオンピンク/シアン）です。
過去に使ったテーマのコードは残していません。名前だけ `static/css/themes.css` の冒頭コメントに記録してあり、
復活させたいときは名前を伝えれば AI が作り直します。

## AI を使わずに更新する

ページの中身は、ルートにある Markdown を直接編集するだけです。

| ファイル | 内容 |
|---|---|
| `index.md` | トップページ（Upcoming Party、メンバー紹介） |
| `past.md` | 過去のパーティ一覧 |
| `social.md` | SNS アカウント一覧 |
| `contact.md` / `quojama.md` / `cbscin.md` / `game.md` / `oldnews.md` / `20230826.md` | 個別ページ |

- **告知を隠す/出す**: Markdown の HTML コメントアウト `<!-- ... -->` が使えます（`vss.toml` で有効化済み）。`index.md` の Upcoming Party はこの方法で切り替えています。
- ヘッダー、SNS アイコン、フッターは Markdown ではなく `layouts/*.html` にあります。3 つのレイアウトはほぼ同じ内容の複製なので、共通部分を変えるときは 3 つとも同じ変更が必要です。
- 色を変えたいときは CSS を直接触らず、上の「カラーテーマを変えるとき」の手順（AI）を使ってください。

## 公開の仕組み

`main` に push → GitHub Actions が `vss build` を実行 → `dist/` を GitHub Pages に公開。

- 静的サイトジェネレーター: [VSS](https://github.com/veltiosoft/vss)（ドキュメント: [vss.veltiosoft.dev](https://vss.veltiosoft.dev/)）
- ワークフロー: [.github/workflows/pages.yml](https://github.com/pistachiostudio/pistachio-on-vss/blob/main/.github/workflows/pages.yml)
- `README.md` / `AGENTS.md` / `.claude/**` / `archive/**` だけの変更では、デプロイは走りません。
- **マージ予約**: PR の説明に `/schedule 日時` と書くと、その時刻に自動でマージされます（[merge-schedule-action](https://github.com/gr2m/merge-schedule-action)）。マージ＝本番公開なので、公開のタイミングを決めたいときに使います。
- 設定まわりの参考:
  - [GitHub Pages の公開元を設定する](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)
  - [カスタムドメインの管理](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain)

## 手元で動かす準備

AI に作業させる場合も、ビルドと確認のために VSS 本体がローカルに必要です。

```bash
make setup-mac   # Apple Silicon Mac の場合。Linux は `make setup`、Windows は `make setup-win`
make build       # dist/ に生成される
vss serve        # ファイル変更を見ながらプレビュー
```

- `make` と `git` が必要です。VSS のバイナリと `dist/` は `.gitignore` 済みなのでコミットされません。
- 古い VSS だと CI と挙動が変わることがあります。ビルドがおかしいときは `make setup*` で入れ直してください。

詳細なコマンド、ファイル構成、カラーテーマの仕組み、既知の落とし穴は [`AGENTS.md`](AGENTS.md) にまとまっています。

## Acknowledgments

- [go-vss: Easy-to-use static site generator](https://github.com/vssio/go-vss) by [zzktkm](https://github.com/zztkm)
- [t.js: Lightweight $.Hypertext.Typewriter](https://github.com/mntn-dev/t.js) by [mntn-dev](https://github.com/mntn-dev)
- [VHS Retro](https://codepen.io/pbitos/pen/zypwVr) by [pbitos](https://codepen.io/pbitos)
- [Font Awesome](https://fontawesome.com/)
