// NEXT SHOWS(.gigs)の日付を、見ている人の「今日」(日本時間)と比べる。トップだけで読む。
// 判定はページを開いたときにブラウザでするので、日付が来ればビルドしなくても変わる。
// - 過ぎた公演は暗くする(.done)
// - 当日と前日の公演を window.SHOWS で scene.js に渡す(当日は電車に会場を流し、前夜と当日は屋形船の提灯に日付を入れる)
// - これからの公演を、検索エンジン向けの構造化データ(MusicEvent)にして <head> に足す
// ?date=2026-12-20 で「今日」を変えて確かめられる
(() => {
    const box = document.querySelector(".gigs");
    if (!box) return;
    const QS = new URLSearchParams(location.search);
    let today = QS.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
        const p = {};
        new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" })
            .formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
        today = p.year + "-" + p.month + "-" + p.day;
    }
    const tomorrow = new Date(Date.parse(today + "T00:00:00Z") + 864e5).toISOString().slice(0, 10);

    // 日付の行(<p>2026.12.20</p>)と、そのすぐ下の出演のリスト
    const shows = [];
    box.querySelectorAll(":scope > p").forEach((p) => {
        const m = p.textContent.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
        if (!m) return;
        const date = m[1] + "-" + m[2] + "-" + m[3];
        const ul = p.nextElementSibling && p.nextElementSibling.tagName === "UL" ? p.nextElementSibling : null;
        if (date < today) { p.classList.add("done"); if (ul) ul.classList.add("done"); }
        if (!ul) return;
        ul.querySelectorAll(":scope > li").forEach((li) => {
            // 「>>>」のような字だけのリンクはチケットのリンク。文からは外す
            const c = li.cloneNode(true);
            let ticket = null;
            c.querySelectorAll("a").forEach((a) => { if (!/[A-Za-z0-9]/.test(a.textContent)) { ticket = ticket || a.href; a.remove(); } });
            const text = c.textContent.replace(/\s+/g, " ").trim();
            if (!text || text.startsWith("TBA")) return;
            // 「出演 @会場, 地名」。先頭の [S/O] のような印は名前から外す
            const at = text.lastIndexOf(" @"), place = at < 0 ? "" : text.slice(at + 2).trim();
            const comma = place.indexOf(",");
            shows.push({
                date, ticket, place,
                name: (at < 0 ? text : text.slice(0, at)).replace(/^\[[^\]]*\]\s*/, "").trim(),
                venue: comma < 0 ? place : place.slice(0, comma).trim(),
                area: comma < 0 ? "" : place.slice(comma + 1).trim(),
            });
        });
    });
    window.SHOWS = { today: shows.filter((s) => s.date === today), eve: shows.filter((s) => s.date === tomorrow) };

    // 構造化データ。過ぎた公演と、会場の書いていない公演は出さない
    const events = shows.filter((s) => s.date >= today && s.venue).map((s) => {
        const e = {
            "@type": "MusicEvent",
            "name": s.name || s.venue,
            "startDate": s.date,
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
                "@type": "Place",
                "name": s.venue,
                "address": { "@type": "PostalAddress", "addressLocality": s.area || s.venue, "addressCountry": "JP" },
            },
            "image": "https://pistachiostudio.net/og_image_banana_maru.png",
            "url": "https://pistachiostudio.net/",
        };
        if (s.ticket) e.offers = { "@type": "Offer", "url": s.ticket };
        return e;
    });
    if (events.length) {
        const ld = document.createElement("script");
        ld.type = "application/ld+json";
        ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": events });
        document.head.appendChild(ld);
    }
})();
