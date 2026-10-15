---
name: live-update
description: トップページ(index.md)の Upcoming Party にライブ情報を追加し、終わった公演を past.md の Past Parties に移すスキル。書式は既存の告知に合わせ、まずサンプルを見せてから反映する。「ライブ情報を追加して」「Upcoming Party を更新」「終わったライブを past に移して」「ライブ予定を整理して」などで使う。
---

# live-update — ライブ告知の追加と Past への移動

`index.md` 冒頭の "Upcoming Party" と、`past.md` の "Past Parties" を管理する。
このスキルは **現在日時を確認 → 終わった公演を洗い出す → 新しい公演を足す → サンプルを見せる → 反映** の流れを担当する。

## 流れ

### 1. 現状を確認する

- 最初に `date "+%Y-%m-%d (%a) %H:%M"` で今日の日付を確認する。
- `index.md` の "Upcoming Party" と、`past.md` の先頭(最新年)を読む。
- 予定の元ネタが欲しいときは、Google カレンダー **Pistachio Schedule**
  (`pistachiostudio2010@gmail.com`)を見る。ただしリハ・スタジオ・レコーディング・
  打ち合わせ・飲み会なども混ざっているので、本番だけを拾い、怪しいものはユーザーに確認する。

### 2. 終わった公演を past.md に移す

- Upcoming の日付が**今日より前**のものは、`index.md` から消して `past.md` に移す。
  当日の公演は移さない。
- `past.md` の書式(新しい順、年ごとに `### YYYY` 見出し):

  ```md
  ### 2026

  10.17

    - CBS & Chicken Is Nice @Futakoshinchi

  ### 2025

  03.08

    - Pistachio Studio @WWW, Shibuya
  ```

  - 日付は `MM.DD`。その下に空行、スペース2つ + `- ` で `出演者 @会場, 地名`。
  - その年の見出しがなければ、一番上(`### Past Parties` の直後)に `### YYYY` を足す。
  - `[SOLD]` や `[>>>](URL)` は past には持ち込まない。
  - TBA のまま終わった公演は、実際の出演者や会場をユーザーに確認してから書く。

### 3. 新しい公演を index.md に足す

書式(日付の古い順):

```md
### Upcoming Party

#### 2026.10.17

CBS & Chicken Is Nice @Futakoshinchi

#### 2026.11.21 [>>>](https://告知ページのURL)

CBS & Chicken Is Nice @Bar Chit Chat, Shin-Yurigaoka

#### 2026.12.12

(;@_@)<TBA...

<!-- Nothing on the calendar yet! L(@_@;) -->

#### 
[Past Parties>>>](/past)
```

- 見出しは `#### YYYY.MM.DD`。曜日は書かない。
- 本文は `出演者 @会場名, 地名` で、**すべてアルファベット**(日本語の地名もローマ字にする。
  例: 新百合ヶ丘 → Shin-Yurigaoka、二子新地 → Futakoshinchi)。
  会場名がない(屋外など)ときは `@地名` だけでよい。
- 告知ページ(X、Instagram、会場のスケジュールページなど)があれば、日付の横に `[>>>](URL)` を付ける。
- 売り切れたら本文の先頭に `[SOLD] ` を付ける。
- 詳細が決まっていない回は `(;@_@)<TBA...`。
- 出演者名は過去の表記に合わせる(`CBS & Chicken Is Nice`、`CBS`、`Pistachio Studio` など)。
  分からないときは推測で埋めず、ユーザーに確認する。

### 4. 空になったときの扱い

- 予定が1件もなくなったら、`### Upcoming Party` の直下に
  `Nothing on the calendar yet! L(@_@;)` を置く(コメントアウトした同じ行はそのまま残す)。
- 予定があるあいだは、この行はコメントアウトの1行だけにしておく。

### 5. サンプルを見せる(ここで一度止まる)

`index.md` と `past.md` の変更後の姿をチャットに出し、OK をもらってからファイルを書き換える。
分からない項目(出演者、会場、リンク)は、サンプルと一緒に箇条書きで質問する。

### 6. 反映する

- ファイルを書き換えたら `vss build` でビルドが通ることを確認する(`AGENTS.md` の「ビルドと確認」参照)。
- コミット・プッシュはユーザーに頼まれたときだけ行う。`main` へのプッシュは本番に即デプロイされるので、
  ブランチを切るか、ユーザーが main に直接と言ったときだけ main に入れる。
