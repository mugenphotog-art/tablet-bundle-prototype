"use strict";
// 試作: チェックリスト＋写真＋端末内保存(IndexedDB)＋オフライン動作。サーバー通信なし。

const TEMPLATES = {
  cleaning: { name: "清掃チェック", items: ["床の掃除", "トイレの掃除", "ゴミの回収", "備品の補充", "忘れ物の確認"] },
  inspect:  { name: "点検チェック", items: ["火元の確認", "戸締まり", "照明の確認", "異音・異臭なし", "機器の電源OFF"] },
};

const $ = (id) => document.getElementById(id);
let db;
let current = null; // 編集中: {template, checks:[bool], photos:[Blob]}
let saving = false;

// ---------- IndexedDB ----------
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("tablet-bundle-proto", 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore("records", { keyPath: "id" });
      d.createObjectStore("photos", { keyPath: "id" }).createIndex("recordId", "recordId");
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
  current = { template: key, checks: t.items.map(() => false), photos: [] };
  $("editTitle").textContent = t.name;
  $("items").innerHTML = "";
  t.items.forEach((label, i) => {
    const l = document.createElement("label"); l.className = "check";
    const c = document.createElement("input"); c.type = "checkbox";
    c.onchange = () => { current.checks[i] = c.checked; };
    l.append(c, document.createTextNode(label));
    $("items").appendChild(l);
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
                checks: current.checks, note: $("note").value.trim(), photoCount: current.photos.length };
  try {
    await tx(["records", "photos"], "readwrite", (t) => {
      t.objectStore("records").put(rec);
      current.photos.forEach((blob) => t.objectStore("photos").put({ id: uid(), recordId: id, blob }));
    });
    current = null; await renderList(); await renderStorage(); show("home");
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
      ${r.note ? `<div class="muted"></div>` : ""}<div class="thumbs"></div>`;
    if (r.note) card.querySelector(".muted + .muted, div.muted").textContent = r.note;
    box.appendChild(card);
    const photos = await tx(["photos"], "readonly", (tt) => tt.objectStore("photos").index("recordId").getAll(r.id));
    const th = card.querySelector(".thumbs");
    for (const p of photos) { const img = document.createElement("img"); img.src = URL.createObjectURL(p.blob); th.appendChild(img); }
  }
}

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
  try { db = await openDb(); await renderList(); await renderStorage(); }
  catch { $("list").innerHTML = '<div class="empty err">この端末では記録を保存できません。ブラウザの設定（プライベートモード等）を確認してください。</div>'; }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
