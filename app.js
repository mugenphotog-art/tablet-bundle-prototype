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
      const nt = document.createElement("div"); nt.className = "vnote"; nt.textContent = a ? (a.note || "") : "";
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
      <div class="thumbs"></div>`;
    if (r.abn && r.abn.length) card.querySelector("[data-abn]").textContent = "異常あり " + r.abn.length + "件：" + r.abn.map((a) => a.label + (a.note ? "（" + a.note + "）" : "")).join("、");
    card.querySelector(".viewBtn").onclick = () => openRecord(r);
    if (r.note) {
      const nb = document.createElement("div"); nb.className = "memo";
      const nh = document.createElement("div"); const ntag = document.createElement("span"); ntag.className = "tag"; ntag.textContent = "メモ"; nh.appendChild(ntag);
      const ntx = document.createElement("div"); ntx.className = "txt"; ntx.textContent = r.note;
      nb.append(nh, ntx); card.appendChild(nb);
    }
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
