# pistachio-on-vss

[![Deploy vss site to Pages](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml/badge.svg)](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml)

pistachiostudio.net on VSS static site generator

[https://pistachiostudio.net/](https://pistachiostudio.net/)

## VSS

[VSS: Easy-to-use static site generator](https://github.com/vssio/vss) by [zzktkm](https://github.com/zztkm)

### Installing VSS

#### For Windows PowerShell

```shell
irm https://raw.githubusercontent.com/vssio/vss_install/main/install.ps1 | iex
```

#### For Mac/Linux

[see here](https://github.com/vssio/vss#installation)

### Commands

```shell
$ vss serve
$ vss build
```

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

- [VSS: Easy-to-use static site generator](https://github.com/vssio/vss) by [zzktkm](https://github.com/zztkm)
- [t.js: Lightweight $.Hypertext.Typewriter](https://github.com/mntn-dev/t.js) by [mntn-dev](https://github.com/mntn-dev)
- [VHS Retro](https://codepen.io/pbitos/pen/zypwVr) by [pbitos](https://codepen.io/pbitos)
- [Font Awesome](https://fontawesome.com/)