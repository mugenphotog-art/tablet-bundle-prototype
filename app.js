"use strict";
// 試作: チェックリスト＋写真＋端末内保存(IndexedDB)＋オフライン動作。サーバー通信なし。

const TEMPLATES = {
  cleaning: { name: "清掃チェック", items: ["床の掃除", "トイレの掃除", "ゴミの回収", "備品の補充", "忘れ物の確認"] },
  minpaku:  { name: "民泊チェック", abnormal: true, items: [
    "【清掃/全体】床・畳の掃除（髪の毛・ゴミがない）",
    "【清掃/全体】ゴミの回収・分別",
    "【清掃/リビング】窓・サッシ・カーテンの汚れ",
    "【清掃/寝室】ベッド・布団のシーツ交換",
    "【清掃/寝室】枕カバー・掛け布団カバーの交換",
    "【清掃/キッチン】キッチン・シンク・コンロの清掃",
    "【清掃/キッチン】食器・調理器具の洗浄と収納",
    "【清掃/キッチン】冷蔵庫の中身の確認・清掃",
    "【清掃/トイレ】トイレ・便座・床の清掃",
    "【清掃/浴室】浴室・排水口（髪の毛・カビ）の清掃",
    "【清掃/洗面所】洗面台・鏡の清掃",
    "【清掃/玄関・ベランダ】ベランダ・玄関まわりの清掃",
    "【備品/全体】リモコン・鍵・カードキーの確認",
    "【備品/全体】掃除機・ほうき・モップの状態と収納",
    "【備品/リビング】座布団・クッション・ブランケットの数と汚れ",
    "【備品/寝室】寝具・備品の紛失・破損・汚れ",
    "【備品/寝室】予備の枕・毛布・シーツの在庫",
    "【備品/キッチン】洗剤・スポンジ・ゴミ袋の補充",
    "【備品/キッチン】調味料・コーヒー・お茶などの消耗品の補充",
    "【備品/キッチン】食器・グラス・カトラリーの欠け・不足",
    "【備品/トイレ】トイレットペーパー・ティッシュの補充",
    "【備品/浴室】シャンプー・リンス・ボディソープの残量",
    "【備品/浴室】風呂椅子・洗面器・バスマットの状態",
    "【備品/洗面所】タオル（バス・フェイス）の補充",
    "【備品/洗面所】アメニティ（歯ブラシ・シャンプー等）の補充",
    "【備品/洗面所】ドライヤー・アイロンの動作",
    "【備品/洗面所】洗濯洗剤・洗濯ネットの補充",
    "【備品/玄関・ベランダ】スリッパ・傘立て・靴べらの状態",
    "【設備/全体】照明の点灯・球切れ",
    "【設備/全体】火災警報器・消火器の状態",
    "【設備/全体】水漏れ・排水の流れ",
    "【設備/全体】ブレーカー・分電盤の状態",
    "【設備/リビング】エアコン・暖房の動作",
    "【設備/リビング】Wi-Fi・テレビの接続",
    "【設備/リビング】窓・網戸・カーテンレールの開閉",
    "【設備/寝室】寝室のエアコン・照明・コンセントの動作",
    "【設備/キッチン】コンロ・IH・換気扇の動作",
    "【設備/キッチン】冷蔵庫・電子レンジ・炊飯器の動作",
    "【設備/キッチン】蛇口まわりの水漏れ",
    "【設備/トイレ】便器の水流れ・ウォシュレットの動作",
    "【設備/浴室】給湯器・お湯の出",
    "【設備/浴室】シャワー・蛇口・排水の動作",
    "【設備/洗面所】洗濯機・乾燥機の動作",
    "【設備/玄関・ベランダ】窓・玄関・ベランダの施錠",
    "【設備/玄関・ベランダ】玄関ドア・インターホンの動作",
    "【宿泊者対応】忘れ物の確認",
    "【宿泊者対応】室内の臭い・換気",
    "【宿泊者対応】ハウスルール・案内・Wi-Fiパスワードの掲示",
    "【宿泊者対応】チェックイン準備（鍵・案内）",
    "【盗難/全体】鍵・カードキー・スペアキーが全部ある",
    "【盗難/全体】キーボックス・スマートロックが正常",
    "【盗難/全体】取扱説明書・ハウスブック・ガイドブックがある",
    "【盗難/全体】時計・鏡・額縁・置物・観葉植物がある",
    "【盗難/全体】照明器具・スタンドライトがある",
    "【盗難/全体】ハンガー・衣類かご・ゴミ箱がある",
    "【盗難/全体】予備の電池・延長コード・工具がある",
    "【盗難/リビング】テレビ・リモコンがある",
    "【盗難/リビング】エアコン・扇風機・ヒーターがある",
    "【盗難/リビング】Wi-Fiルーター・充電器・ケーブルがある",
    "【盗難/リビング】ゲーム機・スピーカー・プロジェクターがある",
    "【盗難/リビング】クッション・ラグ・カーテンがある",
    "【盗難/リビング】ボードゲーム・本・DVD・おもちゃがある",
    "【盗難/寝室】布団・毛布・枕・シーツの数が揃っている",
    "【盗難/寝室】加湿器・空気清浄機・寝室のテレビがある",
    "【盗難/キッチン】電子レンジ・ケトル・炊飯器・トースターがある",
    "【盗難/キッチン】ポット・コーヒーメーカー等がある",
    "【盗難/キッチン】食器・グラス・カトラリーの数が揃っている",
    "【盗難/キッチン】鍋・フライパン・包丁・調理器具がある",
    "【盗難/キッチン】炊飯器の内釜・トースターのトレイなど付属品がある",
    "【盗難/キッチン】ドリンク・飲料・備蓄食品の数が合う",
    "【盗難/トイレ】アメニティ・トイレットペーパーの在庫が合う",
    "【盗難/トイレ】トイレブラシ・スリッパ・サニタリーボックスがある",
    "【盗難/浴室】シャワーヘッド・風呂椅子・洗面器がある",
    "【盗難/洗面所】ドライヤー・アイロン・掃除機がある",
    "【盗難/洗面所】バスタオル・フェイスタオルの数が揃っている",
    "【盗難/洗面所】体重計・ティッシュケース・小物入れがある",
    "【盗難/玄関・ベランダ】ドア・窓・ベランダに不審な形跡（こじ開け・傷）がない",
    "【盗難/玄関・ベランダ】郵便受け・宅配ボックスに異常がない",
    "【盗難/玄関・ベランダ】自転車・ベランダの備品・庭の備品がある",
    "【盗難/玄関・ベランダ】傘・傘立て・物干し竿・洗濯ばさみがある",
    "【盗難/玄関・ベランダ】防犯カメラ・センサーライトが正常",
  ] },
  inspect:  { name: "住宅異常点検", abnormal: true, items: [
    "【火災・ガス】火元の確認（コンロ・ストーブ・タバコ等の消し忘れ）",
    "【火災・ガス】ガスの元栓・ガス漏れ臭",
    "【火災・ガス】コンロ・給湯器まわりの異常",
    "【火災・ガス】コンセント・タップの焦げ・過熱",
    "【火災・ガス】火災警報器・消火器の状態",
    "【電気】ブレーカー・分電盤の状態",
    "【電気】機器の電源OFF（不要な家電・設備）",
    "【電気】照明の確認（点灯・球切れ）",
    "【電気】照明のちらつき・不点灯",
    "【電気】スイッチ・コンセントの破損・異音",
    "【水回り】水漏れ・水たまり（台所・洗面・トイレ・浴室）",
    "【水回り】蛇口・配管の漏れ",
    "【水回り】排水の流れ・詰まり・悪臭",
    "【水回り】給湯器の動作・エラー表示",
    "【水回り】天井・壁のシミ（雨漏り）",
    "【空調・換気】エアコンの動作・水漏れ",
    "【空調・換気】換気扇の動作・異音",
    "【空調・換気】結露・カビ",
    "【建物】床のきしみ・傾き・沈み",
    "【建物】壁・天井のひび割れ・剥がれ",
    "【建物】ドア・窓の開閉不良・がたつき",
    "【建物】窓ガラスの割れ・ひび",
    "【建物】雨戸・シャッターの動作",
    "【建物】ベランダ・バルコニーの手すり・排水口",
    "【建物】外壁・基礎のひび割れ・剥がれ",
    "【建物】屋根・雨どいの破損・詰まり",
    "【防犯】戸締まり（全ての出入口・窓）",
    "【防犯】玄関・窓の施錠",
    "【防犯】不審な侵入跡・こじ開けの痕",
    "【防犯】防犯カメラ・インターホンの動作",
    "【害虫・動物】ネズミ・害虫の痕跡（フン・かじり跡）",
    "【害虫・動物】シロアリ・蜂の巣の疑い",
    "【共用・その他】郵便受けの溜まり・ポスト内の異常",
    "【共用・その他】庭・外構の倒木・ブロック塀の傾き",
    "【共用・その他】異音・異臭なし（家全体）",
    "【共用・その他】その他の気になる点（メモに記入）"
  ] },
};

const $ = (id) => document.getElementById(id);
let db;
let current = null; // 編集中: {template, checks:[bool], photos:[Blob]}
let saving = false;

// ---------- IndexedDB ----------
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("tablet-bundle-proto", 2);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("records")) d.createObjectStore("records", { keyPath: "id" });
      if (!d.objectStoreNames.contains("photos")) d.createObjectStore("photos", { keyPath: "id" }).createIndex("recordId", "recordId");
      if (!d.objectStoreNames.contains("memos")) d.createObjectStore("memos", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const tx = (stores, mode, fn) => new Promise((resolve, reject) => {
  const t = db.transaction(stores, mode);
  const out = fn(t);
  t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
  t.onerror = () => reject(t.error);
  t.onabort = () => reject(t.error || new Error("保存が中断されました"));
});
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ---------- 画像を縮小(容量対策) ----------
async function shrink(file, maxSide = 1600, quality = 0.8) {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b || file), "image/jpeg", quality));
  } catch { return file; }
}

// ---------- 画面 ----------
function show(which) { $("home").hidden = which !== "home"; $("edit").hidden = which !== "edit"; $("view").hidden = which !== "view"; $("admin").hidden = which !== "admin"; $("adminOpen").hidden = which !== "home"; }
$("adminOpen").onclick = () => { renderAdmin(); renderTplSettings(); show("admin"); window.scrollTo(0, 0); };
$("adminBack").onclick = () => { show("home"); window.scrollTo(0, 0); };
function setMsg(text, isErr) { const m = $("msg"); m.textContent = text; m.className = isErr ? "err" : "muted"; }

// 「新しい記録を作る」のボタンは、ドラッグで並べ替えられる（並びはこの端末に保存）
function loadOrder() { try { return JSON.parse(localStorage.getItem("tb-template-order") || "[]"); } catch (e) { return []; } }
function saveOrder(keys) { try { localStorage.setItem("tb-template-order", JSON.stringify(keys)); } catch (e) {} }
// 使う雛形（業種別の切り替え）。この端末に保存。未設定なら全部使う。1つ以上は必ず残す
function loadEnabled() {
  const all = Object.keys(TEMPLATES);
  try {
    const s = JSON.parse(localStorage.getItem("tb-template-enabled") || "null");
    if (s && s.length) { const f = all.filter((k) => s.indexOf(k) >= 0); if (f.length) return f; }
  } catch (e) {}
  return all;
}
function saveEnabled(keys) { try { localStorage.setItem("tb-template-enabled", JSON.stringify(keys)); return true; } catch (e) { return false; } }
// 管理者設定：使う雛形を選ぶ（変更は管理者パスワードが必要）
function renderTplSettings(doneMsg) {
  const box = $("tplBox"); box.innerHTML = "";
  const en = loadEnabled();
  const note = document.createElement("div"); note.className = "muted"; note.style.marginBottom = "8px";
  note.textContent = "ホームに出す雛形を選びます（1つ以上）。業種に合わせて切り替えられます。";
  box.appendChild(note);
  const ins = {};
  for (const k of Object.keys(TEMPLATES)) {
    const l = document.createElement("label"); l.className = "adminField";
    const c = document.createElement("input"); c.type = "checkbox"; c.checked = en.indexOf(k) >= 0;
    c.style.cssText = "display:inline-block;width:auto;min-height:0;margin:0 8px 0 0;vertical-align:middle;transform:scale(1.5)";
    l.appendChild(c); l.appendChild(document.createTextNode(TEMPLATES[k].name)); box.appendChild(l); ins[k] = c;
  }
  const msg = document.createElement("span"); msg.className = "muted"; msg.setAttribute("role", "status"); if (doneMsg) msg.textContent = doneMsg;
  const btn = document.createElement("button"); btn.type = "button"; btn.textContent = "雛形の選択を保存する";
  btn.onclick = async () => {
    const sel = Object.keys(TEMPLATES).filter((k) => ins[k].checked);
    if (!sel.length) { msg.className = "err"; msg.textContent = "1つ以上選んでください。"; return; }
    if (!(await adminAuth())) { msg.className = "err"; msg.textContent = "保存しませんでした（管理者の確認ができませんでした）。"; return; }
    if (!saveEnabled(sel)) { msg.className = "err"; msg.textContent = "保存できませんでした。"; return; }
    renderTemplates(); renderTplSettings("保存しました。ホームの雛形が切り替わりました。");
  };
  const row = document.createElement("div"); row.className = "row"; row.style.marginTop = "8px"; row.append(btn, msg);
  box.appendChild(row);
}
// 日時の表示：「26/11/15 9:45」（年は下2桁、秒は出さない）
function fmtDT(d) {
  const p = (n) => (n < 10 ? "0" : "") + n;
  return String(d.getFullYear()).slice(-2) + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + p(d.getMinutes());
}

function renderTemplates() {
  const box = $("templates");
  box.innerHTML = "";
  const saved = loadOrder();
  const en = loadEnabled();
  const keys = Object.keys(TEMPLATES).filter((k) => en.indexOf(k) >= 0).sort((a, b) => {
    const ia = saved.indexOf(a), ib = saved.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  let dragged = false;
  for (const key of keys) {
    const b = document.createElement("button");
    b.textContent = TEMPLATES[key].name;
    b.setAttribute("data-key", key);
    b.className = "tplBtn";
    b.onclick = () => { if (dragged) { dragged = false; return; } startEdit(key); };
    let sx = 0, sy = 0, gx = 0, gy = 0, moving = false, pid = null, target = null;
    b.addEventListener("pointerdown", (e) => {
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; moving = false;
      const r = b.getBoundingClientRect(); gx = e.clientX - r.left; gy = e.clientY - r.top;
      try { b.setPointerCapture(pid); } catch (er) {}
    });
    b.addEventListener("pointermove", (e) => {
      if (pid !== e.pointerId) return;
      if (!moving) {
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 10) return;
        moving = true; b.classList.add("dragging");
      }
      // ドラッグ中はボタンの並びを変えない（変えるとブラウザが操作を打ち切るため）。置く場所に目印だけ出す
      const mark = findTarget(e.clientX, e.clientY);
      for (const c of box.children) c.classList.remove("dropBefore", "dropAfter");
      if (mark) mark.el.classList.add(mark.after ? "dropAfter" : "dropBefore");
      target = mark;
      b.style.transform = "translate(" + (e.clientX - sx) + "px," + (e.clientY - sy) + "px)";
      e.preventDefault();
    });
    const findTarget = (x, y) => {
      let best = null, bd = 1e9;
      for (const o of box.children) {
        if (o === b) continue;
        const rr = o.getBoundingClientRect();
        const cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
        const d = Math.abs(x - cx) + Math.abs(y - cy) * 2;
        if (d < bd) { bd = d; best = { el: o, after: x > cx }; }
      }
      return best;
    };
    const end = (e) => {
      if (pid !== e.pointerId) return;
      pid = null;
      try { b.releasePointerCapture(e.pointerId); } catch (er) {}
      if (moving) {
        dragged = true; moving = false;
        b.classList.remove("dragging"); b.style.transform = "";
        for (const c of box.children) c.classList.remove("dropBefore", "dropAfter");
        if (target) box.insertBefore(b, target.after ? target.el.nextSibling : target.el);
        target = null;
        saveOrder(Array.prototype.map.call(box.children, (c) => c.getAttribute("data-key")));
        setTimeout(() => { dragged = false; }, 50);
      }
    };
    b.addEventListener("pointerup", end);
    b.addEventListener("pointercancel", end);
    document.addEventListener("pointerup", end);
    document.addEventListener("mouseup", () => { if (pid !== null) end({ pointerId: pid }); });
    box.appendChild(b);
  }
}

// 「【大項目】項目」または「【大項目/中項目】項目」を分解する
function parseItem(full) {
  const m = /^【(.*?)】(.*)$/.exec(full);
  if (!m) return { major: "", sub: "", label: full };
  const p = m[1].split("/");
  return { major: p[0], sub: p[1] || "", label: m[2] };
}
function catHead(major, abn) {
  const h = document.createElement("h3"); h.className = "cat";
  const ht = document.createElement("span"); ht.textContent = major; h.appendChild(ht);
  if (abn) {
    const s1 = document.createElement("span"); s1.className = "abnHead"; s1.textContent = "異常あり";
    const s2 = document.createElement("span"); s2.className = "noteHead"; s2.textContent = "内容";
    h.append(s1, s2);
  }
  return h;
}
function subHead(sub) { const h = document.createElement("h4"); h.className = "subcat"; h.textContent = sub; return h; }

function startEdit(key) {
  const t = TEMPLATES[key];
  current = { template: key, checks: t.items.map(() => false), abn: t.items.map(() => false), abnNote: t.items.map(() => ""), photos: [] };
  $("editTitle").textContent = t.name;
  $("items").innerHTML = "";
  const hasSub = t.items.some((x) => parseItem(x).sub);
  let lastCat = "", lastSub = "";
  t.items.forEach((full, i) => {
    const pi = parseItem(full), label = pi.label, m = pi.major ? pi : null;
    if (m && m.major !== lastCat) { lastCat = m.major; lastSub = ""; $("items").appendChild(catHead(lastCat, t.abnormal)); }
    if (m && m.sub && m.sub !== lastSub) { lastSub = m.sub; $("items").appendChild(subHead(lastSub)); }
    const l = document.createElement("label"); l.className = "check";
    const c = document.createElement("input"); c.type = "checkbox";
    c.onchange = () => { current.checks[i] = c.checked; };
    l.append(c, document.createTextNode(label));
    if (!t.abnormal) { $("items").appendChild(l); return; }
    // 点検項目：右に「異常あり」のチェック欄と、内容を直接書く欄を付ける
    l.classList.add("small");
    const row = document.createElement("div"); row.className = "chkrow" + (hasSub ? " insub" : "");
    const al = document.createElement("label"); al.className = "abn";
    const ac = document.createElement("input"); ac.type = "checkbox";
    al.appendChild(ac); al.title = "異常あり"; ac.setAttribute("aria-label", "異常あり");
    const tx_ = document.createElement("input"); tx_.type = "text"; tx_.className = "abnNote"; tx_.placeholder = (m && i > 0 && parseItem(t.items[i-1]).major === m.major) ? "" : "異常の内容を入力";
    ac.onchange = () => { current.abn[i] = ac.checked; row.classList.toggle("bad", ac.checked); };
    tx_.oninput = () => {
      current.abnNote[i] = tx_.value;
      if (tx_.value && !ac.checked) { ac.checked = true; ac.onchange(); } // 書き始めたら自動で「異常あり」
    };
    row.append(l, al, tx_);
    $("items").appendChild(row);
  });
  $("propName").value = ""; $("note").value = ""; $("thumbs").innerHTML = ""; setMsg("");
  $("save").disabled = false; saving = false;
  show("edit");
}

async function addPhotoFiles(files) {
  for (const f of files) {
    const blob = await shrink(f);
    current.photos.push(blob);
    const img = document.createElement("img"); img.src = URL.createObjectURL(blob);
    $("thumbs").appendChild(img);
  }
}
$("photo").onchange = async (e) => { await addPhotoFiles(e.target.files); e.target.value = ""; };
$("camInput").onchange = async (e) => { await addPhotoFiles(e.target.files); e.target.value = ""; };

// ---- 連続撮影：撮影ボタンを押すだけで即保存（確認の操作なし）。閉じるまでカメラは開いたまま ----
let camStream = null, camShots = 0, camWait = null;
function closeCamera() {
  clearTimeout(camWait);
  if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
  $("camVideo").srcObject = null;
  $("camOverlay").style.display = "none";
}
function failCamera(err) {
  const name = err && err.name ? err.name : "不明";
  const tip = (name === "NotAllowedError" || name === "SecurityError") ? "カメラの許可がOFFです。アドレスバー左の鍵マーク→権限→カメラを「許可」にしてください。" : (name === "NotReadableError" ? "他のアプリがカメラを使用中です。他のアプリを閉じてください。" : "この端末ではアプリ内カメラが使えません。");
  $("camMsg").style.display = "block";
  $("camMsg").textContent = "カメラを起動できませんでした（" + name + "）。" + tip + "下の「標準カメラ」でも撮れます。";
}
function openCamera() {
  $("camOverlay").style.display = "flex";
  $("camMsg").style.display = "block"; $("camMsg").textContent = "カメラを起動中…（許可の確認が出たら「許可」を押してください）";
  clearTimeout(camWait);
  camWait = setTimeout(() => { if (!camStream) $("camMsg").textContent = "カメラから応答がありません。下の「標準カメラ」を押してください。"; }, 8000);
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    $("camMsg").textContent = "この画面ではアプリ内カメラが使えません。下の「標準カメラ」を押してください。"; return;
  }
  const tries = [{ video: { facingMode: { ideal: "environment" } }, audio: false }, { video: true, audio: false }];
  let lastErr = null;
  const attempt = (i) => {
    if (i >= tries.length) { failCamera(lastErr); return; }
    navigator.mediaDevices.getUserMedia(tries[i]).then((s) => {
      camStream = s; camShots = 0; $("camCount").textContent = "0 枚撮影";
      const v = $("camVideo");
      v.setAttribute("playsinline", ""); v.muted = true; v.srcObject = s;
      const done = () => { $("camMsg").style.display = "none"; };
      v.onloadedmetadata = () => { v.play().then(done).catch(done); };
      v.onplaying = done;
      v.play().catch(() => {});
      setTimeout(() => { if (camStream && !v.videoWidth) $("camMsg").textContent = "映像が出ません。下の「標準カメラ」を押してください。"; }, 4000);
    }).catch((err) => { lastErr = err; attempt(i + 1); });
  };
  attempt(0);
}
function shoot() {
  const v = $("camVideo");
  if (!camStream || !v.videoWidth || !current) return;
  const c = document.createElement("canvas");
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  const f = $("camFlash"); f.style.transition = "none"; f.style.opacity = "0.8";
  requestAnimationFrame(() => { f.style.transition = "opacity .25s"; f.style.opacity = "0"; });
  c.toBlob((b) => {
    if (!b) return;
    addPhotoFiles([new File([b], "camera-" + Date.now() + ".jpg", { type: "image/jpeg" })]);
    camShots++; $("camCount").textContent = camShots + " 枚撮影";
  }, "image/jpeg", 0.92);
}
$("camBtn").onclick = () => {
  $("camOverlay").style.display = "flex";
  $("camMsg").style.display = "block"; $("camMsg").textContent = "カメラを起動中…";
  requestAnimationFrame(() => setTimeout(() => { try { openCamera(); } catch (e) { $("camMsg").textContent = "エラー: " + (e && e.message); } }, 150));
};
$("camShot").onclick = shoot;
$("camClose").onclick = closeCamera;
$("camNative").onclick = () => { closeCamera(); $("camInput").click(); };


$("save").onclick = async () => {
  if (saving) return; // 連打による二重登録を防ぐ
  saving = true; $("save").disabled = true; setMsg("保存中…");
  const id = uid();
  const rec = { id, template: current.template, createdAt: new Date().toISOString(),
                checks: current.checks, abn: current.abn.map((b, i) => b ? { label: TEMPLATES[current.template].items[i].replace(/^【.*?】/, ""), note: current.abnNote[i].trim() } : null).filter(Boolean), note: $("note").value.trim(), property: $("propName").value.trim(), photoCount: current.photos.length };
  try {
    await tx(["records", "photos"], "readwrite", (t) => {
      t.objectStore("records").put(rec);
      current.photos.forEach((blob) => t.objectStore("photos").put({ id: uid(), recordId: id, blob }));
    });
    current = null; await renderMemos(); await renderStorage(); show("home");
  } catch (err) {
    // 保存に失敗したら入力内容は残し、理由と次の操作を示す
    saving = false; $("save").disabled = false;
    setMsg("保存できませんでした（端末の空き容量が足りない可能性があります）。写真を減らして、もう一度保存してください。", true);
  }
};
function memoBlock(m, onChange) {
  const d = document.createElement("div");
  d.className = "memo" + (m.kind === "contact" ? " contact" : "") + (m.done ? " done" : "");
  const tag = document.createElement("span"); tag.className = "tag" + (m.kind === "contact" ? " contact" : "");
  tag.textContent = m.kind === "contact" ? (m.done ? "連絡・対応済み" : "連絡・未対応") : "メモ";
  const when = document.createElement("span"); when.className = "muted"; when.textContent = fmtDT(new Date(m.createdAt));
  const txt = document.createElement("div"); txt.className = "txt"; txt.textContent = m.text;
  const head = document.createElement("div"); head.className = "memoHead";
  const lead = document.createElement("span"); lead.append(tag, when); head.appendChild(lead);
  d.append(head, txt);
  if (onChange) {
    const row = document.createElement("span"); row.className = "memoBtns";
    if (m.kind === "contact") {
      const b = document.createElement("button"); b.type = "button"; b.className = "sub"; b.style.minHeight = "36px"; b.textContent = m.done ? "未対応に戻す" : "対応済みにする";
      b.onclick = async () => { m.done = !m.done; await tx(["memos"], "readwrite", (t) => t.objectStore("memos").put(m)); await onChange(); };
      row.appendChild(b);
    }
    const x = document.createElement("button"); x.type = "button"; x.className = "sub"; x.style.minHeight = "36px"; x.textContent = "削除";
    x.onclick = async () => { if (!(await adminAuth())) return; await tx(["memos"], "readwrite", (t) => t.objectStore("memos").delete(m.id)); await onChange(); };
    row.appendChild(x); head.appendChild(row);
  }
  return d;
}
async function memosOf(recordId) {
  const all = await tx(["memos"], "readonly", (t) => t.objectStore("memos").getAll());
  return all.filter((m) => m.recordId === recordId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
// ---------- 報告書の出力 ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function saveBlob(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
const blobToDataUrl = (b) => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = () => rej(f.error); f.readAsDataURL(b); });
// 項目ごとの結果：[大項目, 中項目, 項目, 確認(○/空), 異常(あり/空), 異常の内容]
function reportRows(r, t) {
  const abnBy = {}; (r.abn || []).forEach((a) => { abnBy[a.label] = a; });
  return t.items.map((full, i) => {
    const pi = parseItem(full), a = abnBy[pi.label];
    return [pi.major, pi.sub, pi.label, r.checks[i] ? "○" : "", a ? "あり" : "", a ? ((a.resolved ? "【対応済み】" : "【要対応】") + (a.note || "")) : ""];
  });
}
function buildCsv(r, t, memos) {
  const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const lines = [[q("雛形"), q(t.name)], [q("物件名"), q(r.property || "")], [q("記録日時"), q(fmtDT(new Date(r.createdAt)))], [],
    ["大項目", "中項目", "項目", "確認", "異常", "異常の内容"].map(q)];
  reportRows(r, t).forEach((x) => lines.push(x.map(q)));
  if (r.note) lines.push([], [q("メモ"), q(r.note)]);
  memos.forEach((m) => lines.push([q(m.kind === "contact" ? "連絡" : "メモ"), q(m.text), q(fmtDT(new Date(m.createdAt)))]));
  return lines.map((l) => l.join(",")).join("\r\n");
}
function buildSummary(r, t, memos) {
  const rows = reportRows(r, t), done = rows.filter((x) => x[3]).length, bad = rows.filter((x) => x[4]);
  let s = t.name + (r.property ? "　物件：" + r.property : "") + "（" + fmtDT(new Date(r.createdAt)) + "）\n確認済み " + done + " / " + rows.length + " 項目\n";
  s += bad.length ? "異常あり " + bad.length + " 件：\n" + bad.map((x) => "・" + x[2] + (x[5] ? "（" + x[5] + "）" : "")).join("\n") + "\n" : "異常の報告はありません。\n";
  if (r.note) s += "\nメモ：" + r.note + "\n";
  s += "\n※詳しい内容は添付のファイルをご覧ください。";
  return s;
}
async function buildReportHtml(r, t, memos, photos) {
  const imgs = [];
  for (const p of photos) imgs.push(await blobToDataUrl(p.blob));
  // アプリの画面と同じ構成：大項目（濃い緑の帯）→ 中項目（少し右から・左線）→ 個別の項目（さらに右から）
  const abnT = !!t.abnormal, rows = reportRows(r, t);
  const hasSub = rows.some((x) => x[1]);
  const box = (on, warn) => '<span class="bx' + (on ? " on" : "") + (warn ? " w" : "") + '">' + (on ? "✓" : "") + "</span>";
  let lastCat = null, lastSub = null, rowsHtml = "";
  if (!abnT) rowsHtml = "";
  rows.forEach((x) => {
    if (x[0] && x[0] !== lastCat) {
      lastCat = x[0]; lastSub = null;
      rowsHtml += '<div class="g cat"><span>' + esc(x[0]) + "</span>" + (abnT ? '<span class="c">異常あり</span><span>内容</span>' : "") + "</div>";
    }
    if (x[1] && x[1] !== lastSub) { lastSub = x[1]; rowsHtml += '<div class="sub">' + esc(x[1]) + "</div>"; }
    const ind = hasSub ? " in2" : (x[0] ? " in1" : "");
    if (abnT) rowsHtml += '<div class="g row' + (x[4] ? " bad" : "") + '"><span class="lab' + ind + '">' + box(x[3]) + esc(x[2]) + '</span><span class="c">' + box(x[4], true) + "</span><span class=\"nt\">" + esc(x[5]) + "</span></div>";
    else rowsHtml += '<div class="row1"><span class="lab">' + box(x[3]) + esc(x[2]) + "</span></div>";
  });
  let memoHtml = "";
  if (r.note) memoHtml += "<p><b>メモ：</b>" + esc(r.note) + "</p>";
  memos.forEach((m) => { memoHtml += "<p><b>" + (m.kind === "contact" ? "連絡" : "メモ") + "（" + fmtDT(new Date(m.createdAt)) + "）：</b>" + esc(m.text) + "</p>"; });
  // A4（96dpi換算 794x1123px）に区切り、右上に「n / 全ページ数」を入れる
  const PW_FULL = 794, PH = 1123, PAD_X = 36, PAD_T = 44, PAD_B = 36, PW = PW_FULL - PAD_X * 2;
  let prows = "";
  for (let i = 0; i < imgs.length; i += 2) prows += '<div class="prow">' + imgs.slice(i, i + 2).map((u) => '<img src="' + u + '">').join("") + "</div>";
  const PAGER = '(function(){var AV=' + (PH - PAD_T - PAD_B) + ';function hh(e){var s=getComputedStyle(e);return e.offsetHeight+parseFloat(s.marginTop)+parseFloat(s.marginBottom);}' +
    'function hd(e){return /(^| )(cat|sub)( |$)/.test(e.className)||e.tagName==="H3";}' +
    'function go(){var src=document.getElementById("src"),items=[].slice.call(src.children),pages=[],cur=[],h=0;' +
    'items.forEach(function(e){var eh=hh(e);' +
    'if(cur.length&&h+eh>AV){var carry=[];while(cur.length>1&&hd(cur[cur.length-1])){carry.unshift(cur.pop());}pages.push(cur);cur=carry;h=0;cur.forEach(function(c){h+=hh(c);});}' +
    'cur.push(e);h+=eh;});if(cur.length)pages.push(cur);' +
    'pages.forEach(function(p,i){var d=document.createElement("div");d.className="pg";var n=document.createElement("div");n.className="pn";n.textContent=(i+1)+" / "+pages.length;d.appendChild(n);p.forEach(function(e){d.appendChild(e);});document.body.insertBefore(d,src);});src.parentNode.removeChild(src);}' +
    'var im=[].slice.call(document.images),left=im.length;if(!left){go();}else{im.forEach(function(i){function f(){if(--left===0)go();}if(i.complete)f();else{i.onload=f;i.onerror=f;}});}})();';
  return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(t.name) + '</title><style>' +
    '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:sans-serif;color:#1c2421;font-size:14px}h1{font-size:1.4em;margin:0}.muted{color:#5b6762}' +
    '.g{display:grid;grid-template-columns:minmax(0,1fr) 64px minmax(130px,1fr);gap:0 10px;align-items:center}' +
    '.cat{margin:14px 0 2px;padding:6px 10px;background:#14503f;border-radius:6px;color:#fff;font-weight:700;break-after:avoid}.cat .c{text-align:center;font-size:.85em}.cat span:last-child{font-size:.85em;font-weight:400}' +
    '.sub{margin:10px 0 0 28px;padding:2px 8px;font-size:.95em;color:#3c4a45;border-left:4px solid #1f6f5c;background:#f1f5f3;break-after:avoid}' +
    '.row,.row1{border-bottom:1px solid #d5dcd9;min-height:30px;break-inside:avoid}.row.bad{background:#fff4e8}.lab{display:flex;align-items:center;gap:10px;padding:4px 0}.lab.in1{padding-left:28px}.lab.in2{padding-left:56px}' +
    '.c{text-align:center}.nt{color:#b4540a;font-size:.9em;word-break:break-all}' +
    '.bx{display:inline-block;flex:0 0 18px;width:18px;height:18px;border:2px solid #8a9690;border-radius:4px;text-align:center;line-height:18px;font-size:14px;font-weight:700;color:#fff;background:#fff;vertical-align:middle}.bx.on{background:#1f6f5c;border-color:#1f6f5c}.bx.w.on{background:#b4540a;border-color:#b4540a}' +
    'p{margin:8px 0}h3{margin:14px 0 6px}.prow{display:flex;gap:2%;margin-bottom:8px}.prow img{width:49%;height:auto}' +
    '@page{size:A4;margin:0}html,body{margin:0}body{padding:0;background:#9aa5a0}' +
    '#src{position:absolute;left:-9999px;top:0;width:' + PW + 'px;visibility:hidden}' +
    '.pg{position:relative;box-sizing:border-box;width:' + PW_FULL + 'px;height:' + PH + 'px;padding:' + PAD_T + 'px ' + PAD_X + 'px ' + PAD_B + 'px;margin:0 auto 12px;background:#fff;overflow:hidden;page-break-after:always;break-after:page}' +
    '.pn{position:absolute;top:16px;right:' + PAD_X + 'px;font-size:12px;color:#5b6762}' +
    '@media print{body{background:#fff}.pg{margin:0}.pg:last-child{page-break-after:auto;break-after:auto}}' +
    '</style></head><body><div id="src"><h1>' + esc(t.name) + '</h1>' + (r.property ? '<div style="font-weight:700;font-size:15px;margin-bottom:2px">物件名：' + esc(r.property) + '</div>' : '') + '<div class="muted">' + esc(fmtDT(new Date(r.createdAt))) + '</div>' +
    rowsHtml + memoHtml +
    (imgs.length ? '<h3>写真 ' + imgs.length + '枚</h3>' + prows : "") +
    '</div><script>' + PAGER + '<\/script></body></html>';
}
// 報告書をアプリの上に重ねて表示。「印刷／PDF保存」で端末の印刷画面（PDFに保存できる）を開く
function showReport(html) {
  const ov = document.createElement("div");
  ov.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:400;background:#fff;display:flex;flex-direction:column;";
  const bar = document.createElement("div"); bar.className = "row"; bar.style.cssText = "padding:8px;border-bottom:1px solid #ccc;";
  const pb = document.createElement("button"); pb.type = "button"; pb.textContent = "印刷／PDFに保存";
  const cb = document.createElement("button"); cb.type = "button"; cb.className = "sub"; cb.textContent = "閉じる";
  const hint = document.createElement("span"); hint.className = "muted"; hint.textContent = "印刷画面で「PDFに保存」を選びます";
  bar.append(pb, cb, hint);
  const fr = document.createElement("iframe"); fr.style.cssText = "flex:1;border:0;width:100%;";
  fr.srcdoc = html;
  ov.append(bar, fr); document.body.appendChild(ov);
  cb.onclick = () => document.body.removeChild(ov);
  pb.onclick = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { hint.className = "err"; hint.textContent = "印刷を開けませんでした：" + e.message; } };
}
// ---------- 保存した記録の内容を見る（読み取り専用） ----------
async function openRecord(r, opts) {
  const t = TEMPLATES[r.template] || { name: r.template, items: [] };
  const body = $("viewBody"); body.innerHTML = "";
  let memoAnchor = null, memoTa = null;
  const add = (tag, text, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; body.appendChild(e); return e; };
  if (r.property) add("div", r.property, "propLine");
  add("h2", t.name);
  add("div", fmtDT(new Date(r.createdAt)), "muted");
  const abnBy = {}; (r.abn || []).forEach((a) => { abnBy[a.label] = a; });
  const abnT = !!t.abnormal;
  const ro = (checked) => { const c = document.createElement("input"); c.type = "checkbox"; c.checked = checked; c.disabled = true; return c; };
  const hasSub = t.items.some((x) => parseItem(x).sub);
  let lastCat = "", lastSub = "";
  t.items.forEach((full, i) => {
    const pi = parseItem(full), label = pi.label;
    if (pi.major && pi.major !== lastCat) { lastCat = pi.major; lastSub = ""; body.appendChild(catHead(lastCat, abnT)); }
    if (pi.sub && pi.sub !== lastSub) { lastSub = pi.sub; body.appendChild(subHead(lastSub)); }
    const a = abnBy[label];
    const row = document.createElement("div"); row.className = (abnT ? "chkrow vview" : "vrow") + (hasSub ? " insub" : "") + (a ? " bad" : "");
    const lab = document.createElement("label"); lab.className = "check small";
    lab.append(ro(!!r.checks[i]), document.createTextNode(label));
    row.appendChild(lab);
    if (abnT) {
      const al = document.createElement("label"); al.className = "abn"; al.appendChild(ro(!!a));
      const nt = document.createElement("div"); nt.className = "vnote";
      if (a) {
        const st = document.createElement("div"); st.className = "needAct";
        const setSt = () => { st.textContent = a.resolved ? "対応済み" : "要対応"; st.classList.toggle("done", !!a.resolved); row.classList.toggle("fixed", !!a.resolved); };
        setSt();
        nt.appendChild(st);
        if (a.note) { const tx_ = document.createElement("div"); tx_.textContent = a.note; nt.appendChild(tx_); }
        const rl = document.createElement("label"); rl.className = "resolvedChk";
        const rc = document.createElement("input"); rc.type = "checkbox"; rc.checked = !!a.resolved;
        // チェックしただけでは保存しない。「保存する」を押したときに保存する
        let savedVal = !!a.resolved;
        const sv = document.createElement("button"); sv.type = "button"; sv.className = "saveResolved"; sv.textContent = "保存する"; sv.style.display = "none";
        const stView = () => { st.textContent = rc.checked ? "対応済み" : "要対応"; st.classList.toggle("done", rc.checked); row.classList.toggle("fixed", rc.checked); };
        rc.onchange = () => { stView(); sv.style.display = rc.checked !== savedVal ? "" : "none"; };
        sv.onclick = async () => {
          a.resolved = rc.checked; if (rc.checked) a.resolvedAt = new Date().toISOString(); else delete a.resolvedAt;
          await tx(["records"], "readwrite", (tt) => tt.objectStore("records").put(r));
          savedVal = rc.checked; sv.style.display = "none";
          sv.parentNode.appendChild(Object.assign(document.createElement("div"), { className: "savedMsg", textContent: "保存しました" }));
          setTimeout(() => { const m = nt.querySelector(".savedMsg"); if (m) m.remove(); }, 2500);
          renderList();
        };
        rl.append(rc, document.createTextNode("対応済み"));
        nt.append(rl, sv);
      }
      row.append(al, nt);
    }
    body.appendChild(row);
  });
  if (r.note) {
    const nb = document.createElement("div"); nb.className = "memo";
    const nh = document.createElement("div"); const ntag = document.createElement("span"); ntag.className = "tag"; ntag.textContent = "メモ"; nh.appendChild(ntag);
    const ntx = document.createElement("div"); ntx.className = "txt"; ntx.textContent = r.note;
    nb.append(nh, ntx); body.appendChild(nb);
  }
  const rm = await memosOf(r.id);
  const mh = add("h3", "メモ・連絡", "cat"); mh.style.display = "block";
  rm.forEach((m) => body.appendChild(memoBlock(m, async () => { await openRecord(r, { memo: true }); renderList(); })));
  // この記録に紐づくメモを書く欄
  const mw = document.createElement("div"); mw.className = "memoWrite";
  const kr = document.createElement("div"); kr.className = "row"; kr.style.marginBottom = "8px";
  const mkRadio = (val, txt, on) => { const l = document.createElement("label"); const i = document.createElement("input"); i.type = "radio"; i.name = "recMemoKind"; i.value = val; i.checked = on; l.append(i, document.createTextNode(" " + txt)); kr.appendChild(l); };
  mkRadio("memo", "メモ", true); mkRadio("contact", "連絡（申し送り・対応が必要）", false);
  const ta = document.createElement("textarea"); ta.placeholder = "この記録についてのメモや連絡を書く";
  const mr = document.createElement("div"); mr.className = "row"; mr.style.marginTop = "8px";
  const mbtn = document.createElement("button"); mbtn.type = "button"; mbtn.textContent = "メモを追加";
  const mmsg = document.createElement("span"); mmsg.className = "muted"; mmsg.setAttribute("role", "status");
  mbtn.onclick = async () => {
    const text = ta.value.trim();
    if (!text) { mmsg.textContent = "内容を書いてください"; mmsg.className = "err"; return; }
    const kind = mw.querySelector('input[name="recMemoKind"]:checked').value;
    const m = { id: uid(), kind, text, recordId: r.id, done: false, createdAt: new Date().toISOString() };
    try { await tx(["memos"], "readwrite", (t) => t.objectStore("memos").put(m)); } catch (e) { mmsg.textContent = "保存できませんでした（端末の空き容量を確認してください）"; mmsg.className = "err"; return; }
    await openRecord(r, { memo: true }); renderList();
  };
  mr.append(mbtn, mmsg); mw.append(kr, ta, mr); body.appendChild(mw);
  memoAnchor = mw; memoTa = ta;
  const photos = await tx(["photos"], "readonly", (tt) => tt.objectStore("photos").index("recordId").getAll(r.id));
  if (photos.length) {
    add("h3", "写真 " + photos.length + "枚", "cat").style.display = "block";
    const box = document.createElement("div"); box.className = "vthumbs";
    photos.forEach((p) => { const img = document.createElement("img"); img.src = URL.createObjectURL(p.blob); box.appendChild(img); });
    body.appendChild(box);
  }
  // 報告書の出力（PDF＝印刷画面から保存／Excel用CSV／メール）
  add("h3", "報告書を出力", "cat").style.display = "block";
  const outRow = document.createElement("div"); outRow.className = "row"; outRow.style.marginTop = "8px";
  const outMsg = document.createElement("div"); outMsg.className = "muted"; outMsg.setAttribute("role", "status"); outMsg.style.marginTop = "6px";
  const mkBtn = (txt, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "sub"; b.textContent = txt; b.onclick = async () => { outMsg.className = "muted"; outMsg.textContent = ""; try { await fn(); } catch (e) { outMsg.className = "err"; outMsg.textContent = "出力できませんでした：" + (e && e.message ? e.message : e); } }; return b; };
  const baseName = t.name + "_" + fmtDT(new Date(r.createdAt)).replace(/[\/: ]/g, "");
  outRow.append(
    mkBtn("PDFにする（印刷）", async () => {
      // 別画面は開かず、このアプリの上に報告書を重ねて表示する（ポップアップに頼らない）
      outMsg.textContent = "報告書を作っています…";
      const html = await buildReportHtml(r, t, rm, photos);
      showReport(html);
      outMsg.textContent = "";
    }),
    mkBtn("Excel用ファイル（CSV）", async () => {
      saveBlob(new Blob(["﻿" + buildCsv(r, t, rm)], { type: "text/csv" }), baseName + ".csv");
      outMsg.textContent = "ダウンロードしました（" + baseName + ".csv）。Excelで開けます。写真は入りません。";
    }),
    mkBtn("メールで送る", async () => {
      // ファイルは勝手にダウンロードしない。メールの画面だけを開く（添付は必要なら「CSV」「PDF」を先に保存）
      const sub = encodeURIComponent(t.name + (r.property ? " " + r.property : "") + " " + fmtDT(new Date(r.createdAt)));
      const bodyTxt = encodeURIComponent(buildSummary(r, t, rm).slice(0, 1500));
      outMsg.textContent = "メールの画面を開きます。開かない場合は右の「本文をコピー」を使ってください。";
      location.href = "mailto:?subject=" + sub + "&body=" + bodyTxt;
    }),
    mkBtn("本文をコピー", async () => {
      const ta = document.createElement("textarea"); ta.value = buildSummary(r, t, rm);
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(ta); ta.focus(); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      outMsg.textContent = ok ? "報告の文面をコピーしました。メールアプリなどに貼り付けてください。" : "コピーできませんでした。";
    })
  );
  body.append(outRow, outMsg);
  // 管理者だけが消せる削除欄（パスワード）
  const dh = add("h3", "管理者用", "cat"); dh.style.display = "block";
  const delRow = document.createElement("div"); delRow.className = "row"; delRow.style.marginTop = "8px";
  const delBtn = document.createElement("button"); delBtn.type = "button"; delBtn.className = "sub"; delBtn.textContent = "この記録を削除する（管理者のみ）";
  const delNote = document.createElement("span"); delNote.className = "muted"; delNote.textContent = "パスワードが必要です";
  delBtn.onclick = async () => {
    if (!(await adminAuth())) return;
    if (!(await dlg({ title: "記録の削除", msg: "この記録（" + t.name + " " + fmtDT(new Date(r.createdAt)) + "）と写真を削除します。元に戻せません。", ok: "削除する" }))) return;
    await tx(["records", "photos"], "readwrite", (tt) => {
      tt.objectStore("records").delete(r.id);
      tt.objectStore("photos").index("recordId").getAllKeys(r.id).onsuccess = (ev) => { ev.target.result.forEach((k) => tt.objectStore("photos").delete(k)); };
    });
    await renderList(); await renderMemos(); await renderStorage(); show("home"); window.scrollTo(0, 0);
  };
  delRow.append(delBtn, delNote); body.appendChild(delRow);
  show("view"); window.scrollTo(0, 0);
  if (opts && opts.memo && memoAnchor) { memoAnchor.scrollIntoView(); if (opts.focus) memoTa.focus(); }
}
// ---------- 管理者設定（パスワードの設定・変更） ----------
function renderAdmin(doneMsg) {
  let saved = null;
  try { saved = localStorage.getItem("tb-admin-pin"); } catch (e) {}
  const box = $("adminBox"); box.innerHTML = "";
  const mk = (labelText) => {
    const l = document.createElement("label"); l.className = "adminField"; l.textContent = labelText;
    const i = document.createElement("input"); i.type = "password"; i.autocomplete = "off"; l.appendChild(i); box.appendChild(l); return i;
  };
  const st = document.createElement("div"); st.className = "muted"; st.style.marginBottom = "8px";
  st.textContent = saved ? "管理者パスワード：設定済み" : "管理者パスワード：未設定（下で決めてください）";
  box.appendChild(st);
  const cur = saved ? mk("現在のパスワード") : null;
  const n1 = mk(saved ? "新しいパスワード（4文字以上）" : "パスワード（4文字以上）");
  const n2 = mk("もう一度（確認）");
  const msg = document.createElement("span"); msg.className = "muted"; msg.setAttribute("role", "status");
  if (doneMsg) msg.textContent = doneMsg;
  const btn = document.createElement("button"); btn.type = "button"; btn.textContent = saved ? "パスワードを変更する" : "パスワードを設定する";
  btn.onclick = () => {
    const bad = (t) => { msg.className = "err"; msg.textContent = t; };
    if (saved && pinHash(cur.value) !== saved) return bad("現在のパスワードが違います。");
    if (n1.value.length < 4) return bad("新しいパスワードは4文字以上にしてください。");
    if (n1.value !== n2.value) return bad("確認のパスワードが一致しません。");
    try { localStorage.setItem("tb-admin-pin", pinHash(n1.value)); } catch (e) { return bad("保存できませんでした。"); }
    renderAdmin(saved ? "パスワードを変更しました。" : "パスワードを設定しました。");
  };
  const row = document.createElement("div"); row.className = "row"; row.style.marginTop = "8px"; row.append(btn, msg);
  box.appendChild(row);
}
// 管理者のパスワード（この端末に保存。初回だけ新しく決める）
function pinHash(s) { let h = 5381; const x = "tb-admin:" + s; for (let i = 0; i < x.length; i++) h = ((h * 33) ^ x.charCodeAt(i)) >>> 0; return String(h); }
async function adminAuth() {
  let saved = null;
  try { saved = localStorage.getItem("tb-admin-pin"); } catch (e) {}
  if (!saved) {
    const v = await dlg({ title: "管理者パスワードを決める", msg: "まだ設定されていません。4文字以上で決めてください。", fields: ["パスワード", "もう一度（確認）"], ok: "設定する" });
    if (!v) return false;
    if (v[0].length < 4) { await dlg({ title: "入力エラー", msg: "4文字以上で入力してください。", ok: "閉じる", noCancel: true }); return false; }
    if (v[0] !== v[1]) { await dlg({ title: "入力エラー", msg: "確認のパスワードが一致しませんでした。", ok: "閉じる", noCancel: true }); return false; }
    try { localStorage.setItem("tb-admin-pin", pinHash(v[0])); renderAdmin(); } catch (e) { await dlg({ title: "エラー", msg: "パスワードを保存できませんでした。", ok: "閉じる", noCancel: true }); return false; }
    return true;
  }
  const v = await dlg({ title: "管理者の確認", msg: "管理者のパスワードを入力してください。", fields: ["パスワード"], ok: "確認" });
  if (!v) return false;
  if (pinHash(v[0]) !== saved) { await dlg({ title: "確認できません", msg: "パスワードが違います。", ok: "閉じる", noCancel: true }); return false; }
  return true;
}
// ページ内のダイアログ（prompt/confirmが使えない環境でも動く）。OKで入力値の配列（入力欄なしならtrue）、キャンセルでnull
function dlg(o) {
  return new Promise((resolve) => {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;z-index:300;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;";
    const bx = document.createElement("div");
    bx.style.cssText = "background:#fff;border-radius:12px;padding:18px;width:100%;max-width:420px;";
    const h = document.createElement("h2"); h.textContent = o.title; h.style.marginTop = "0";
    const m = document.createElement("div"); m.textContent = o.msg; m.style.marginBottom = "12px";
    bx.append(h, m);
    const ins = (o.fields || []).map((f) => {
      const l = document.createElement("label"); l.className = "adminField"; l.textContent = f;
      const i = document.createElement("input"); i.type = "password"; i.autocomplete = "off"; l.appendChild(i); bx.appendChild(l); return i;
    });
    const row = document.createElement("div"); row.className = "row"; row.style.marginTop = "8px";
    const done = (v) => { document.body.removeChild(ov); resolve(v); };
    const ok = document.createElement("button"); ok.type = "button"; ok.textContent = o.ok || "OK";
    ok.onclick = () => done(ins.length ? ins.map((i) => i.value) : true);
    row.appendChild(ok);
    if (!o.noCancel) { const c = document.createElement("button"); c.type = "button"; c.className = "sub"; c.textContent = "やめる"; c.onclick = () => done(null); row.appendChild(c); }
    bx.appendChild(row); ov.appendChild(bx); document.body.appendChild(ov);
    if (ins[0]) ins[0].focus();
  });
}
$("viewBack").onclick = $("viewBack2").onclick = () => { show("home"); window.scrollTo(0, 0); };

function backToMenu() {
  const dirty = current && (current.checks.some(Boolean) || current.abn.some(Boolean) || current.abnNote.some((s) => s) || current.photos.length || $("note").value.trim());
  if (dirty && !confirm("入力した内容は保存されません。メニューに戻りますか？")) return;
  closeCamera(); current = null; show("home"); window.scrollTo(0, 0);
}
$("cancel").onclick = backToMenu;
$("backTop").onclick = backToMenu;

async function renderList() {
  const recs = await tx(["records"], "readonly", (t) => t.objectStore("records").getAll());
  recs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const box = $("list"); box.innerHTML = "";
  const memosAll = await tx(["memos"], "readonly", (t) => t.objectStore("memos").getAll());
  const items = recs.map((r) => ({ r, at: r.createdAt })).concat(memosAll.filter((m) => !m.recordId).map((m) => ({ m, at: m.createdAt })));
  items.sort((x, y) => y.at.localeCompare(x.at));
  if (!items.length) { box.innerHTML = '<div class="empty">まだ記録がありません。上のボタンから最初の記録を作ってください。</div>'; return; }
  for (const it of items) {
    if (it.m) {
      const mc = document.createElement("div"); mc.className = "card";
      mc.appendChild(memoBlock(it.m, async () => { await renderList(); }));
      mc.lastChild.style.marginBottom = "0";
      box.appendChild(mc); continue;
    }
    const r = it.r;
    const t = TEMPLATES[r.template] || { name: r.template, items: [] };
    const done = r.checks.filter(Boolean).length;
    const d = new Date(r.createdAt);
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<div class="rechead"><span><strong>${t.name}</strong> <span class="muted">${fmtDT(d)}</span>　<span class="recCnt">チェック ${done}/${r.checks.length}　写真 ${r.photoCount}枚</span></span><span class="recBtns"><button class="memoBtn sub" type="button">メモを<br>書く</button><button class="viewBtn" type="button">記録を<br>確認</button></span></div>
      ${r.abn && r.abn.length ? `<div data-abn></div>` : ""}
      <div class="thumbs"></div>`;
    if (r.property) { const pl = document.createElement("div"); pl.className = "propLine"; pl.textContent = r.property; card.prepend(pl); }
    if (r.abn && r.abn.length) {
      const open = r.abn.filter((a) => !a.resolved);
      const ab = card.querySelector("[data-abn]");
      ab.className = "memo abnMemo" + (open.length ? " contact" : " fixedAll");
      const hd = document.createElement("div");
      const tg = document.createElement("span"); tg.className = "tag" + (open.length ? " contact" : " ok"); tg.textContent = open.length ? "要対応 " + open.length + "件" : "対応済み";
      const wh = document.createElement("span"); wh.className = "muted"; wh.textContent = fmtDT(d) + "　異常あり " + r.abn.length + "件";
      hd.append(tg, wh);
      const tx2 = document.createElement("div"); tx2.className = "txt";
      tx2.textContent = r.abn.map((a) => (a.resolved ? "✓ " : "・") + a.label + (a.note ? "（" + a.note + "）" : "") + (a.resolved ? "　対応済み" : "")).join("\n");
      ab.append(hd, tx2);
    }
    card.querySelector(".viewBtn").onclick = () => openRecord(r);
    if (r.note) {
      const nb = document.createElement("div"); nb.className = "memo";
      const nh = document.createElement("div"); const ntag = document.createElement("span"); ntag.className = "tag"; ntag.textContent = "メモ"; nh.appendChild(ntag);
      const ntx = document.createElement("div"); ntx.className = "txt"; ntx.textContent = r.note;
      nb.append(nh, ntx); card.appendChild(nb);
    }
    const rmemos = await memosOf(r.id);
    rmemos.forEach((m) => card.appendChild(memoBlock(m)));
    const mb = card.querySelector(".memoBtn");
    mb.onclick = () => openRecord(r, { memo: true, focus: true });
    box.appendChild(card);
    const photos = await tx(["photos"], "readonly", (tt) => tt.objectStore("photos").index("recordId").getAll(r.id));
    const th = card.querySelector(".thumbs");
    for (const p of photos.slice(0, 4)) { const img = document.createElement("img"); img.src = URL.createObjectURL(p.blob); th.appendChild(img); }
    if (photos.length > 4) { const more = document.createElement("div"); more.className = "muted"; more.textContent = "ほか " + (photos.length - 4) + " 枚"; th.parentNode.insertBefore(more, th.nextSibling); }
  }
}

// ---------- メモ・連絡（記録に紐付けても、単独でも書ける） ----------
const recLabel = (r) => (TEMPLATES[r.template] ? TEMPLATES[r.template].name : r.template) + (r.property ? " " + r.property : "") + " " + fmtDT(new Date(r.createdAt));
async function renderMemos() { await renderList(); }
$("memoAdd").onclick = async () => {
  const text = $("memoText").value.trim();
  const msg = $("memoMsg");
  if (!text) { msg.textContent = "内容を書いてください"; msg.className = "err"; return; }
  const kind = document.querySelector('input[name="memoKind"]:checked').value;
  const m = { id: uid(), kind, text, recordId: "", done: false, createdAt: new Date().toISOString() };
  try {
    await tx(["memos"], "readwrite", (t) => t.objectStore("memos").put(m));
    $("memoText").value = ""; msg.textContent = "追加しました"; msg.className = "muted";
    await renderMemos();
  } catch (err) { msg.textContent = "保存できませんでした（端末の空き容量を確認してください）"; msg.className = "err"; }
};

// ---------- 保存領域の確認(iPad等での容量制約の確認用) ----------
async function renderStorage() {
  const el = $("storage");
  try {
    let persisted = "不明";
    if (navigator.storage && navigator.storage.persist) persisted = (await navigator.storage.persisted()) ? "はい" : (await navigator.storage.persist()) ? "はい" : "いいえ";
    const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null;
    const mb = (n) => (n / 1048576).toFixed(1);
    el.textContent = est ? `保存領域: 使用 ${mb(est.usage)}MB / 上限の目安 ${mb(est.quota)}MB ／ 消されにくい保存: ${persisted}` : "保存領域の情報を取得できません";
  } catch { el.textContent = "保存領域の情報を取得できません"; }
}

// ---------- 通信状態・文字サイズ・Service Worker ----------
function renderNet() { const n = $("net"); const on = navigator.onLine; n.textContent = on ? "オンライン" : "オフライン（端末内に保存）"; n.className = "badge" + (on ? "" : " off"); }
addEventListener("online", renderNet); addEventListener("offline", renderNet);
$("size").onclick = () => { const l = document.documentElement.classList.toggle("large"); $("size").textContent = l ? "文字 中" : "文字 大"; };

(async function init() {
  renderNet(); renderTemplates();
  try { db = await openDb(); renderAdmin(); await renderMemos(); await renderStorage(); }
  catch { $("list").innerHTML = '<div class="empty err">この端末では記録を保存できません。ブラウザの設定（プライベートモード等）を確認してください。</div>'; }
  if ("serviceWorker" in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (had) location.reload(); });
    navigator.serviceWorker.register("sw.js").then((reg) => {
      const chk = () => { try { reg.update(); } catch (e) {} };
      document.addEventListener("visibilitychange", () => { if (!document.hidden) chk(); });
      window.addEventListener("online", chk);
    }).catch(() => {});
  }
})();
