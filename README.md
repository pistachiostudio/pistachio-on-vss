# pistachio-on-vss

[![Deploy vss site to Pages](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml/badge.svg)](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml)

testing for pistachiostudio.net on vss static site generator

[https://dev.pistachiostudio.net/](https://dev.pistachiostudio.net/)

## vss

[zztkm/vss: Easy-to-use static site generator](https://github.com/zztkm/vss)

## deploy

デプロイは GitHub Actions で自動化されています

デプロイの進捗や履歴は [GitHub Actions](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml) を確認してください

以下をトリガーにしてデプロイされます
- main ブランチへの push
- README.md と archive dir 以外のファイルへの変更

### settings

デプロイ設定については以下を確認してください

- GitHub Pages の設定
    - [Configuring a publishing source for your GitHub Pages site - GitHub Docs](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)

- Actions の設定
    - Actions の動作内容については以下のファイルに定義されています
    - [.github/workflows/pages.yml](https://github.com/pistachiostudio/pistachio-on-vss/blob/main/.github/workflows/pages.yml)
- カスタムドメインの設定
    - [GitHub Pages サイトのカスタムドメインを管理する - GitHub Docs](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain)

その他 Actions とは？などについてはご自分で検索してください