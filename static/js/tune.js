// 釣り人の合言葉で鳴る曲。scene.js が、合言葉が入力されたときにだけ読み込む。
// リポジトリは公開なので、曲のデータは合言葉で暗号化してある(PBKDF2-SHA256 → AES-GCM)。
// 合言葉と曲の平文はリポジトリに置かない。作り直すときは、リポジトリの外にある生成スクリプトで DATA を書き換える。
// 音は Web Audio の FM 合成で作るエレピ。びっくりしないよう小さめに、少しずつ大きくして鳴らす。
(() => {
    const DATA = { iter: 300000, salt: "qO3N77qOL0iGDFrIybyRBQ==", iv: "2MfScYqJFBmEADpJ", ct: "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" };

    const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    // 合言葉が合っていれば曲のデータ({ bpm, n: [[開始秒, 終了秒, ノート, 強さ], ...] })、違えば null
    async function open(pass) {
        try {
            const key0 = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass.trim().toLowerCase()), "PBKDF2", false, ["deriveKey"]);
            const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: b64(DATA.salt), iterations: DATA.iter },
                key0, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
            const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(DATA.iv) }, key, b64(DATA.ct));
            return JSON.parse(new TextDecoder().decode(plain));
        } catch (e) {
            return null;
        }
    }

    // エレピの 1 音: サイン波を、同じ高さのサイン波で揺らす(FM)。弾いた瞬間だけ高い倍音の「チン」を足す
    function note(ctx, out, t0, t1, midi, vel) {
        const f = 440 * Math.pow(2, (midi - 69) / 12), amp = Math.pow(vel / 127, 1.6) * .32;
        const car = ctx.createOscillator(), mod = ctx.createOscillator(), tine = ctx.createOscillator();
        const modG = ctx.createGain(), tineG = ctx.createGain(), env = ctx.createGain();
        car.frequency.value = f; mod.frequency.value = f; tine.frequency.value = f * 14;
        modG.gain.setValueAtTime(f * (.6 + vel / 127 * 1.2), t0);
        modG.gain.exponentialRampToValueAtTime(f * .12, t0 + 1.2);
        tineG.gain.setValueAtTime(f * .5 * vel / 127, t0);
        tineG.gain.exponentialRampToValueAtTime(1, t0 + .08);
        const decay = 1.1 + (84 - midi) / 40;                               // 低い音ほど長く残る
        env.gain.setValueAtTime(0, t0);
        env.gain.linearRampToValueAtTime(amp, t0 + .006);
        env.gain.setTargetAtTime(amp * .25, t0 + .006, decay);
        env.gain.setTargetAtTime(0, t1, .09);                                // 離したら消える
        mod.connect(modG); modG.connect(car.frequency);
        tine.connect(tineG); tineG.connect(car.frequency);
        car.connect(env); env.connect(out);
        const end = t1 + .6;
        for (const o of [car, mod, tine]) { o.start(t0); o.stop(end); }
    }

    // 曲を鳴らす。ctx は、押したり Enter を押したりした瞬間に作ったもの(ブラウザが音を許すように)
    function play(ctx, song) {
        const master = ctx.createGain(), tone = ctx.createBiquadFilter();
        const delay = ctx.createDelay(), fb = ctx.createGain(), wet = ctx.createGain();
        tone.type = "lowpass"; tone.frequency.value = 4200;
        delay.delayTime.value = .23; fb.gain.value = .22; wet.gain.value = .16;
        tone.connect(master); tone.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
        master.connect(ctx.destination);
        const t0 = ctx.currentTime + .15;
        // 小さめの音量。最初の 2 秒で少しずつ上げる
        master.gain.setValueAtTime(0, ctx.currentTime);
        master.gain.linearRampToValueAtTime(.071, t0 + 2);
        for (const [s, e, n, v] of song.n) note(ctx, tone, t0 + s, t0 + e, n, v);
        const dur = Math.max(...song.n.map((x) => x[1])) + 1.2;
        return {
            t0, dur, bpm: song.bpm,
            onsets: song.n.map((x) => x[0]),
            stop() {                                                         // すっと消してから止める
                const t = ctx.currentTime;
                master.gain.cancelScheduledValues(t);
                master.gain.setValueAtTime(master.gain.value, t);
                master.gain.linearRampToValueAtTime(0, t + .4);
                setTimeout(() => ctx.close().catch(() => {}), 600);
            },
        };
    }

    window.TUNE = { open, play };
})();
