"use strict";
// 試作: チェックリスト＋写真＋端末内保存(IndexedDB)＋オフライン動作。サーバー通信なし。

const TEMPLATES = {
  cleaning: { name: "清掃チェック", items: ["床の掃除", "トイレの掃除", "ゴミの回収", "備品の補充", "忘れ物の確認"] },
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
    "【共用・その他】その他の気になる点（備考に記入）"
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
function show(which) { $("home").hidden = which !== "home"; $("edit").hidden = which !== "edit"; $("view").hidden = which !== "view"; }
function setMsg(text, isErr) { const m = $("msg"); m.textContent = text; m.className = isErr ? "err" : "muted"; }

function renderTemplates() {
  $("templates").innerHTML = "";
  for (const [key, t] of Object.entries(TEMPLATES)) {
    const b = document.createElement("button");
    b.textContent = t.name;
    b.onclick = () => startEdit(key);
    $("templates").appendChild(b);
  }
}

function startEdit(key) {
  const t = TEMPLATES[key];
  current = { template: key, checks: t.items.map(() => false), abn: t.items.map(() => false), abnNote: t.items.map(() => ""), photos: [] };
  $("editTitle").textContent = t.name;
  $("items").innerHTML = "";
  let lastCat = "";
  t.items.forEach((full, i) => {
    // 「【分野】項目」の形は、分野の見出しを付けて表示する
    const m = /^【(.*?)】(.*)$/.exec(full);
    const label = m ? m[2] : full;
    if (m && m[1] !== lastCat) {
      lastCat = m[1];
      const h = document.createElement("h3"); h.className = "cat";
      const ht = document.createElement("span"); ht.textContent = lastCat; h.appendChild(ht);
      if (t.abnormal) {
        const s1 = document.createElement("span"); s1.className = "abnHead"; s1.textContent = "異常あり";
        const s2 = document.createElement("span"); s2.className = "noteHead"; s2.textContent = "内容";
        h.append(s1, s2);
      }
      $("items").appendChild(h);
    }
    const l = document.createElement("label"); l.className = "check";
    const c = document.createElement("input"); c.type = "checkbox";
    c.onchange = () => { current.checks[i] = c.checked; };
    l.append(c, document.createTextNode(label));
    if (!t.abnormal) { $("items").appendChild(l); return; }
    // 点検項目：右に「異常あり」のチェック欄と、内容を直接書く欄を付ける
    l.classList.add("small");
    const row = document.createElement("div"); row.className = "chkrow";
    const al = document.createElement("label"); al.className = "abn";
    const ac = document.createElement("input"); ac.type = "checkbox";
    al.appendChild(ac); al.title = "異常あり"; ac.setAttribute("aria-label", "異常あり");
    const tx_ = document.createElement("input"); tx_.type = "text"; tx_.className = "abnNote"; tx_.placeholder = (m && i > 0 && t.items[i-1].indexOf("【" + m[1] + "】") === 0) ? "" : "異常の内容を入力";
    ac.onchange = () => { current.abn[i] = ac.checked; row.classList.toggle("bad", ac.checked); };
    tx_.oninput = () => {
      current.abnNote[i] = tx_.value;
      if (tx_.value && !ac.checked) { ac.checked = true; ac.onchange(); } // 書き始めたら自動で「異常あり」
    };
    row.append(l, al, tx_);
    $("items").appendChild(row);
  });
  $("note").value = ""; $("thumbs").innerHTML = ""; setMsg("");
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
                checks: current.checks, abn: current.abn.map((b, i) => b ? { label: TEMPLATES[current.template].items[i].replace(/^【.*?】/, ""), note: current.abnNote[i].trim() } : null).filter(Boolean), note: $("note").value.trim(), photoCount: current.photos.length };
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
function memoBlock(m) {
  const d = document.createElement("div");
  d.className = "memo" + (m.kind === "contact" ? " contact" : "") + (m.done ? " done" : "");
  const tag = document.createElement("span"); tag.className = "tag" + (m.kind === "contact" ? " contact" : "");
  tag.textContent = m.kind === "contact" ? (m.done ? "連絡・対応済み" : "連絡・未対応") : "メモ";
  const when = document.createElement("span"); when.className = "muted"; when.textContent = new Date(m.createdAt).toLocaleString("ja-JP");
  const txt = document.createElement("div"); txt.className = "txt"; txt.textContent = m.text;
  const head = document.createElement("div"); head.append(tag, when);
  d.append(head, txt);
  return d;
}
async function memosOf(recordId) {
  const all = await tx(["memos"], "readonly", (t) => t.objectStore("memos").getAll());
  return all.filter((m) => m.recordId === recordId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
// ---------- 保存した記録の内容を見る（読み取り専用） ----------
async function openRecord(r) {
  const t = TEMPLATES[r.template] || { name: r.template, items: [] };
  const body = $("viewBody"); body.innerHTML = "";
  const add = (tag, text, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; body.appendChild(e); return e; };
  add("h2", t.name);
  add("div", new Date(r.createdAt).toLocaleString("ja-JP"), "muted");
  const abnBy = {}; (r.abn || []).forEach((a) => { abnBy[a.label] = a; });
  const abnT = !!t.abnormal;
  const ro = (checked) => { const c = document.createElement("input"); c.type = "checkbox"; c.checked = checked; c.disabled = true; return c; };
  let lastCat = "";
  t.items.forEach((full, i) => {
    const m = /^【(.*?)】(.*)$/.exec(full), label = m ? m[2] : full;
    if (m && m[1] !== lastCat) {
      lastCat = m[1];
      const h = document.createElement("h3"); h.className = "cat";
      const ht = document.createElement("span"); ht.textContent = lastCat; h.appendChild(ht);
      if (abnT) {
        const s1 = document.createElement("span"); s1.className = "abnHead"; s1.textContent = "異常あり";
        const s2 = document.createElement("span"); s2.className = "noteHead"; s2.textContent = "内容";
        h.append(s1, s2);
      }
      body.appendChild(h);
    }
    const a = abnBy[label];
    const row = document.createElement("div"); row.className = (abnT ? "chkrow vview" : "vrow") + (a ? " bad" : "");
    const lab = document.createElement("label"); lab.className = "check small";
    lab.append(ro(!!r.checks[i]), document.createTextNode(label));
    row.appendChild(lab);
    if (abnT) {
      const al = document.createElement("label"); al.className = "abn"; al.appendChild(ro(!!a));
      const nt = document.createElement("div"); nt.className = "vnote"; nt.textContent = a ? (a.note || "") : "";
      row.append(al, nt);
    }
    body.appendChild(row);
  });
  if (r.note) { add("h3", "備考", "cat").style.display = "block"; add("div", r.note).style.whiteSpace = "pre-wrap"; }
  const rm = await memosOf(r.id);
  if (rm.length) { add("h3", "メモ・連絡", "cat").style.display = "block"; rm.forEach((m) => body.appendChild(memoBlock(m))); }
  const photos = await tx(["photos"], "readonly", (tt) => tt.objectStore("photos").index("recordId").getAll(r.id));
  if (photos.length) {
    add("h3", "写真 " + photos.length + "枚", "cat").style.display = "block";
    const box = document.createElement("div"); box.className = "vthumbs";
    photos.forEach((p) => { const img = document.createElement("img"); img.src = URL.createObjectURL(p.blob); box.appendChild(img); });
    body.appendChild(box);
  }
  show("view"); window.scrollTo(0, 0);
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
  if (!recs.length) { box.innerHTML = '<div class="empty">まだ記録がありません。上のボタンから最初の記録を作ってください。</div>'; return; }
  for (const r of recs) {
    const t = TEMPLATES[r.template] || { name: r.template, items: [] };
    const done = r.checks.filter(Boolean).length;
    const d = new Date(r.createdAt);
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<div class="rechead"><span><strong>${t.name}</strong> <span class="muted">${d.toLocaleString("ja-JP")}</span></span><button class="viewBtn" type="button">記録を<br>確認</button></div>
      <div>チェック ${done}/${r.checks.length}　写真 ${r.photoCount}枚</div>
      ${r.abn && r.abn.length ? `<div class="err" data-abn></div>` : ""}
      ${r.note ? `<div class="muted"></div>` : ""}<div class="thumbs"></div>`;
    if (r.abn && r.abn.length) card.querySelector("[data-abn]").textContent = "異常あり " + r.abn.length + "件：" + r.abn.map((a) => a.label + (a.note ? "（" + a.note + "）" : "")).join("、");
    if (r.note) card.querySelector("div.muted:not(.thumbs)").textContent = r.note;
    card.querySelector(".viewBtn").onclick = () => openRecord(r);
    const rmemos = await memosOf(r.id);
    rmemos.forEach((m) => card.appendChild(memoBlock(m)));
    const mb = document.createElement("button"); mb.className = "sub"; mb.style.minHeight = "40px"; mb.textContent = "この記録にメモを書く";
    mb.onclick = () => { $("memoLink").value = r.id; $("memoCard").scrollIntoView(); $("memoText").focus(); };
    card.appendChild(mb);
    box.appendChild(card);
    const photos = await tx(["photos"], "readonly", (tt) => tt.objectStore("photos").index("recordId").getAll(r.id));
    const th = card.querySelector(".thumbs");
    for (const p of photos.slice(0, 4)) { const img = document.createElement("img"); img.src = URL.createObjectURL(p.blob); th.appendChild(img); }
    if (photos.length > 4) { const more = document.createElement("div"); more.className = "muted"; more.textContent = "ほか " + (photos.length - 4) + " 枚"; th.parentNode.insertBefore(more, th.nextSibling); }
  }
}

// ---------- メモ・連絡（記録に紐付けても、単独でも書ける） ----------
const recLabel = (r) => (TEMPLATES[r.template] ? TEMPLATES[r.template].name : r.template) + " " + new Date(r.createdAt).toLocaleString("ja-JP");
async function renderMemos() {
  const recs = await tx(["records"], "readonly", (t) => t.objectStore("records").getAll());
  recs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const memos = await tx(["memos"], "readonly", (t) => t.objectStore("memos").getAll());
  // 紐付け先の選択肢（選択中の値は保つ）
  const sel = $("memoLink"), keep = sel.value;
  sel.innerHTML = "";
  const none = document.createElement("option"); none.value = ""; none.textContent = "（紐付けない）"; sel.appendChild(none);
  recs.forEach((r) => { const o = document.createElement("option"); o.value = r.id; o.textContent = recLabel(r); sel.appendChild(o); });
  sel.value = keep;
  // 未対応の連絡を先頭、次に新しい順
  const rank = (m) => (m.kind === "contact" && !m.done) ? 0 : 1;
  memos.sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));
  await renderList();
  const box = $("memoList"); box.innerHTML = "";
  if (!memos.length) { box.innerHTML = '<div class="empty">まだメモ・連絡がありません。</div>'; return; }
  const byId = {}; recs.forEach((r) => { byId[r.id] = r; });
  memos.forEach((m) => {
    const d = document.createElement("div");
    d.className = "memo" + (m.kind === "contact" ? " contact" : "") + (m.done ? " done" : "");
    const head = document.createElement("div");
    const tag = document.createElement("span"); tag.className = "tag" + (m.kind === "contact" ? " contact" : "");
    tag.textContent = m.kind === "contact" ? (m.done ? "連絡・対応済み" : "連絡・未対応") : "メモ";
    const when = document.createElement("span"); when.className = "muted";
    when.textContent = new Date(m.createdAt).toLocaleString("ja-JP") + (m.recordId ? "　記録: " + (byId[m.recordId] ? recLabel(byId[m.recordId]) : "（削除された記録）") : "");
    head.append(tag, when);
    const txt = document.createElement("div"); txt.className = "txt"; txt.textContent = m.text;
    const row = document.createElement("div"); row.className = "row";
    if (m.kind === "contact") {
      const b = document.createElement("button"); b.className = "sub"; b.style.minHeight = "44px";
      b.textContent = m.done ? "未対応に戻す" : "対応済みにする";
      b.onclick = async () => { m.done = !m.done; await tx(["memos"], "readwrite", (t) => t.objectStore("memos").put(m)); await renderMemos(); };
      row.appendChild(b);
    }
    const x = document.createElement("button"); x.className = "sub"; x.style.minHeight = "44px"; x.textContent = "削除";
    x.onclick = async () => { if (!confirm("このメモを削除しますか？（元に戻せません）")) return; await tx(["memos"], "readwrite", (t) => t.objectStore("memos").delete(m.id)); await renderMemos(); };
    row.appendChild(x);
    d.append(head, txt, row);
    box.appendChild(d);
  });
}
$("memoAdd").onclick = async () => {
  const text = $("memoText").value.trim();
  const msg = $("memoMsg");
  if (!text) { msg.textContent = "内容を書いてください"; msg.className = "err"; return; }
  const kind = document.querySelector('input[name="memoKind"]:checked').value;
  const m = { id: uid(), kind, text, recordId: $("memoLink").value || "", done: false, createdAt: new Date().toISOString() };
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
  try { db = await openDb(); await renderMemos(); await renderStorage(); }
  catch { $("list").innerHTML = '<div class="empty err">この端末では記録を保存できません。ブラウザの設定（プライベートモード等）を確認してください。</div>'; }
  if ("serviceWorker" in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (had) location.reload(); });
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
