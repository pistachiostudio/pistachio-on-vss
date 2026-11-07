---
name: live-update
description: トップページ(index.md)の NEXT SHOWS にライブ情報を追加し、終わった公演を past.md の Past Parties に移すスキル。書式は既存の告知に合わせ、まずサンプルを見せてから反映する。「ライブ情報を追加して」「NEXT SHOWS を更新」「Upcoming Party を更新」「終わったライブを past に移して」「ライブ予定を整理して」などで使う。
---

# live-update — ライブ告知の追加と Past への移動

`index.md` の "NEXT SHOWS"(`<dl class="gigs">`)と、`past.md` の "Past Parties" を管理する。
同じ `index.md` の「ひとこと」に公演の話が書いてあれば、終わった公演の話は消すか書き換えるかをユーザーに確認する。
このスキルは **現在日時を確認 → 終わった公演を洗い出す → 新しい公演を足す → サンプルを見せる → 反映** の流れを担当する。

## 流れ

### 1. 現状を確認する

- 最初に `date "+%Y-%m-%d (%a) %H:%M"` で今日の日付を確認する。
- `index.md` の "NEXT SHOWS" と「ひとこと」、`past.md` の先頭(最新年)を読む。
- 予定の元ネタが欲しいときは、Google カレンダー **Pistachio Schedule**
  (`pistachiostudio2010@gmail.com`)を見る。ただしリハ・スタジオ・レコーディング・
  打ち合わせ・飲み会なども混ざっているので、本番だけを拾い、怪しいものはユーザーに確認する。

### 2. 終わった公演を past.md に移す

- NEXT SHOWS の日付が**今日より前**のものは、`index.md` から消して `past.md` に移す。
  当日の公演は移さない。
- `past.md` の書式(新しい順、年ごとに `### YYYY` 見出し)。すべて `<div class="past">` 〜 `</div>` の中に書く
  (日付と出演が2列に並ぶ。`<div>` の行のすぐ下とすぐ上は空行にする):

  ```md
  <div class="past">

  ### 2026

  10.17

    - CBS & Chicken Is Nice @Futakoshinchi

  ### 2025

  03.08

    - Pistachio Studio @WWW, Shibuya

  </div>
  ```

  - 日付は `MM.DD`。その下に空行、スペース2つ + `- ` で `出演者 @会場, 地名`。
  - その年の見出しがなければ、一番上(`<div class="past">` と空行の直後)に `### YYYY` を足す。
  - `SOLD` や告知ページへのリンクは past には持ち込まない。
  - TBA のまま終わった公演は、実際の出演者や会場をユーザーに確認してから書く。

### 3. 新しい公演を index.md に足す

NEXT SHOWS は HTML の `<dl class="gigs">`。1 公演 1 行で、日付の古い順:

```html
<dl class="gigs">
  <dt>2026.11.21</dt><dd>CBS &amp; Chicken Is Nice<br />@ Bar Chit Chat, Shin-Yurigaoka</dd>
  <dt>2026.12.05</dt><dd>[SOLD] Pistachio Studio <a href="https://告知ページのURL">&gt;&gt;&gt;</a><br />@ WWW, Shibuya</dd>
  <dt>2026.12.12</dt><dd class="tba">TBA</dd>
</dl>
```

- `<dt>` は `YYYY.MM.DD`。曜日は書かない。
- `<dd>` は `出演者<br />@ 会場名, 地名` で、**すべてアルファベット**(日本語の地名もローマ字にする。
  例: 新百合ヶ丘 → Shin-Yurigaoka、二子新地 → Futakoshinchi)。
  会場名がない(屋外など)ときは `@ 地名` だけでよい。`&` は `&amp;` と書く。
- 告知ページ(X、Instagram、会場のスケジュールページなど)があれば、出演者のあとに
  ` <a href="URL">&gt;&gt;&gt;</a>` を付ける(外部リンクは自動で新しいタブで開く)。
- 売り切れたら出演者の先頭に `[SOLD] ` を付ける。
- 詳細が決まっていない回は `<dd class="tba">TBA</dd>`。
- 出演者名は過去の表記に合わせる(`CBS & Chicken Is Nice`、`CBS`、`Pistachio Studio` など)。
  分からないときは推測で埋めず、ユーザーに確認する。
- **`<dl>` の途中に空行を入れない**(空行で HTML が切れて崩れる)。

### 4. 空になったときの扱い

- 予定が1件もなくなったら、`<dl class="gigs">` 〜 `</dl>` を消し、そのすぐ下にある
  `<!-- <p class="tba">Nothing on the calendar yet! L(@_@;)</p> -->` のコメントを外す
  (`<p class="tba">Nothing on the calendar yet! L(@_@;)</p>` にする)。
- 予定が入ったら逆に、`<dl class="gigs">` を戻して、この行はコメントアウトに戻す。
- `[Past parties](/past)` の行はいつも残す。

### 5. サンプルを見せる(ここで一度止まる)

`index.md`(NEXT SHOWS とひとこと)と `past.md` の変更後の姿をチャットに出し、OK をもらってからファイルを書き換える。
分からない項目(出演者、会場、リンク)は、サンプルと一緒に箇条書きで質問する。

### 6. 反映する

- ファイルを書き換えたら `vss build` でビルドが通ることを確認する(`AGENTS.md` の「ビルドと確認」参照)。
- コミット・プッシュはユーザーに頼まれたときだけ行う。`main` へのプッシュは本番に即デプロイされるので、
  ブランチを切るか、ユーザーが main に直接と言ったときだけ main に入れる。
