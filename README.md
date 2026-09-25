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

サイトの配色は `static/css/themes.css` に1テーマ分だけまとまっていて、
`layouts/*.html` の `<body data-theme="...">` でそれを有効にする仕組みになっている
(色は全部CSS変数で、構造用CSSの `static/css/style.css` / `static/css/vhs.css` 側は
一切いじらなくていい)。

テーマ替えは都度Claudeに頼めばよい。Claudeが `static/css/themes.css` の中身と、
3つのレイアウト (`default.html` / `quojama.html` / `20230826.html`) にある
`data-theme` 属性・左上のドットアイコン・ヘッダーの "Theme: ..." 表記をまとめて
書き換える。

過去に使ったテーマのCSSは残していない。名前だけ `static/css/themes.css` の
コメントに記録してある(Meditation for blue / Beach / SETUPTOOLS /
Classic Brown Sounds 2 / Merry Xmas)。過去のテーマを復活させたいときも、
名前を伝えてClaudeに作り直してもらう想定。

左上のドットアイコンも色・柄ともに変更可能。今の猫の形は
`static/css/dot/cat.css` にCSSの `box-shadow` でドット絵として書かれていて、
色は `--dot-color-a` / `--dot-color-b` の2変数(themes.css側)で決まる。
形自体を変えたい場合は新しいドット絵を用意する必要があるので、それもClaudeに
相談すればよい。

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