"use strict";
// 試作: チェックリスト＋写真＋端末内保存(IndexedDB)＋オフライン動作。サーバー通信なし。

const TEMPLATES = {
  cleaning: { name: "清掃チェック", items: ["床の掃除", "トイレの掃除", "ゴミの回収", "備品の補充", "忘れ物の確認"] },
  inspect:  { name: "住宅異常点検チェック", abnormal: true, items: [
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
function show(which) { $("home").hidden = which !== "home"; $("edit").hidden = which !== "edit"; }
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
      const h = document.createElement("h3"); h.className = "cat"; h.textContent = lastCat;
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
    al.append(ac, document.createTextNode("異常あり"));
    const tx_ = document.createElement("input"); tx_.type = "text"; tx_.className = "abnNote"; tx_.placeholder = "異常の内容を入力";
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

$("photo").onchange = async (e) => {
  for (const f of e.target.files) {
    const blob = await shrink(f);
    current.photos.push(blob);
    const img = document.createElement("img"); img.src = URL.createObjectURL(blob);
    $("thumbs").appendChild(img);
  }
  e.target.value = "";
};

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
    current = null; await renderList(); await renderMemos(); await renderStorage(); show("home");
  } catch (err) {
    // 保存に失敗したら入力内容は残し、理由と次の操作を示す
    saving = false; $("save").disabled = false;
    setMsg("保存できませんでした（端末の空き容量が足りない可能性があります）。写真を減らして、もう一度保存してください。", true);
  }
};
$("cancel").onclick = () => { current = null; show("home"); };

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
    card.innerHTML = `<strong>${t.name}</strong> <span class="muted">${d.toLocaleString("ja-JP")}</span>
      <div>チェック ${done}/${r.checks.length}　写真 ${r.photoCount}枚　<span class="muted">保存済み（この端末内）</span></div>
      ${r.abn && r.abn.length ? `<div class="err" data-abn></div>` : ""}
      ${r.note ? `<div class="muted"></div>` : ""}<div class="thumbs"></div>`;
    if (r.abn && r.abn.length) card.querySelector("[data-abn]").textContent = "異常あり " + r.abn.length + "件：" + r.abn.map((a) => a.label + (a.note ? "（" + a.note + "）" : "")).join("、");
    if (r.note) card.querySelector("div.muted:not(.thumbs)").textContent = r.note;
    const mb = document.createElement("button"); mb.className = "sub"; mb.style.minHeight = "40px"; mb.textContent = "この記録にメモを書く";
    mb.onclick = () => { $("memoLink").value = r.id; $("memoCard").scrollIntoView(); $("memoText").focus(); };
    card.appendChild(mb);
    box.appendChild(card);
    const photos = await tx(["photos"], "readonly", (tt) => tt.objectStore("photos").index("recordId").getAll(r.id));
    const th = card.querySelector(".thumbs");
    for (const p of photos) { const img = document.createElement("img"); img.src = URL.createObjectURL(p.blob); th.appendChild(img); }
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
  try { db = await openDb(); await renderList(); await renderMemos(); await renderStorage(); }
  catch { $("list").innerHTML = '<div class="empty err">この端末では記録を保存できません。ブラウザの設定（プライベートモード等）を確認してください。</div>'; }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
