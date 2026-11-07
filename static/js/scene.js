// 夜の川べり(と犬)を、文字のマス目で canvas に描く。
// 色は style.css の :root から読む。犬のデータは dogs.js(window.DOGS)。ないページは景色だけ。
// URL に ?dog=sit / ?dog=sleep を付けると犬を選べる(ふだんは 10 回に 1 回くらい寝ている犬)。
(() => {
    const canvas = document.getElementById("dog");
    const g = canvas.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const tok = (n) => css.getPropertyValue("--" + n).trim();
    // 暗い毛から白い毛まで、:root の3色のあいだを5段に分ける
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mixc = (a, b, t) => "rgb(" + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",") + ")";
    const [C1, C2, C3] = [tok("fur-dim"), tok("fur"), tok("white")].map(hex);
    const COLORS = [null, mixc(C1, C1, 0), mixc(C1, C2, .5), mixc(C1, C2, 1), mixc(C2, C3, .5), mixc(C2, C3, 1), tok("tongue"),
        tok("scene-dim"), tok("scene"), tok("water"), tok("lamp")];
    const TONGUE = 6, SC_DIM = 7, SC = 8, WATER = 9, LAMP = 10;
    const BG = tok("bg");
    const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ===== 写真から取った濃淡(v)と犬の形(a)。1/3 に縮めてある =====
    // 座っている犬と寝ている犬。開くたびに 10 回に 1 回くらい、寝ている犬が出る(?dog=sit / ?dog=sleep で選べる)
    // 犬のデータは dogs.js(トップページだけで読み込む)。ないページは、景色だけで犬を描かない
    const NODOG = { data: { w: 2, h: 2, x0: 0, y0: 0, f: 1, v: "AAAAAA==", a: "AAAAAA==" },
        cfg: { mode: "none", frame: "bust", aria: "夜の川べり。向こう岸の高架をときどき電車が通り、空に星",
            head: [0, 0], neck: [0, 0], chest: [0, 0], eyes: [], nose: [0, 0], ears: [[0, 0], [0, 0]], mouth: [0, 0] } };
    const ALL = window.DOGS && window.DOGS.length ? window.DOGS : [NODOG];
    const PICK = ALL.find((d) => d.cfg.mode === new URLSearchParams(location.search).get("dog"))
        || (ALL.length > 1 && Math.random() < .1 ? ALL[1] : ALL[0]);
    const D = PICK.data, DOG = PICK.cfg;      // DOG は写真ごとの設定(座標は元写真の画素)
    canvas.setAttribute("aria-label", DOG.aria);
    const SLEEP = DOG.mode === "sleep";
    const QS = new URLSearchParams(location.search);
    const W = D.w, H = D.h;
    const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const V = bytes(D.v), A = bytes(D.a);
    // 元写真の画素 → データの座標
    const at = (x, y) => ({ x: (x - D.x0) / D.f, y: (y - D.y0) / D.f });
    const A2 = (q) => at(q[0], q[1]);
    const HEAD = A2(DOG.head), NECK = A2(DOG.neck), CHEST = A2(DOG.chest);
    const EYES = DOG.eyes.map(A2), NOSE = A2(DOG.nose);
    const EARS = DOG.ears.map(A2);
    const MOUTH = A2(DOG.mouth), MOUTH_HW = 12, JAW_MAX = 7;      // データの px(頭の大きさはどの写真も同じ)
    const TIP = DOG.tongue ? A2(DOG.tongue) : null;               // 写真に写っている舌先
    // 寝ている犬の前足: 体との境目と、指の分かれ目を描いて、手だとわかるようにする
    const PAW = DOG.paw ? { x: at(DOG.paw.c[0], 0).x, y: at(0, DOG.paw.c[1]).y, rx: DOG.paw.r[0] / D.f, ry: DOG.paw.r[1] / D.f,
        toes: DOG.paw.toes.map((t) => at(t, 0).x) } : null;
    // 閉じた目(お試し。?eyes=0 で消す)
    const CLOSED = DOG.closedEyes && QS.get("eyes") !== "0" ? DOG.closedEyes.map(A2) : null;
    const CLAWS = DOG.claws ? DOG.claws.map(A2) : null;          // 前足の先の白い爪

    function sample(x, y, out) {
        if (x < 0 || y < 0 || x >= W - 1 || y >= H - 1) { out.v = 0; out.a = 0; return; }
        const i = x | 0, j = y | 0, fx = x - i, fy = y - j, k = j * W + i;
        const lerp2 = (T) => {
            const p = T[k] + (T[k + 1] - T[k]) * fx, q = T[k + W] + (T[k + W + 1] - T[k + W]) * fx;
            return (p + (q - p) * fy) / 255;
        };
        out.v = lerp2(V); out.a = lerp2(A);
    }
    const sstep = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
    const gauss = (x, y, c, s) => Math.exp(-((x - c.x) ** 2 + (y - c.y) ** 2) / (2 * s * s));

    // ===== 1点の見え方(0〜1) =====
    // 目は「濡れたふち / 黒目 / 映り込みの光」。
    // 口は顎を下げたぶんだけ開いて、中に舌が見える。ここで数えた部位はマスの字選びで使う
    const GL = { tongue: 0 };
    // 黒い毛 / 灰色の口元 / 白いあごと胸 の3段。灰色は控えめにして、白だけをはっきり明るくする
    const tone = (v) => v < .4 ? v * .8 : v < .78 ? .32 + (v - .4) * .4 : .472 + (v - .78) / .22 * .528;
    function look(sx, sy) {
        // 舌でぺろっと鼻をなめる(口の線から上へ伸びる。先は丸い)
        if (body.lick > .02) {
            const top = MOUTH.y - body.lick * 11;
            const lx = (sx - MOUTH.x) / 3.4, ly = sy < top + 2.5 ? (top + 2.5 - sy) / 2.5 : 0;
            if (sy > top && sy < MOUTH.y + 1 && lx * lx + ly * ly < 1) { GL.tongue++; return .6; }
        }
        // 口: 口の線より下を顎ごと下げる。開いたすき間は暗く、奥に舌
        const open = body.jaw * JAW_MAX;
        // ハッハッのときは舌が下あごの先まで垂れて、少し揺れる
        if (body.pant > .05) {
            const len = open + body.pant * 9, yy = sy - MOUTH.y;
            const lx = (sx - MOUTH.x - Math.sin(T * Math.PI * 2 * 2.7) * .6) / 4.2;
            const tip = yy > len - 3 ? (yy - (len - 3)) / 3 : 0;
            if (yy > open * .3 && yy < len && lx * lx + tip * tip < 1) { GL.tongue++; return .6; }
        }
        if (open > .15 && sy > MOUTH.y - 1) {
            const mx = (sx - MOUTH.x) / MOUTH_HW;
            const gap = open * Math.max(0, 1 - mx * mx);                  // 口角ほど狭い
            if (sy < MOUTH.y + gap && Math.abs(mx) < 1) {
                const depth = (sy - MOUTH.y) / Math.max(.01, gap);
                if (depth > .35 && Math.abs(mx) < .72) { GL.tongue++; return .6; }
                return 0;
            }
            sy -= open * (1 - sstep(MOUTH.y + 14, MOUTH.y + 40, sy)) * Math.max(0, 1 - mx * mx * .5);
        }
        sample(sx, sy, smp);
        if (smp.a < .12) return 0;
        let v = (.28 + .72 * tone(smp.v)) * sstep(.12, .55, smp.a);
        if (TIP) { const tx = (sx - TIP.x) / 2.9, ty = (sy - TIP.y) / 1.5; if (tx * tx + ty * ty < 1) { GL.tongue++; return .6; } }
        if (PAW) {
            const ex = (sx - PAW.x) / PAW.rx, ey = (sy - PAW.y) / PAW.ry, d2 = ex * ex + ey * ey;
            if (d2 < 1) {
                if (d2 > .6) return .1;                                               // 前足のふち(体と分ける)
                if (ey > -.35) for (const t of PAW.toes) if (Math.abs(sx - t) < 1.1) return .1;   // 指の分かれ目
                v = Math.min(1, v + .2);                                              // 前足の毛を明るく(丸いふくらみに見える)
            }
        }

        for (const E of EYES) {
            const ex = (sx - E.x) / 6.2, ey = (sy - E.y) / 5.7;
            const d2 = ex * ex + ey * ey;
            if (d2 >= 1) continue;
            if (ey < -1 + blink * 2.05) return .3;                       // まぶたは上から閉じる
            if (d2 > .78) return .46;                                     // 濡れたふち
            return 0;                                                     // 黒目(光は描画のあとで置く)
        }
        const nx = (sx - NOSE.x) / 8.5, ny = (sy - NOSE.y) / 5.2;
        if (nx * nx + ny * ny < 1) return smp.v > .7 ? .5 : 0;
        return v;
    }
    const smp = {}, smp2 = {};
    // 字の形の表: 各字を 2×4 に区切って、どこにどれだけインクがあるか
    const CHARS = " .,'`-_:;~^/()<>il" + String.fromCharCode(34, 92);   // 形で選ぶ字(輪郭や目のふち用)
    const RAMP = " .,:;~+*%&@";                    // 明るさで選ぶ字
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => n / 16 - .5);
    const NSUB = 8, TGT = new Float32Array(NSUB);
    let SUB = new Float32Array(NSUB * 2);
    function buildGlyphs(fs) {
        const Z = 4, gw = Math.ceil(S.cw * Z), gh = Math.ceil(S.chh * Z);
        const oc = document.createElement("canvas"); oc.width = gw; oc.height = gh;
        const og = oc.getContext("2d", { willReadFrequently: true });
        og.font = `${fs * Z}px "M PLUS 1 Code", monospace`; og.textBaseline = "top"; og.fillStyle = "#fff";
        GL.n = CHARS.length; GL.codes = []; GL.cov = new Float32Array(GL.n * NSUB);
        let max = 0;
        for (let k = 0; k < GL.n; k++) {
            og.clearRect(0, 0, gw, gh); og.fillText(CHARS[k], 0, 0);
            const d = og.getImageData(0, 0, gw, gh).data;
            GL.codes.push(CHARS.charCodeAt(k));
            for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
                const q = Math.min(3, (y / gh * 4) | 0) * 2 + Math.min(1, (x / gw * 2) | 0);
                GL.cov[k * NSUB + q] += d[(y * gw + x) * 4 + 3] / 255;
            }
        }
        const area = (gw / 2) * (gh / 4);
        for (let q = 0; q < GL.cov.length; q++) { GL.cov[q] /= area; max = Math.max(max, GL.cov[q]); }
        for (let q = 0; q < GL.cov.length; q++) GL.cov[q] /= max;
        // 調べる 2×4 か所(マスの中心からのずれ、データの座標で)
        for (let q = 0; q < NSUB; q++) {
            SUB[q * 2] = (((q % 2) + .5) / 2 - .5) * S.cw * S.k;
            SUB[q * 2 + 1] = ((((q / 2) | 0) + .5) / 4 - .5) * S.chh * S.k;
        }
    }

    // ===== 文字のマス目 =====
    const S = {};
    // 寝ている犬の画面での幅: 座っている犬と同じく、画面の高さで決める(幅を狭めても小さくならない)。
    // 座っている犬の見える高さ(viewH)の 0.86 倍。スマホ幅では、座っている犬と同じく幅に合わせて小さくなる
    function sleepWidth() {
        const viewH = Math.min(S.H * .9, S.W * (580 / 3) / 175);
        return viewH * .86;
    }
    function resize() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        S.W = innerWidth; S.H = innerHeight;
        canvas.width = S.W * dpr; canvas.height = S.H * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        // 頭から胸までを肖像のように大きく。胸から下は画面の下で切れる
        const VIEW = 580 / 3;                    // 基準: 座っている犬の写真を y=1075 まで(データで 193)
        const viewH = Math.min(S.H * .9, S.W * VIEW / 175);
        let fs = Math.max(7, Math.min(13, viewH / (70 * 1.2)));
        if (DOG.frame === "wide") {
            g.font = `10px "M PLUS 1 Code", monospace`;
            const r10 = g.measureText("0").width / 10;
            fs = Math.max(7, Math.min(fs, sleepWidth() / 190 / r10));
        }
        g.font = `${fs}px "M PLUS 1 Code", monospace`;
        g.textBaseline = "top";
        S.cw = g.measureText("0").width; S.chh = fs * 1.2;
        S.cols = Math.ceil(S.W / S.cw); S.rows = Math.ceil(S.H / S.chh);
        S.k = S.k4 = VIEW / viewH;               // 画面の 1px がデータの何 px か
        S.baseOy = S.H - viewH;                  // 座っている版の位置(景色はこれで決める)
        // 頭が画面の真ん中に来るように。広い画面では、左に文字を置くぶん右へ寄せる
        const hx = S.W * (S.W >= 820 ? .64 : .5), hy = S.baseOy + 155 / 3 / S.k;   // 座っている犬の頭のところ
        if (DOG.frame === "wide") {
            // 横長の寝姿: 大きさは座っている犬と同じく画面の高さで決め、体の真ん中を座っている犬の頭と同じ横位置に置く
            // (広い画面では横 64%、スマホ幅では真ん中)。少しだけ画面の下に沈める
            const sink = QS.has("sink") ? +QS.get("sink") : DOG.sink || 0;
            const dw = sleepWidth();
            S.k = W / dw;
            S.ox = hx - (W / 2) / S.k;
            S.oy = S.H - (H * (1 - sink) - 2) / S.k;
        } else {
            S.ox = hx - HEAD.x / S.k; S.oy = hy - HEAD.y / S.k;
        }
        S.ch = new Uint16Array(S.cols * S.rows); S.cls = new Uint8Array(S.cols * S.rows);
        S.line = new Uint16Array(S.cols);
        S.bot = new Int16Array(S.cols);
        buildGlyphs(fs);
        initFur();
        buildScene();
        buildMask();
    }

    // ===== 川べり(犬のうしろ) =====
    // 向こう岸に家並みと高架。手前は川、いちばん手前は犬が座っている草の土手。
    // 動かないところは大きさが変わったときに1度だけ作り、川と明かりと電車だけ毎コマ描く
    const hash = (x, y) => {
        let h = (x * 374761393 + y * 668265263) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    function vnoise(x, y) {
        const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
        const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
        const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    const SCN = {};
    function buildScene() {
        const { cols, rows, chh, k } = S;
        // 犬の首のうしろが向こう岸、胸のうしろが手前の土手
        const rowOf = (py) => Math.round((S.baseOy + (py - 495) / 3 / S.k4) / chh);   // 座っている版の首と胸の高さ
        SCN.hz = Math.max(9, Math.min(rows - 6, rowOf(790)));
        SCN.bank = Math.max(SCN.hz + 4, Math.min(rows - 1, rowOf(1000)));
        SCN.deck = SCN.hz - 5;
        SCN.ch = new Uint16Array(cols * rows).fill(32); SCN.cls = new Uint8Array(cols * rows);
        const put = (c, r, t, cl) => {
            if (c < 0 || c >= cols || r < 0 || r >= rows) return;
            SCN.ch[c + r * cols] = t.charCodeAt(0); SCN.cls[c + r * cols] = cl;
        };
        let seed = 20231;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const { hz, deck, bank } = SCN;
        // 向こう岸の家は暗くて形は見えない。窓の明かりだけ(岸から1〜3段の高さ)
        SCN.windows = [];
        for (let c = 0; c < cols; c++) if (rnd() < .05) SCN.windows.push({ c, r: hz - 1 - ((rnd() * rnd() * 3) | 0), on: rnd() < .6 });
        // 高架: 線路と、12マスおきの橋脚
        for (let c = 0; c < cols; c++) put(c, deck, "=", SC);
        for (let c = 5; c < cols; c += 12) for (let r = deck + 1; r < hz; r++) put(c, r, "|", SC);
        SCN.windows = SCN.windows.filter((w) => SCN.ch[w.c + w.r * cols] === 32);
        // 空にまばらな星(高架より上)
        // 星: 高架より上にまばらに。ほとんどは暗く、ところどころ明るい星
        SCN.stars = [];
        for (let r = 1; r < deck - 2; r++) for (let c = 0; c < cols; c++) {
            if (rnd() >= .009) continue;
            const t = rnd();
            SCN.stars.push({ c, r, p: rnd() * 6.3, sp: .4 + rnd() * .7, lv: t < .72 ? 0 : t < .94 ? 1 : 2 });
        }
        // 土手の草。ふちは細かく、奥へ行くほど(下へ行くほど)まばら
        for (let r = bank; r < rows; r++) for (let c = 0; c < cols; c++) {
            if (r === bank) { if (rnd() < .5) put(c, r, rnd() < .55 ? "," : ".", SC_DIM); }
            else if (rnd() < .09) put(c, r, rnd() < .6 ? "'" : ",", SC_DIM);
        }
    }

    // ===== 文字のある行は、絵を空ける =====
    let MASK = null;
    function buildMask() {
        if (!S.cols) return;
        MASK = new Uint8Array(S.cols * S.rows);
        const rg = document.createRange();
        const tw = document.createTreeWalker(document.querySelector(".site"), NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
            if (!n.nodeValue.trim()) continue;
            rg.selectNodeContents(n);
            for (const b of rg.getClientRects()) {
                if (b.bottom < 0 || b.top > S.H) continue;
                const c0 = Math.max(0, Math.floor((b.left - S.cw * .6) / S.cw)), c1 = Math.min(S.cols - 1, Math.floor((b.right + S.cw * .6) / S.cw));
                const r0 = Math.max(0, Math.floor((b.top + 1) / S.chh)), r1 = Math.min(S.rows - 1, Math.floor((b.bottom - 1) / S.chh));
                for (let r = r0; r <= r1; r++) MASK.fill(1, r * S.cols + c0, r * S.cols + c1 + 1);
            }
        }
    }


    // ===== 流れ星 =====
    // ときどき、空の高いところを斜めにすっと流れる。先は明るい *、尾は進む向きの字で、うしろほど暗く
    let shoot = null, shootAt = new URLSearchParams(location.search).has("shoot") ? 1.2 : 8 + Math.random() * 10;
    function stepShoot() {
        if (!shoot && T > shootAt && SCN.ch) {
            const dir = Math.random() < .5 ? -1 : 1, sky = Math.max(S.chh * 4, (SCN.deck - 3) * S.chh);
            const sp = Math.max(S.W, 700) * (.75 + Math.random() * .35);
            const ang = (.32 + Math.random() * .3);                            // 下向きの角度(ラジアン)
            shoot = {
                t0: T, dur: .6 + Math.random() * .3, len: Math.max(70, S.W * .09) * (.8 + Math.random() * .5),
                x0: S.W * (dir > 0 ? .3 + Math.random() * .4 : .45 + Math.random() * .45), y0: sky * (.05 + Math.random() * .4),
                vx: dir * Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            };
        }
        if (shoot && T - shoot.t0 > shoot.dur) {
            shoot = null;
            shootAt = T + (new URLSearchParams(location.search).has("shoot") ? 2.5 : 14 + Math.random() * 26);
        }
    }
    function drawShoot() {
        if (!shoot) return;
        const { cols, rows, cw, chh, ch, cls } = S;
        const u = (T - shoot.t0) / shoot.dur, t = T - shoot.t0;
        const hx = shoot.x0 + shoot.vx * t, hy = shoot.y0 + shoot.vy * t;
        const sp = Math.hypot(shoot.vx, shoot.vy), ux = shoot.vx / sp, uy = shoot.vy / sp;
        const L = shoot.len * Math.min(1, u * 4) * Math.min(1, (1 - u) * 3);  // 出てすぐ伸び、消える前に縮む
        const tail = Math.abs(uy / ux) * cw / chh < .45 ? 45 : ux * uy > 0 ? 92 : 47;   // - か \ か /
        const skyBottom = (SCN.deck - 2) * chh, step = cw * .7;
        for (let d = L; d >= 0; d -= step) {
            const x = hx - ux * d, y = hy - uy * d;
            if (y > skyBottom) continue;
            const c = Math.floor(x / cw), r = Math.floor(y / chh);
            if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
            const i = c + r * cols, f = 1 - d / Math.max(1, L);                // 先ほど 1
            ch[i] = d < step ? 42 : f > .6 ? tail : f > .3 ? tail : 46;
            cls[i] = d < step ? 5 : 1 + Math.min(3, Math.floor(f * 4));
        }
    }

    // 毎コマ: 窓の明かり、草のそよぎ、電車、川のさざなみと映り込み
    function drawScene() {
        const { cols, ch, cls } = S;
        const { hz, bank, deck } = SCN;
        ch.set(SCN.ch); cls.set(SCN.cls);
        const lights = [];
        for (const st of SCN.stars) {
            const b = Math.sin(T * st.sp + st.p);
            if (b < (st.lv ? -.75 : -.3)) continue;
            const i = st.c + st.r * cols;
            if (st.lv === 2) { ch[i] = b > .6 ? 42 : 43; cls[i] = 3; }
            else if (st.lv === 1) { ch[i] = b > .8 ? 43 : 46; cls[i] = SC; }
            else { ch[i] = 46; cls[i] = SC_DIM; }
        }
        drawShoot();
        for (const w of SCN.windows) {
            if (Math.random() < .0006) w.on = !w.on;      // ときどき、どこかの部屋の電気がつく/消える
            if (!w.on) continue;
            const i = w.c + w.r * cols;
            ch[i] = 46; cls[i] = LAMP;
            lights.push({ c: w.c, m: hz + (hz - 1 - w.r), len: .45 });
        }
        // 草: 風が通ると、穂先がそろって寝る
        for (let r = bank + 1; r < S.rows; r++) for (let c = 0; c < cols; c++) {
            const i = c + r * cols;
            if (ch[i] === 39 && vnoise(c * .06 - T * .5, r * .3) > .62) ch[i] = 96;
        }
        if (train) {
            const x0 = Math.floor(train.x);
            for (let l = 0; l < train.len; l++) {
                const c = x0 + l, m = l % 9;
                if (c < 0 || c >= cols || m === 8) continue;
                const iw = c + (deck - 1) * cols, ir = c + (deck - 2) * cols;
                if (m === 0 || m === 7) { ch[iw] = m ? 93 : 91; cls[iw] = SC; }
                else { ch[iw] = 39; cls[iw] = LAMP; if (m % 2) lights.push({ c, m: hz + (hz - deck), len: .7 }); }
                if (deck >= 2) { ch[ir] = 95; cls[ir] = SC_DIM; }
            }
        }
        // さざなみ: 奥ほど細かく遅く、手前ほど大きく速く流れる
        const span = bank - hz;
        for (let r = hz; r < bank; r++) {
            const p = (r - hz) / span, fx = .5 / (.35 + p), sp = .5 + p * 1.8;
            for (let c = 0; c < cols; c++) {
                const n = vnoise(c * fx * .35 - T * sp, r * 1.7) * .6 + vnoise(c * fx * .9 + T * .4, r * 2.3 + 17) * .4;
                if (n > .63) { const i = c + r * cols; ch[i] = n > .72 ? 126 : 45; cls[i] = WATER; }
            }
        }
        // 明かりの映り込み: 真下に、切れ切れの横線が縦に伸びる。手前ほど揺れて薄れる
        for (const L of lights) {
            const end = Math.min(bank - 1, L.m + Math.round(span * L.len));
            for (let r = L.m; r <= end; r++) {
                const p = (r - hz) / span, f = 1 - (r - L.m) / Math.max(1, end - L.m);
                if (vnoise(r * .9 - T * 1.4, L.c * 3.7) > .2 + .55 * f) continue;
                const c = L.c + Math.round(Math.sin(r * .8 + T * 2.2 + L.c) * (.3 + p * 1.3));
                if (c < 0 || c >= cols) continue;
                const i = c + r * cols;
                ch[i] = 45; cls[i] = f > .45 ? LAMP : WATER;
            }
        }
    }

    // ===== 向こう岸の高架を、ときどき電車が通る(景色。犬は追わない) =====
    let train = null, trainAt = 4 + Math.random() * 4;
    function stepTrain(dt) {
        if (!train && T > trainAt && SCN.ch) {
            const dir = side(), len = 9 * (4 + ((Math.random() * 3) | 0));
            train = { dir, len, x: dir > 0 ? -len : S.cols, v: dir * S.cols / (17 + Math.random() * 7) };   // 17〜24 秒で画面を渡る
        }
        if (!train) return;
        train.x += train.v * dt;
        if (train.dir > 0 ? train.x > S.cols : train.x < -train.len) { train = null; trainAt = T + 20 + Math.random() * 30; }
    }

    // ===== なでた毛のずれ(粗いマス目に、ずれと速さを持たせてばねで戻す) =====
    const FG = 4;  // データ 4px ごと
    let fw, fh, fdx, fdy, fvx, fvy;
    function initFur() {
        fw = Math.ceil(W / FG) + 1; fh = Math.ceil(H / FG) + 1;
        fdx = new Float32Array(fw * fh); fdy = new Float32Array(fw * fh);
        fvx = new Float32Array(fw * fh); fvy = new Float32Array(fw * fh);
    }
    function furAt(x, y) {
        const gx = Math.min(fw - 2, Math.max(0, x / FG)), gy = Math.min(fh - 2, Math.max(0, y / FG));
        const i = gx | 0, j = gy | 0, tx = gx - i, ty = gy - j, k = j * fw + i;
        const L = (T) => { const p = T[k] + (T[k + 1] - T[k]) * tx, q = T[k + fw] + (T[k + fw + 1] - T[k + fw]) * tx; return p + (q - p) * ty; };
        return [L(fdx), L(fdy)];
    }
    function stroke(x, y, vx, vy) {
        const R = 12;
        for (let j = Math.max(0, ((y - R) / FG) | 0); j <= Math.min(fh - 1, (y + R) / FG); j++)
            for (let i = Math.max(0, ((x - R) / FG) | 0); i <= Math.min(fw - 1, (x + R) / FG); i++) {
                const d = Math.hypot(i * FG - x, j * FG - y) / R;
                if (d >= 1) continue;
                const k = j * fw + i, f = (1 - d) * .35;
                fdx[k] = Math.max(-5, Math.min(5, fdx[k] + vx * f));
                fdy[k] = Math.max(-5, Math.min(5, fdy[k] + vy * f));
            }
    }
    function relaxFur(k60) {
        for (let k = 0; k < fdx.length; k++) {
            fvx[k] = (fvx[k] - fdx[k] * .06 * k60) * Math.pow(.86, k60); fdx[k] += fvx[k] * k60;
            fvy[k] = (fvy[k] - fdy[k] * .06 * k60) * Math.pow(.86, k60); fdy[k] += fvy[k] * k60;
        }
    }

    // ===== 体の状態 =====
    // 首の向きはばね。ふだんはゆっくり、振り向くときだけ硬いばねにして一瞬で向く(少し行き過ぎて戻る)
    const spring = () => ({ x: 0, v: 0, t: 0 });
    const head = { yaw: spring(), pitch: spring(), roll: spring(), k: .012, damp: .8, Y: 0, R: 0, Pi: 0 };
    const gaze = { x: 0, y: 0, tx: 0, ty: 0 };                 // 目は首より先に動く
    const ears = [{ x: 0, y: 0, vx: 0, vy: 0 }, { x: 0, y: 0, vx: 0, vy: 0 }];
    const body = { jaw: 0, jawT: 0, lick: 0, perk: 0, pant: 0, shake: 0, breathRate: 1, phase: 0 };
    let blink = 0, blinkAt = 2, blinkT = -1, lid = 0;
    let sniffT = -1, sniffAt = 5;
    const P = { x: 0, y: 0, on: false, last: -10, px: 0, py: 0, petting: 0, speed: 0 };
    let T = 0;

    // ---- しぐさ ----
    // それぞれ w(出やすさ)、len(長さ)、start(始め)、run(経過秒 u, 長さ len)
    let act = null;
    const side = () => (Math.random() < .5 ? -1 : 1);
    const ACTS = {
        // あたりを見回す
        look: { w: 30, len: () => 1.6 + Math.random() * 2.5, start() { aim(side() * Math.random() * .8, (Math.random() - .5) * .6, 0, "soft"); } },
        // 物音がしたように、パッと振り向く。耳の付け根が上がり、向いたあとにまばたき
        snap: { w: 18, len: () => 1.4 + Math.random() * 1.6, start() {
            aim(side() * (.95 + Math.random() * .25), (Math.random() - .6) * .3, 0, "snap");
            body.perk = 1; blinkAt = T + .45;
        } },
        // 首をかしげる
        tilt: { w: 12, len: () => 1.3 + Math.random() * .8, start() { aim(head.yaw.t * .5, -.1, side() * (.2 + Math.random() * .08), "mid"); body.perk = .6; } },
        // ハッハッと息をする(口が開いて舌が見える)
        pant: { w: 11, len: () => 3 + Math.random() * 3, start() { aim(head.yaw.t * .4, -.15, 0, "soft"); },
            run(u, len) { body.pant = Math.min(1, u * 3, (len - u) * 3); } },
        // 鼻をぺろっ
        lick: { w: 10, len: () => .7, start() {}, run(u) { body.lick = Math.sin(Math.min(1, u / .55) * Math.PI); body.jawT = .18 * body.lick; } },
        // くんくん(少しうつむいて鼻を速く動かす)
        sniff: { w: 8, len: () => 1.4, start() { aim(head.yaw.t * .6, .35, 0, "mid"); sniffT = T; } },
        // あくび(口を大きく開けて、目を細める)
        yawn: { w: 5, len: () => 2.4, start() { aim(head.yaw.t * .3, -.35, side() * .06, "soft"); },
            run(u, len) { const e = Math.sin(Math.min(1, u / len) * Math.PI); body.jawT = Math.pow(e, .8); body.lidT = e * .75; } },
        // 寝ているときだけ: じっとしている / 耳がぴくっ / 深いため息
        rest: { w: 0, len: () => 4 + Math.random() * 5, start() {} },
        twitch: { w: 0, len: () => .7, start() { const e = ears[(Math.random() * 2) | 0]; e.vy -= 1.8; e.vx += (Math.random() - .5) * 1.6; } },
        sigh: { w: 0, len: () => 3.2, start() {}, run(u, len) { body.sigh = Math.sin(Math.min(1, u / len) * Math.PI); } },
        // ブルブルッと頭を振る
        shake: { w: 4, len: () => .95, start() { body.shake = 1; aim(0, 0, 0, "snap"); }, run(u, len) { body.shake = 1 - u / len; } },
    };
    function aim(yaw, pitch, roll, how) {
        head.yaw.t = yaw; head.pitch.t = pitch; head.roll.t = roll;
        gaze.tx = Math.max(-1, Math.min(1, (yaw - head.yaw.x) * 1.4)); gaze.ty = Math.max(-1, Math.min(1, (pitch - head.pitch.x) * .8));
        head.k = how === "snap" ? .11 : how === "mid" ? .035 : .012;
        head.damp = how === "snap" ? .7 : .8;
    }
    function begin(name) {
        const a = ACTS[name];
        act = { name, a, t0: T, len: a.len() };
        body.jawT = 0; body.pant = 0; body.lidT = 0; body.sigh = 0;
        if (name !== "shake") body.shake = 0;
        a.start();
    }
    function pick() {
        if (SLEEP) { const r = Math.random(); return r < .55 ? "rest" : r < .85 ? "twitch" : "sigh"; }
        const names = Object.keys(ACTS);
        let r = Math.random() * names.reduce((s, n) => s + ACTS[n].w, 0);
        for (const n of names) { r -= ACTS[n].w; if (r <= 0) return n; }
        return "look";
    }

    const toData = (cx, cy) => ({ x: (cx - S.ox) * S.k, y: (cy - S.oy) * S.k });
    function onMove(cx, cy) {
        const d = toData(cx, cy);
        if (P.on) {
            const o = {}; sample(d.x, d.y, o);
            P.speed = Math.max(P.speed, Math.hypot(d.x - P.px, d.y - P.py));
            if (o.a > .5) { stroke(d.x, d.y, d.x - P.px, d.y - P.py); P.petting = Math.min(1, P.petting + .06); }
        }
        P.px = d.x; P.py = d.y; P.x = d.x; P.y = d.y; P.on = true; P.last = T;
    }
    addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY), { passive: true });
    addEventListener("pointerdown", (e) => {
        onMove(e.clientX, e.clientY);
        if (SLEEP) { ears.forEach((q) => { q.vy -= 1.4; }); return; }
        // 呼ばれたら、かしげるか、うれしくてハッハッするか、ぺろっ
        begin(["tilt", "tilt", "pant", "lick"][(Math.random() * 4) | 0]);
        ears.forEach((e) => (e.vy -= 1));
    });
    document.documentElement.addEventListener("mouseleave", () => { P.on = false; });
    addEventListener("blur", () => { P.on = false; });

    function stepSpring(s, k60) {
        s.v += (s.t - s.x) * head.k * k60;
        s.v *= Math.pow(head.damp, k60);
        s.x += s.v * k60;
    }
    let lastSnap = -10;
    function update(dt) {
        const k60 = dt * 60;
        const watching = P.on && T - P.last < 3;

        stepTrain(dt);
        stepShoot();
        // しぐさの切り替え。カーソルを見ているあいだは、見回すことが多い
        if (!(QS.has("act") && act) && (!act || T - act.t0 > act.len)) begin(watching && Math.random() < .6 ? "look" : pick());
        if (act.a.run) act.a.run(T - act.t0, act.len);

        // カーソルを見る。速く動かすと、パッとそっちを向く
        if (!SLEEP && watching && (act.name === "look" || act.name === "pant" || act.name === "snap")) {
            const yaw = Math.max(-1.1, Math.min(1.1, (P.x - HEAD.x) / 70));
            const pitch = Math.max(-1, Math.min(1, (P.y - HEAD.y) / 110));
            if (P.speed > 9 && T - lastSnap > 2.5 && Math.abs(yaw - head.yaw.x) > .5) {
                lastSnap = T; begin("snap"); aim(yaw, pitch, 0, "snap");
            } else if (act.name !== "snap") aim(yaw, pitch, head.roll.t, act.name === "pant" ? "soft" : "mid");
        }
        P.speed *= Math.pow(.7, k60);

        // ブルブル: 首を細かく左右にひねる。耳がばたつく
        let shakeRoll = 0, shakeYaw = 0;
        if (body.shake > 0) {
            const u = 1 - body.shake;
            shakeRoll = Math.sin(u * Math.PI * 2 * 5.5) * .32 * body.shake;
            shakeYaw = Math.sin(u * Math.PI * 2 * 5.5 + .8) * .35 * body.shake;
        }
        stepSpring(head.yaw, k60); stepSpring(head.pitch, k60); stepSpring(head.roll, k60);
        head.Y = head.yaw.x + shakeYaw; head.R = head.roll.x + shakeRoll; head.Pi = head.pitch.x;

        // 目は首より先に向き、首が追いつくと真ん中に戻る
        gaze.tx += (0 - gaze.tx) * Math.min(1, .03 * k60);
        gaze.ty += (0 - gaze.ty) * Math.min(1, .03 * k60);
        gaze.x += (gaze.tx - gaze.x) * Math.min(1, .35 * k60);
        gaze.y += (gaze.ty - gaze.y) * Math.min(1, .35 * k60);

        // 耳は頭より遅れてついてくる(ばね)
        const hx = head.Y * 6 + head.R * 22, hy = head.Pi * 4;
        ears.forEach((e) => {
            const tx = -(hx - (e.hx ?? hx)) * 6, ty = -(hy - (e.hy ?? hy)) * 6;
            e.vx += ((tx - e.x) * .05 - e.vx * .12) * k60; e.vy += ((ty - e.y) * .05 - e.vy * .12) * k60;
            e.x += e.vx * k60; e.y += e.vy * k60;
            e.hx = hx; e.hy = hy;
        });
        body.perk = Math.max(0, body.perk - .012 * k60);

        // 口: ハッハッは顎を小刻みに。息も速く浅くなる
        let jawT = body.jawT;
        if (body.pant > 0) jawT = Math.max(jawT, body.pant * (.62 + .12 * Math.sin(T * Math.PI * 2 * 2.7)));
        body.jaw += (jawT - body.jaw) * Math.min(1, .3 * k60);
        if (act.name !== "lick") body.lick = Math.max(0, body.lick - .1 * k60);
        body.breathRate += ((body.pant > .3 ? 6.5 : SLEEP ? .6 : 1) - body.breathRate) * Math.min(1, .05 * k60);
        body.phase += dt * Math.PI * 2 / 2.6 * body.breathRate;

        // まばたき: 2〜6秒に1回、たまに2回続けて。なでられると目を細める。ブルブル中はつむる
        P.petting = Math.max(0, P.petting - .01 * k60);
        const lidT = Math.max(P.petting > .3 ? .55 : 0, body.shake > 0 ? .9 : 0, body.lidT);
        lid += (lidT - lid) * Math.min(1, .08 * k60);
        if (T > blinkAt) { blinkT = T; blinkAt = T + 2 + Math.random() * 4; if (Math.random() < .2) blinkAt = T + .35; }
        const bt = (T - blinkT) / .16;
        blink = Math.max(lid, bt >= 0 && bt < 1 ? Math.sin(bt * Math.PI) : 0);
        if (T > sniffAt) { sniffT = T; sniffAt = T + (SLEEP ? 8 + Math.random() * 10 : 4 + Math.random() * 7); }
        stepZ();
        relaxFur(k60);
    }


    // ===== 寝ているときの zzz =====
    // 頭の右上から、. → z → Z と育ちながら、ゆらゆら上っていって消える。3つ続けて出て、少し休む
    const ZZ = [];
    let zzAt = 1.2, zzN = 0;
    function stepZ() {
        if (!SLEEP) return;
        if (T > zzAt) {
            ZZ.push({ t0: T, w: Math.random() * 6.3, side: zzN % 2 ? 1 : -1 });
            zzN = (zzN + 1) % 3; zzAt = T + (zzN ? .75 : 2.6 + Math.random() * 1.6);
        }
        for (let i = ZZ.length - 1; i >= 0; i--) if (T - ZZ[i].t0 > ZLIFE) ZZ.splice(i, 1);
    }
    // . → z → Z → 字を組んだ大きな Z と育ちながら、ふわふわ左右に揺れて上っていく。
    // 出てすぐ「ぽん」と少し跳ね、最後は小さな . に散って消える
    const ZLIFE = 4.2;
    const BIGZ = ["___", " / ", "/__"];
    function drawZ() {
        if (!SLEEP) return;
        const { cols, rows, cw, chh, ch, cls, k } = S;
        const x0 = S.ox + (HEAD.x + 14) / k, y0 = S.oy + 4 / k;            // 頭のてっぺんの右上
        const sc = Math.min(1.25, Math.max(.6, S.H / 800));
        const put = (x, y, code, cl) => {
            const c = Math.floor(x / cw), r = Math.floor(y / chh);
            if (c < 0 || c >= cols || r < 0 || r >= rows) return;
            ch[c + r * cols] = code; cls[c + r * cols] = cl;
        };
        for (const z of ZZ) {
            const u = (T - z.t0) / ZLIFE;
            const pop = Math.sin(Math.min(1, u / .08) * Math.PI) * 10;         // 出た瞬間に少し跳ねる
            const sway = Math.sin(u * 7.5 + z.w) * (8 + u * 26) * z.side;     // 上るほど大きく揺れる
            const x = x0 + (u * 110 + sway) * sc, y = y0 - (u * 210 + pop) * sc;
            const cl = u > .88 ? 2 : u > .74 ? 3 : u > .1 ? 5 : 4;             // 白く出て、消える前に暗く
            if (u < .1) put(x, y, 46, cl);                                      // .
            else if (u < .26) put(x, y, 122, cl);                               // z
            else if (u < .44) put(x, y, 90, cl);                                // Z
            else if (u < .9) {                                                  // 字を組んだ大きな Z
                for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) {
                    const code = BIGZ[rr].charCodeAt(cc);
                    if (code !== 32) put(x + (cc - 1) * cw, y + (rr - 2) * chh, code, cl);
                }
            } else {                                                            // 散って消える
                const e = (u - .9) / .1;
                for (let q = 0; q < 4; q++) put(x + Math.cos(q * 1.6 + z.w) * e * cw * 3, y - chh - Math.sin(q * 1.6 + z.w) * e * chh * 1.5, 46, 2);
            }
        }
    }

    // ===== 1コマ描く =====
    function draw() {
        const { cols, rows, cw, chh, ch, cls, k } = S;
        drawScene();
        S.bot.fill(-1);
        // 黒目に映る光: 目ごとに、左上に強い光、右下に弱い光を1文字ずつ。見ている方へ少し寄る。
        // 光を置きたい点(写真の上の位置)に、いちばん近いところを写しているマスを探しておく
        const GLINT = [];
        EYES.forEach((E) => {
            GLINT.push({ x: E.x + (-.3 + gaze.x * .3) * 6.2, y: E.y + (-.3 + gaze.y * .25) * 5.7, ch: 42, cl: 5, d: 1e9, i: -1 });
            GLINT.push({ x: E.x + (.38 + gaze.x * .3) * 6.2, y: E.y + (.38 + gaze.y * .25) * 5.7, ch: 46, cl: 4, d: 1e9, i: -1 });
        });
        if (CLOSED) CLOSED.forEach((E) => GLINT.push({ x: E.x, y: E.y + .4, ch: 45, cl: 5, d: 1e9, i: -1, closed: true }));
        if (CLAWS) CLAWS.forEach((E) => GLINT.push({ x: E.x, y: E.y, ch: 46, cl: 5, d: 1e9, i: -1, always: true }));
        const breath = Math.sin(body.phase) * (body.pant > .3 ? .55 : 1) + (body.sigh || 0) * 1.4;
        const sn = T - sniffT, sniffLen = act && act.name === "sniff" ? 1.3 : .5;
        const sniff = sniffT >= 0 && sn < sniffLen ? Math.sin(sn * Math.PI * 2 * 8) * (1 - sn / sniffLen) : 0;
        const cr = Math.cos(head.R), sr = Math.sin(head.R);
        const tx = head.Y * 6, ty = head.Pi * 4 - breath * .6;
        // 犬のまわりのマスだけ調べる
        const c0 = Math.max(0, Math.floor(S.ox / cw) - 4), c1 = Math.min(cols - 1, Math.ceil((S.ox + W / k) / cw) + 4);
        const r0 = Math.max(0, Math.floor(S.oy / chh) - 3), r1 = DOG.mode === "none" ? -1 : Math.min(rows - 1, Math.ceil((S.oy + H / k) / chh) + 2);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
            const x = ((c + .5) * cw - S.ox) * k, y = ((r + .5) * chh - S.oy) * k;
            // 頭(と耳)はひとかたまりで動く。首のあたりでなめらかに胴へつながる
            const dh = Math.hypot((x - HEAD.x) / 72, (y - HEAD.y) / 60);
            const wEar = Math.max(gauss(x, y, EARS[0], 17), gauss(x, y, EARS[1], 17));
            const wHead = Math.max(1 - sstep(.85, 1.2, dh), wEar);
            let dx = 0, dy = 0;
            if (wHead > .001) {
                const px = x - NECK.x, py = y - NECK.y;
                const qx = NECK.x + px * cr - py * sr + tx, qy = NECK.y + px * sr + py * cr + ty;
                // 顔の真ん中は輪郭より少し多く動かす(首を振ると立体に見える)
                const face = gauss(x, y, NOSE, 26);
                dx += (qx - x + head.Y * 3 * face) * wHead;
                dy += (qy - y + head.Pi * 2 * face) * wHead;
                for (let e = 0; e < 2; e++) {
                    const we = gauss(x, y, EARS[e], 17), inward = EARS[e].x < HEAD.x ? 1 : -1;
                    // 気になる音で耳の付け根が上がる。かしげたとき上になる側の耳も少し上がる
                    const up = body.perk * 2.6 + Math.max(0, -head.R * inward) * 9;
                    dx += (ears[e].x + inward * body.perk * 1.2) * we; dy += (ears[e].y - up) * we;
                }
                dy += sniff * 1.1 * gauss(x, y, NOSE, 6);
            }
            // 息をすると胸がふくらむ
            const wBody = SLEEP ? 1 - wHead : (1 - wHead) * sstep(NECK.y - 10, NECK.y + 30, y);
            if (wBody > .001) {
                if (SLEEP) { dx += (x - CHEST.x) * .008 * breath * wBody; dy += (y - CHEST.y) * .028 * breath * wBody; }
                else { dx += (x - CHEST.x) * .014 * breath * wBody; dy += (y - CHEST.y) * .01 * breath * wBody; }
            }
            const fur = furAt(x, y);
            dx += fur[0]; dy += fur[1];
            // 犬のいるマスは、うしろの景色を消す(黒い毛や黒目のところも)
            sample(x - dx, y - dy, smp2);
            if (smp2.a > .3) { const i = c + r * cols; ch[i] = 32; cls[i] = 0; if (r > S.bot[c]) S.bot[c] = r; }
            for (const G of GLINT) { const d = (x - dx - G.x) ** 2 + (y - dy - G.y) ** 2; if (d < G.d) { G.d = d; G.i = c + r * cols; } }
            // マスの中の 2×4 か所の明るさを調べて、その形にいちばん近い字を選ぶ
            let any = false, sum = 0;
            GL.tongue = 0;
            for (let q = 0; q < NSUB; q++) {
                const v = look(x + SUB[q * 2] - dx, y + SUB[q * 2 + 1] - dy);
                TGT[q] = v; sum += v; if (v > 0) any = true;
            }
            if (!any) continue;
            const i = c + r * cols;
            if (GL.tongue >= 3) { ch[i] = GL.tongue >= 6 ? 85 : 61; cls[i] = TONGUE; continue; }      // U か =
            // 平らなところは明るさだけで字を選ぶ。明暗の差があるところだけ形の合う字にする
            const mean = sum / NSUB;
            let vr = 0;
            for (let q = 0; q < NSUB; q++) vr += (TGT[q] - mean) ** 2;
            if (vr / NSUB < .012) {
                const q = Math.round(mean * (RAMP.length - 1) + BAYER[(r & 3) * 4 + (c & 3)] * .9);
                const code = RAMP.charCodeAt(Math.max(0, Math.min(RAMP.length - 1, q)));
                if (code !== 32) { ch[i] = code; cls[i] = 1 + Math.min(4, Math.max(0, Math.floor(mean * 5.6))); }
                continue;
            }
            let best = 0, bestD = 1e9;
            for (let gi = 0; gi < GL.n; gi++) {
                let d = 0;
                const o = gi * NSUB;
                for (let q = 0; q < NSUB; q++) { const e = TGT[q] - GL.cov[o + q]; d += e * e; }
                if (d < bestD) { bestD = d; best = gi; }
            }
            const code = GL.codes[best];
            if (code === 32) continue;
            ch[i] = code; cls[i] = 1 + Math.min(4, Math.max(0, Math.floor(sum / NSUB * 5.6)));
        }
        const near = (cw * k) ** 2;
        for (const G of GLINT) if (G.i >= 0 && G.d < near && (blink < .45 || G.closed || G.always)) {
            ch[G.i] = G.ch; cls[G.i] = G.cl;
            if (G.closed) for (const o of [-1, 1]) { const q = G.i + o; if (q >= 0 && q < ch.length) { ch[q] = 45; cls[q] = 5; } }
        }
        if (SLEEP && QS.get("shadow") !== "0") for (let c = 0; c < cols; c++) if (S.bot[c] >= 0)
            for (let r = S.bot[c] + 1; r < rows; r++) { ch[c + r * cols] = 32; cls[c + r * cols] = 0; }
        drawZ();
        if (MASK) for (let i = 0; i < MASK.length; i++) if (MASK[i]) { ch[i] = 32; cls[i] = 0; }
        g.fillStyle = BG;
        g.fillRect(0, 0, S.W, S.H);
        const line = S.line;
        for (let r = 0; r < rows; r++) {
            const base = r * cols;
            for (let kk = 1; kk < COLORS.length; kk++) {
                let has = false;
                for (let c = 0; c < cols; c++) { if (cls[base + c] === kk) { line[c] = ch[base + c]; has = true; } else line[c] = 32; }
                if (!has) continue;
                g.fillStyle = COLORS[kk];
                g.fillText(String.fromCharCode.apply(null, line), 0, r * chh);
            }
        }
    }

    // ===== ループ(1秒に30コマ。タブが裏なら止める。動きを減らす設定なら1コマだけ) =====
    const FPS = 30;
    let last = 0;
    function frame(now) {
        requestAnimationFrame(frame);
        if (last && now - last < 1000 / FPS - 4) return;
        const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
        last = now;
        if (document.hidden) return;
        T += dt;
        update(dt);
        draw();
    }
    const fontReady = document.fonts
        ? Promise.race([document.fonts.load('16px "M PLUS 1 Code"', CHARS + RAMP), new Promise((r) => setTimeout(r, 3000))])
        : Promise.resolve();
    fontReady.catch(() => {}).then(() => {
        resize();
        addEventListener("resize", () => { resize(); if (REDUCE) draw(); });
        addEventListener("scroll", () => { buildMask(); if (REDUCE) draw(); }, { passive: true });
        document.querySelectorAll(".site details").forEach((d) => d.addEventListener("toggle", () => { buildMask(); if (REDUCE) draw(); }));
        // リンクにカーソルが乗ると、耳がぴくっと上がる
        document.querySelectorAll(".site a").forEach((a) => a.addEventListener("pointerenter", () => { body.perk = Math.max(body.perk, .8); }));
        if (QS.has("sim")) {
            let a = 7; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
            if (QS.has("act")) begin(QS.get("act"));
            const n = Math.round(+QS.get("sim") * 30);
            for (let i = 0; i < n; i++) { T += 1 / 30; update(1 / 30); }
            draw(); addEventListener("resize", () => draw());
            let ms = 0; if (QS.has("bench")) { const t0 = performance.now(); for (let i = 0; i < 20; i++) draw(); ms = +((performance.now() - t0) / 20).toFixed(1); }
            document.title = JSON.stringify({ ms, T: +T.toFixed(2), act: act && act.name, z: ZZ.length });
        } else if (REDUCE) draw(); else requestAnimationFrame(frame);
    });
})();
