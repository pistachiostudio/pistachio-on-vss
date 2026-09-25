# pistachio-on-vss

[![Deploy vss site to Pages](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml/badge.svg)](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml)

pistachiostudio.net on VSS static site generator

[https://pistachiostudio.net/](https://pistachiostudio.net/)

## VSS

[veltiosoft/vss: Easy\-to\-use static site generator](https://github.com/veltiosoft/vss)

Documentation: [vss.veltiosoft.dev/](https://vss.veltiosoft.dev/)

#### ローカルで動かす

```bash
make setup-mac   # Apple Silicon Mac の場合。Linuxは `make setup`、Windowsは `make setup-win`
make build       # dist/ に生成される
```

`vss serve` でファイル変更を見ながらプレビューもできる。

## カラーテーマの切り替え方

現在のテーマは **Neon Drive**(ダークパープル背景 × ネオンピンク/シアン)です。

### 仕組み

- 配色は `static/css/themes.css` に、有効なテーマ1つ分だけ書かれています。中身はCSS変数(`--main-bg-color`など)の上書きのみです。
- どのテーマを使うかは `layouts/*.html` の `<body data-theme="neon">` で指定します。
- 構造用のCSS(`static/css/style.css` / `static/css/vhs.css`)は色を持たないので、テーマを変えても触る必要はありません。

### テーマを変えたいとき

ファイルを直接編集する代わりに、Claudeに「テーマを変えて」と頼んでください。Claudeは以下をまとめて書き換えます。

1. `static/css/themes.css` の配色ブロック
2. 3つのレイアウト(`layouts/default.html` / `quojama.html` / `20230826.html`)の `data-theme` 属性
3. 同じくレイアウトにある、ヘッダーの "Theme: ..." 表記
4. 必要であれば左上のドットアイコン(下記参照)

過去に使ったテーマのCSSはあえて残していません。名前だけ `static/css/themes.css` の
コメントに記録してあります(Meditation for blue / Beach / SETUPTOOLS /
Classic Brown Sounds 2 / Merry Xmas)。復活させたいときも、名前を伝えれば
Claudeが作り直します。

### 左上のドットアイコンを変えたいとき

今の猫の形は `static/css/dot/cat.css` に、CSSの `box-shadow` でドット絵として
書かれています。色は `--dot-color-a` / `--dot-color-b` の2変数(`themes.css`側)
で決まるので、色だけならテーマ切り替えと一緒に自動で変わります。形そのもの
(猫以外のモチーフにする等)を変えたい場合は新しいドット絵が必要なので、
これもClaudeに相談してください。

## Deploy

Deployment is automated via GitHub Actions.

triggered by...
- A push to the main branch (including merges)
- Changes to `README.md` and `/archive dir` are ignored

#### settings

- GitHub Pages
    - [Configuring a publishing source for your GitHub Pages site - GitHub Docs](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)

- Actions
    - [.github/workflows/pages.yml](https://github.com/pistachiostudio/pistachio-on-vss/blob/main/.github/workflows/pages.yml)

- Custom domains
    - [GitHub Pages サイトのカスタムドメインを管理する - GitHub Docs](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain)

## Acknowledgments

- [go-vss: Easy-to-use static site generator](https://github.com/vssio/go-vss) by [zzktkm](https://github.com/zztkm)
- [t.js: Lightweight $.Hypertext.Typewriter](https://github.com/mntn-dev/t.js) by [mntn-dev](https://github.com/mntn-dev)
- [VHS Retro](https://codepen.io/pbitos/pen/zypwVr) by [pbitos](https://codepen.io/pbitos)
- [Font Awesome](https://fontawesome.com/)