# pistachio-on-vss

[![Deploy vss site to Pages](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml/badge.svg)](https://github.com/pistachiostudio/pistachio-on-vss/actions/workflows/pages.yml)

testing for pistachiostudio.net on vss static site generator

[https://dev.pistachiostudio.net/](https://dev.pistachiostudio.net/)

## vss

[vss: Easy-to-use static site generator](https://github.com/vssio/vss) by [zzktkm](https://github.com/zztkm)

## deploy

デプロイは GitHub Actions で自動化されおり、以下をトリガーにしてデプロイされます

- main ブランチへの push (マージも含む)
- README.md と archive dir 以外のファイルへの変更

#### settings

デプロイ設定については以下を確認してください

- GitHub Pages の設定
    - [Configuring a publishing source for your GitHub Pages site - GitHub Docs](https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)

- Actions の設定
    - Actions の動作内容については以下のファイルに定義されています
    - [.github/workflows/pages.yml](https://github.com/pistachiostudio/pistachio-on-vss/blob/main/.github/workflows/pages.yml)

- カスタムドメインの設定
    - [GitHub Pages サイトのカスタムドメインを管理する - GitHub Docs](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain)

## Operation note

すぐに忘れるのでメモ

#### ローカルで色々チェックするとき

- vss.exeのlatestをルートに配置する
- ビルドコマンドを実行
  - bash: `./vss build`
  - cmd: `vss build`
- これで/distフォルダにビルドされる
- /distフォルダでLive Serverを起動してチェックなどする
- 本番に影響するのは/layoutsや/staticなので、/distでいじって最終は/layoutsや/staticをいじる。
- /layoutsの.htmlはcssやjsのパスが違うので注意する。

#### vss.exeをlatestに更新する

- Makefileを[これ](https://github.com/veltiosoft/kansuya/blob/main/Makefile)に
- `make setup-win`


## Install scripts (Windows only)

#### PowerShellで下記を実行
```
irm https://raw.githubusercontent.com/vssio/vss_install/main/install.ps1 | iex
```

- 最新のvss.exeが `C:\Users\xxxxx\.vss\bin` に配置される
- 環境変数でパスを通してくれる
- vssのアップデートも同じスクリプトを実行すればOK

うまくインストールが成功していれば、
```
$ vss help
```
でヘルプが表示される。