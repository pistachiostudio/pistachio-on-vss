// data-copy を持つボタンを押すと、その値をクリップボードにコピーして、すぐ後ろの .copied を少しのあいだ見せる。
// .copied はふだんも場所だけ取っておく(visibility: hidden)。canvas は文字の位置で絵を空けるので、
// 文字の長さが変わらないようにするため。
document.querySelectorAll("[data-copy]").forEach((btn) => {
    const next = btn.nextElementSibling, note = next && next.classList.contains("copied") ? next : null;
    let timer = 0;
    btn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
        } catch (e) {
            // コピーできないときは、すぐ前の文字(アドレス)を選んだ状態にしておく(あとは Ctrl+C / 長押しで)
            const t = btn.previousElementSibling;
            if (t) { const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
            return;
        }
        if (!note) return;
        note.classList.add("on");
        clearTimeout(timer);
        timer = setTimeout(() => note.classList.remove("on"), 1600);
    });
});
