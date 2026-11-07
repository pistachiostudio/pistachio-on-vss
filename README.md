# pistachio-on-vss

[![Deploy vss site to Pages](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml/badge.svg)](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml)

Pistachio Studio の公式サイト → **https://pistachiostudio.net/**

このリポジトリは **AI エージェント（Claude Code など）に操作させること**を前提に作っています。
コードを書ける人も書けない人も、やりたいことを日本語で頼めば、AI が更新・ビルド・確認までやってくれます。

## AI に頼む

1. このリポジトリを AI エージェントで開く（`git clone` してそのフォルダで起動するだけ）。
2. やりたいことを日本語で伝える。

AI は最初に [`AGENTS.md`](AGENTS.md) を読みます。ファイル構成、コマンド、見た目の仕組み、落とし穴はすべてそこに書いてあるので、人間が細かく説明する必要はありません。

### 頼み方の例

| やりたいこと | 頼み方の例 |
|---|---|
| 「ひとこと」を書き換える | 「ひとことを『◯◯』に変えて」「ひとことに 1 行足して」 |
| 次のパーティ告知を出す | 「NEXT SHOWS に 12/20 の告知を載せて。会場は◯◯」 |
| 告知を引っ込める | 「NEXT SHOWS を "Nothing on the calendar yet!" に戻して」 |
| 過去のライブを追加 | 「PAST SHOWS の 2025 に 03.08 Pistachio Studio @WWW, Shibuya を追加して」 |
| メンバーを追加 | 「Members に◯◯さんを追加して。SoundCloud はこれ」 |
| SNS リンクを追加・修正 | 「social ページに◯◯の X アカウントを足して」 |
| 変更を確認する | 「ビルドして、`vss serve` で表示を確認して」 |
| 公開する | 「commit して main に push して」 |

- **`main` への push は、そのまま本番サイトに公開されます。** AI は頼まれない限り commit / push しない決まりになっています。公開したいときは、はっきり頼んでください。
- 作業内容に自信がなければ、「push はしないで、差分だけ見せて」と頼めば安心です。
- 公開日時を指定したいときは「その日にマージされるようにして」と頼めます（[マージ予約](#公開の仕組み)）。

### 見た目の仕組み

夜の川べりと、メンバーの黒い犬を、文字(アスキーアート)で描いています。

- うしろの絵は `static/js/scene.js` が canvas に描きます。向こう岸の高架をときどき電車が通り、空には星と、たまに流れ星。
- トップページにだけ犬がいます。開くたびに 10 回に 1 回くらい、寝ている犬が出ます(`?dog=sit` / `?dog=sleep` を URL に付けると選べます)。犬はカーソルを目で追ったり、クリックで首をかしげたりします。
- 下のページ(past / social など)は、川と電車だけで犬はいません。
- 色はすべて `static/css/style.css` の `:root` にまとめてあります。

## AI を使わずに更新する

ページの中身は、ルートにある Markdown を直接編集するだけです。

| ファイル | 内容 |
|---|---|
| `partials/ひとこと.md` | トップの「ひとこと」 |
| `partials/next_shows.md` | トップの NEXT SHOWS（空にすると "Nothing on the calendar yet!"） |
| `partials/members.md` | トップの MEMBERS |
| `partials/find_us.md` | トップの FIND US |
| `past.md` | 過去のパーティ一覧 |
| `social.md` | SNS アカウント一覧 |
| `contact.md` / `cbscin.md` / `game.md` / `oldnews.md` / `20230826.md` | 個別ページ |

- トップページは、ブロックごとに `partials/` の Markdown に分かれています。どれも HTML なしの普通の Markdown です。書き方は既存の行をまねてください。
- **告知を隠す/出す**: Markdown の HTML コメントアウト `<!-- ... -->` が使えます（`vss.toml` で有効化済み）。
- 各ページの先頭の `title:`(frontmatter)が、ブラウザのタブとページの見出しになります。
- ヘッダーとフッターは Markdown ではなく `layouts/*.html` にあります。トップ用の `index.html` と下のページ用の `default.html` はほぼ同じ内容なので、共通部分を変えるときは 2 つとも同じ変更が必要です。

## 公開の仕組み

`main` に push → GitHub Actions が `vss build` を実行 → `dist/` を GitHub Pages に公開。PR ではビルドだけ走り、壊れていないかを確認します（公開はしません）。

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
- VSS のバージョンは `Makefile` の `VSS_VERSION` で固定しています（CI も同じ版を使います）。手元の VSS が違う版だと挙動が変わることがあるので、ビルドがおかしいときは `make setup*` で入れ直してください。

詳細なコマンド、ファイル構成、見た目の仕組み、既知の落とし穴は [`AGENTS.md`](AGENTS.md) にまとまっています。

## Acknowledgments

- [VSS: Easy-to-use static site generator](https://github.com/veltiosoft/vss) by [zztkm](https://github.com/zztkm)
- [M PLUS 1 Code](https://fonts.google.com/specimen/M+PLUS+1+Code) (SIL Open Font License 1.1)
