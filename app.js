"use strict";

const skills = {
  listening: { name: "ฟัง", english: "Listening", icon: "◉" },
  speaking: { name: "พูด", english: "Speaking", icon: "◌" },
  reading: { name: "อ่าน", english: "Reading", icon: "▤" },
  writing: { name: "เขียน", english: "Writing", icon: "✎" },
};

const storageKey = "englishme.prototype.v1";
const main = document.querySelector("main");
const storageStatus = document.querySelector("#storage-status");
const localDay = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", day: "2-digit",
});
const thaiDate = new Intl.DateTimeFormat("th-TH", {
  weekday: "long", day: "numeric", month: "long",
});
const historyDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });
const reviewIntervals = [1, 3, 7, 14, 30];
const writingCriteria = [
  ["ข้อมูล", "ข้อมูลครบและตรงกับโจทย์หรือต้นทาง", "ขีดเส้นใต้วัน เวลา สถานที่ และสิ่งที่ต้องทำในต้นทาง แล้วตรวจทีละรายการว่าปรากฏในร่างครบและถูกต้อง"],
  ["ความเหมาะสม", "น้ำเสียงเหมาะกับผู้รับ และผู้รับรู้ว่าต้องทำอะไรต่อ", "ลองอ่านในมุมผู้รับ เติมคำขอหรือขั้นตอนถัดไปที่เขาตอบหรือทำได้ทันที"],
  ["ลำดับความ", "จับใจความสำคัญได้ง่ายและเรียงรายละเอียดเป็นลำดับ", "ย้ายเหตุผลหลักที่ส่งข้อความมาไว้ต้นเรื่อง แล้วเรียงรายละเอียดตามลำดับเวลาหรือขั้นตอน"],
  ["ภาษา", "คำศัพท์และประโยคสื่อความได้ชัด แม้มีจุดที่ยังแก้ได้", "อ่านร่างออกเสียง แยกประโยคที่มีหลายเรื่อง และตรวจคำบอกวัน เวลา หรือการกระทำที่อาจทำให้ตีความผิด"],
];

function emptyState() {
  return { goal: 15, attempts: [], reviews: [], drafts: {}, startScenario: "", startSkill: "" };
}

function validateState(value) {
  if (!value || typeof value !== "object" || ![5, 10, 15, 20, 30].includes(value.goal)
    || !Array.isArray(value.attempts) || !Array.isArray(value.reviews)
    || !value.drafts || typeof value.drafts !== "object" || Array.isArray(value.drafts)) return false;
  // Leave room to add a review interval near the limits of JavaScript dates.
  const validDate = (at) => typeof at === "string" && Math.abs(Date.parse(at)) <= 8.64e15 - 31 * 86400000;
  const index = (i, length) => Number.isInteger(i) && i >= 0 && i < length;
  const checks = (items, length) => Array.isArray(items) && new Set(items).size === items.length && items.every((i) => index(i, length));
  const preference = (item, options) => item === undefined || item === "" || (typeof item === "string" && Object.hasOwn(options, item));
  return preference(value.startScenario, scenarios)
    && preference(value.startSkill, skills)
    && Object.entries(value.drafts).every(([id, text]) => lessons.some((lesson) => lesson.id === id && lesson.skill === "writing") && typeof text === "string" && text.length <= 1500)
    && value.attempts.every((attempt) => {
      if (!attempt || !validDate(attempt.at)) return false;
      const lesson = lessons.find((entry) => entry.id === attempt.lessonId);
      if (!lesson) return false;
      if (["correct", "usedTranscript", "usedSlowAudio"].some((field) => attempt[field] !== undefined && typeof attempt[field] !== "boolean")) return false;
      if (attempt.audioPlays !== undefined && (lesson.skill !== "listening" || !Number.isSafeInteger(attempt.audioPlays) || attempt.audioPlays < 0)) return false;
      if (attempt.text !== undefined && (lesson.skill !== "writing" || typeof attempt.text !== "string" || attempt.text.length > 1500)) return false;
      if (attempt.selfCheck !== undefined && (!attempt.text || !checks(attempt.selfCheck, writingCriteria.length))) return false;
      if (attempt.speakingForm !== undefined || attempt.speakingChecks !== undefined) {
        if (!lesson.prompts || !index(attempt.speakingForm, lesson.prompts.length) || !checks(attempt.speakingChecks, lesson.criteria.length)) return false;
      }
      if (attempt.choice !== undefined && !index(attempt.choice, lesson.choices?.length)) return false;
      const questions = lesson.choices && !lesson.conversation ? comprehensionQuestions(lesson) : [];
      if (attempt.total !== undefined || attempt.score !== undefined) {
        if (!Number.isInteger(attempt.total) || !index(attempt.total - 1, questions.length) || !index(attempt.score, attempt.total + 1)) return false;
      }
      if (attempt.answers === undefined) return true;
      return Array.isArray(attempt.answers) && attempt.answers.length === attempt.total
        && attempt.answers.every((answer, i) => index(answer, questions[i].choices.length))
        && attempt.score === attempt.answers.filter((answer, i) => answer === questions[i].answer).length;
    })
    && value.reviews.every((event) => event && cards.some((card) => card.id === event.cardId) && validDate(event.at)
      && ["recalled", "with-help", "again"].includes(event.rating)
      && Number.isInteger(event.step ?? 0) && (event.step ?? 0) >= 0 && (event.step ?? 0) < reviewIntervals.length);
}

function normalizeState(value) {
  const data = Object.fromEntries(Object.entries(emptyState()).map(([key, fallback]) => [key, value[key] ?? fallback]));
  for (const events of [data.attempts, data.reviews]) events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return data;
}

function warnStorage(message = "บันทึกบนอุปกรณ์ไม่ได้ ดาวน์โหลดข้อมูลสำรองก่อนปิดหน้าเพื่อเก็บการฝึกครั้งนี้") {
  storageStatus.textContent = message;
  storageStatus.hidden = false;
}

const state = emptyState();
let storedRaw;
const pendingChanges = [];

function refreshState() {
  const raw = localStorage.getItem(storageKey);
  if (raw === storedRaw) return;
  const parsed = raw === null ? emptyState() : JSON.parse(raw);
  const data = parsed && !Array.isArray(parsed) && typeof parsed === "object" && { ...emptyState(), ...parsed };
  if (!validateState(data)) throw new Error("Invalid saved data");
  const latest = normalizeState(data);
  for (const change of pendingChanges) change(latest);
  Object.assign(state, latest);
  storedRaw = raw;
  if (!pendingChanges.length) storageStatus.hidden = true;
}

function readCurrentState() {
  try {
    refreshState();
    return true;
  } catch {
    warnStorage("อ่านข้อมูลเดิมบนอุปกรณ์ไม่ได้ การฝึกใหม่จะอยู่ในหน้านี้ชั่วคราว คุณยังนำเข้าจากไฟล์สำรองได้");
    return false;
  }
}

function persistState(data) {
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(storageKey, raw);
    storedRaw = raw;
    pendingChanges.length = 0;
    storageStatus.hidden = true;
    return true;
  } catch {
    warnStorage();
    return false;
  }
}

function withStorageLock(task) {
  const locks = globalThis.navigator?.locks;
  if (!locks) return Promise.resolve(task());
  let started = false;
  return locks.request(storageKey, () => {
    started = true;
    return task();
  }).catch((error) => {
    if (started) throw error;
    return task();
  });
}

function updateState(change) {
  return withStorageLock(() => {
    const readable = readCurrentState();
    const changed = change(state) !== false;
    if (changed) pendingChanges.push(change);
    const saved = readable && (pendingChanges.length === 0 || persistState(state));
    return { changed, saved };
  });
}

readCurrentState();

function completedToday(now = new Date()) {
  const today = localDay.format(now);
  return new Set(state.attempts.filter((attempt) => localDay.format(new Date(attempt.at)) === today)
    .map((attempt) => attempt.lessonId));
}

function nextReviewDate(at, step) {
  const date = new Date(at);
  date.setDate(date.getDate() + reviewIntervals[step]);
  return date;
}

function latestReview(card, data = state) {
  return data.reviews.findLast((event) => event.cardId === card.id);
}

function reviewDue(previous, now) {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return !previous || nextReviewDate(previous.at, previous.step ?? 0) < tomorrow;
}

function reviewQueue(now = new Date()) {
  return cards.filter((card) => reviewDue(latestReview(card), now));
}

function latestWriting(lesson, data = state) {
  return data.attempts.findLast((entry) => entry.lessonId === lesson.id && entry.text);
}

function hasDraft(lesson) {
  const draft = state.drafts[lesson.id]?.trim();
  return Boolean(draft && draft !== latestWriting(lesson)?.text);
}

function lessonCard(lesson, done, showGoal = false) {
  const skill = skills[lesson.skill];
  return `<li data-lesson-id="${lesson.id}">
    <a class="lesson" href="#lesson/${lesson.id}">
      <span class="skill-mark ${lesson.skill}" aria-hidden="true">${skill.icon}</span>
      <div class="lesson-name"><strong lang="en">${lesson.title}</strong><small>${scenarios[lesson.scenario]} · ${lesson.sources ? "ภารกิจท้ายชุด" : skill.name} · ${lesson.minutes} นาที</small>
        ${showGoal ? `<p class="lesson-goal">${lesson.goal}</p>` : ""}</div>
      ${hasDraft(lesson) ? '<span class="done-label previous">มีร่างค้าง</span>' : done.has(lesson.id) ? '<span class="done-label">✓ วันนี้</span>' : state.attempts.some((attempt) => attempt.lessonId === lesson.id) ? '<span class="done-label previous">✓ ฝึกแล้ว</span>' : ""}
      <span class="card-arrow" aria-hidden="true">↗</span>
    </a>
  </li>`;
}

function practiceSummary(now = new Date()) {
  const done = completedToday(now);
  const minutes = lessons.filter((lesson) => done.has(lesson.id)).reduce((sum, lesson) => sum + lesson.minutes, 0);
  const dates = new Set([...state.attempts, ...state.reviews].map((event) => localDay.format(new Date(event.at))));
  const cursor = new Date(now);
  if (!dates.has(localDay.format(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (dates.has(localDay.format(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return { done, minutes, streak, dates };
}

function summaryCards() {
  const { done, minutes, streak } = practiceSummary();
  const total = new Set(state.attempts.map((attempt) => attempt.lessonId)).size;
  return `<div class="summary-grid" aria-label="สรุปการฝึก">
    <div class="summary-card"><span class="summary-icon" aria-hidden="true">◷</span><div><span class="stat-label">เป้าหมายวันนี้</span><p><strong>${minutes}</strong><span> / ${state.goal} นาที</span></p><progress value="${Math.min(minutes, state.goal)}" max="${state.goal}" aria-label="เวลาโดยประมาณที่ฝึกวันนี้"></progress></div></div>
    <div class="summary-card"><span class="summary-icon sage" aria-hidden="true">✓</span><div><span class="stat-label">บทที่ฝึกวันนี้</span><p><strong>${done.size}</strong><span> บทเรียน</span></p><small>สะสมแล้ว ${total} จาก ${lessons.length} บท</small></div></div>
    <div class="summary-card"><span class="summary-icon lilac" aria-hidden="true">ϟ</span><div><span class="stat-label">ฝึกต่อเนื่อง</span><p><strong>${streak}</strong><span> วัน</span></p><small>${streak ? "ค่อย ๆ ฝึก เก่งขึ้นทุกวัน" : "เริ่มก้าวแรกของคุณวันนี้"}</small></div></div>
  </div>`;
}

function todayPage() {
  const reviewCount = reviewQueue().length;
  return `<header class="page-heading today-heading">
    <div><p class="eyebrow">YOUR EVERYDAY ENGLISH · <span id="today-date">${thaiDate.format(new Date())}</span></p><h1>วันนี้ มาเก่งขึ้นอีกนิด<span class="heading-dot">.</span></h1><p class="muted">ให้ภาษาอังกฤษเป็นส่วนหนึ่งของวัน เริ่มจากเรื่องใกล้ตัวคุณ</p></div>
    <a class="btn secondary" href="#start">${state.startScenario ? "ปรับแผนของฉัน" : "เลือกจุดเริ่มต้น"} <span aria-hidden="true">↗</span></a>
  </header>
  <div id="today-summary">${summaryCards()}</div>
  ${conversationRoom(featuredConversation())}
  <div class="today-layout">
    <section id="daily-plan" class="daily-plan" aria-labelledby="plan-heading">${dailyPlan(completedToday())}</section>
    <aside class="today-sidebar"><a class="review-link" href="#review"><span class="eyebrow">A LITTLE REVIEW, A BIG DIFFERENCE</span>${todayReviewCard(reviewCount)}</a><p class="time-note">เวลาฝึกคำนวณจากระยะเวลาโดยประมาณของบทเรียน <a href="#settings">ปรับเป้าหมาย</a></p></aside>
  </div>
  <section class="explore-section" aria-labelledby="explore-heading"><div class="plan-heading"><div><p class="eyebrow">MADE FOR REAL LIFE</p><h2 id="explore-heading">อยากใช้ภาษาอังกฤษที่ไหน?</h2></div><a class="back-link" href="#library">ดูทั้งหมด →</a></div><div class="scenario-grid">${Object.entries(scenarios).map(([id, label], index) => `<a class="scenario-card scenario-${id}" href="#library/all/${id}"><span class="scenario-number">0${index + 1}</span>${illustration(`scene-${id}`, "scenario-art", true)}<strong>${label}</strong><small>${["สื่อสารกับทีมอย่างมั่นใจ", "พร้อมคุยในทุกการเดินทาง", "เรื่องเล็ก ๆ ที่ได้ใช้ทุกวัน"][index]}</small><span class="scenario-bottom">${lessons.filter((lesson) => lesson.scenario === id).length} บทเรียน <span aria-hidden="true">↗</span></span></a>`).join("")}</div></section>`;
}

function todayReviewCard(count) {
  return `${illustration(count ? "review" : "complete", "review-card-art", true)}<span><strong>จำได้ ใช้เป็น</strong><small>${count ? `${count} วลีพร้อมให้คุณทบทวนวันนี้` : "ทบทวนครบแล้ว กลับมาเจอกันรอบหน้า"}</small></span><span class="review-cta">ไปทบทวนวลี <span aria-hidden="true">→</span></span>`;
}

function featuredConversation() {
  const completed = new Set(state.attempts.map(({ lessonId }) => lessonId));
  return lessons.find((lesson) => lesson.scenario === state.startScenario && lesson.conversation && !completed.has(lesson.id))
    ?? lessons.find((lesson) => lesson.conversation && !completed.has(lesson.id)) ?? lessons[0];
}

function dailyPlan(done) {
  const ordered = Object.keys(scenarios).sort((a, b) => Number(b === state.startScenario) - Number(a === state.startScenario))
    .flatMap((id) => lessons.filter((lesson) => lesson.scenario === id)
      .sort((a, b) => Number(Boolean(a.sources)) - Number(Boolean(b.sources))
        || Number(b.skill === state.startSkill) - Number(a.skill === state.startSkill)));
  const completed = new Set(state.attempts.map(({ lessonId }) => lessonId));
  const remaining = ordered.filter((lesson) => !completed.has(lesson.id) || hasDraft(lesson))
    .sort((a, b) => Number(hasDraft(b)) - Number(hasDraft(a)));
  const pending = [];
  const practicedMinutes = lessons.filter((lesson) => done.has(lesson.id)).reduce((total, lesson) => total + lesson.minutes, 0);
  const budget = Math.max(0, state.goal - practicedMinutes);
  let minutes = 0;
  for (const lesson of remaining) {
    if (!budget && !hasDraft(lesson)) break;
    if (pending.length && minutes + lesson.minutes > budget) continue;
    pending.push(lesson);
    minutes += lesson.minutes;
  }
  return `<div class="plan-heading"><h2 id="plan-heading">แผนฝึกวันนี้</h2><span>ทำแล้ว ${done.size} บท</span></div>
    ${pending.length ? `<p class="muted">${hasDraft(pending[0]) ? "กลับไปเขียนร่างที่ค้าง แล้วฝึกต่อ" : "บทฝึกถัดไป"} · ประมาณ ${minutes} นาที</p>
      <ul class="lesson-list">${pending.map((lesson) => lessonCard(lesson, done)).join("")}</ul>`
      : `<div class="plan-complete">${illustration("complete", "state-art")}<p>${remaining.length ? "ถึงเป้าหมายเวลาโดยประมาณของวันนี้แล้ว เลือกฝึกเพิ่มจากคลังได้" : "ส่งครบทุกกิจกรรมแล้ว เลือกฝึกซ้ำจากคลังหรือทบทวนวลีได้"}</p></div>`}
    <a class="back-link" href="#library">ดูบทเรียนทั้งหมด →</a>`;
}

// Illustrations are decorative companions to the visible Thai labels and prompts.
// Explicit dimensions reserve layout space; scenes preserve their full composition.
function illustration(name, className = "", lazy = false) {
  const scene = name.startsWith("scene-");
  return `<img class="illustration ${className}" src="assets/illustrations/${name}.jpg" width="${scene ? 960 : 480}" height="${scene ? 640 : 480}" alt="" decoding="async" ${lazy ? 'loading="lazy"' : ''}>`;
}

function pageHeading(title, subtitle, artwork) {
  const image = ({ pages: "library", loop: "review", steps: "progress", dial: "settings", listening: "library", start: "progress" })[artwork] ?? artwork;
  return `<header class="page-heading page-heading-art">
    <div><h1>${title}</h1><p class="muted">${subtitle}</p></div>
    ${illustration(image, "heading-illustration")}
  </header>`;
}

function conversationRoom(lesson) {
  const { speaker, avatar: image, setting, opening } = lesson.conversation;
  const avatar = `<span class="maya-avatar" aria-hidden="true"><img src="${image}" width="256" height="256" alt="" decoding="async"></span>`;
  return `<section class="conversation-room" aria-labelledby="room-title">
    <div class="room-brief">
      <p class="room-kicker">LET’S TALK <span>บทสนทนาจำลอง · B1</span></p><p class="room-meta">${scenarios[lesson.scenario]} · คุยกับ <span lang="en">${speaker}</span></p>
      <h2 id="room-title">ห้องสนทนา</h2>
      <p>${setting}</p>
      <div class="room-scene">${illustration(`scene-${lesson.scenario}`, "conversation-scene")}</div>
    </div>
    <div class="room-chat"><div class="chat-heading"><span class="chat-dot" aria-hidden="true"></span> ฝึกตอบบทสนทนา <span>${lesson.minutes} นาที</span></div>
      <div class="room-thread">
        <div class="message-row">${avatar}<div class="message-copy"><span lang="en">${speaker}</span><p class="message" lang="en">${opening}</p></div></div>
        <div class="message-row outgoing" id="your-reply" hidden>
          <div class="message-copy"><span>คุณ</span><p class="message" lang="en"></p></div>
          <span class="reply-avatar" aria-hidden="true">↗</span>
        </div>
        <div class="message-row" id="partner-reply" hidden>${avatar}<div class="message-copy"><span lang="en">${speaker}</span><p class="message" lang="en"></p></div></div>
      </div>
      <form id="conversation-form" class="room-composer">
        <fieldset><legend>${lesson.question}</legend>
          ${lesson.choices.map((choice, index) => `<label class="reply-option"><input type="radio" name="reply" value="${index}" required><span lang="en">${choice}</span></label>`).join("")}
        </fieldset>
        <button class="btn primary" type="submit">ส่งข้อความ <span aria-hidden="true">↗</span></button>
      </form>
      <div id="conversation-result" class="room-result" hidden>
        <p id="conversation-feedback" tabindex="-1"></p>
        <p class="muted">${lesson.conversation.speaking}</p>
        <div class="controls">
          <a class="btn primary" id="conversation-next" href="#review">ฝึกต่อ</a>
          <button class="btn secondary" type="button" id="conversation-retry">ลองตอบอีกครั้ง</button>
        </div>
      </div>
    </div>
  </section>`;
}

function bindConversation(lesson, plan = false) {
  const form = main.querySelector("#conversation-form");
  const yourReply = main.querySelector("#your-reply");
  const partnerReply = main.querySelector("#partner-reply");
  const result = main.querySelector("#conversation-result");
  const feedback = main.querySelector("#conversation-feedback");
  const next = main.querySelector("#conversation-next");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.hidden) return;
    const selected = form.elements.namedItem("reply").value;
    if (selected === "") return;
    const choice = Number(selected);
    const reply = lesson.conversation.replies[choice];
    if (!reply) return;
    const [message, explanation] = reply;
    form.hidden = true;
    const attempt = { lessonId: lesson.id, at: new Date().toISOString(), choice, correct: choice === lesson.answer };
    await updateState((data) => data.attempts.push(attempt));
    if (!form.isConnected) return;

    const done = completedToday();
    if (plan) {
      main.querySelector("#daily-plan").innerHTML = dailyPlan(done);
      main.querySelector("#today-summary").innerHTML = summaryCards();
    }
    const completed = new Set(state.attempts.map(({ lessonId }) => lessonId));
    const remaining = lessons.find((entry) => entry.scenario === lesson.scenario && !completed.has(entry.id))
      ?? lessons.find((entry) => !completed.has(entry.id));
    next.setAttribute("href", remaining ? `#lesson/${remaining.id}` : "#review");
    next.textContent = remaining ? "ไปบทฝึกถัดไป" : "ไปทบทวนวลี";
    yourReply.querySelector(".message").textContent = lesson.choices[choice];
    partnerReply.querySelector(".message").textContent = message;
    feedback.textContent = explanation;
    yourReply.hidden = partnerReply.hidden = result.hidden = false;
    feedback.focus();
  });

  main.querySelector("#conversation-retry").addEventListener("click", () => {
    form.reset();
    yourReply.hidden = partnerReply.hidden = result.hidden = true;
    form.hidden = false;
    form.querySelector("input").focus();
  });
}

function libraryPage(filter, topic) {
  const selected = Object.hasOwn(skills, filter) ? filter : "";
  const scenario = Object.hasOwn(scenarios, topic) ? topic : "";
  const options = [["", "ทั้งหมด"], ...Object.entries(skills).map(([id, skill]) => [id, skill.name])];
  const done = completedToday();
  const submitted = new Set(state.attempts.map((attempt) => attempt.lessonId));
  return `${pageHeading("คลังบทเรียน", `ระดับฝึก B1 · ${lessons.length} บทและภารกิจ · ${Object.keys(scenarios).length} สถานการณ์`, "pages")}
    <div class="library-toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><input id="lesson-search" type="search" placeholder="ค้นหาชื่อบทเรียนหรือสิ่งที่อยากฝึก…" aria-label="ค้นหาบทเรียน" maxlength="150"><kbd aria-hidden="true">/</kbd></label><label class="status-filter">แสดง <select id="lesson-status"><option value="all">ทุกบทเรียน</option><option value="new">ยังไม่เคยฝึก</option><option value="done">ฝึกแล้ว</option></select></label></div>
    <p id="library-count" class="result-count" role="status"></p>
    <div id="library-empty" class="empty-state" hidden>${illustration("empty", "state-art", true)}<h2>ยังไม่พบบทเรียนที่ตรงกัน</h2><p>ลองค้นหาคำอื่น หรือเปลี่ยนตัวกรองเพื่อดูบทเรียนเพิ่มเติม</p><button id="clear-search" class="btn secondary">ล้างการค้นหาและตัวกรอง</button></div>
    <div class="library-layout">
      <nav class="filter-bar" aria-label="กรองตามทักษะ">${options.map(([id, label]) =>
        `<a href="#library/${id || "all"}${scenario ? "/" + scenario : ""}" ${id === selected ? 'aria-current="true"' : ""}>${label}</a>`).join("")}</nav>
      <div>
        <nav class="filter-bar scenario-filters" aria-label="กรองตามสถานการณ์">${[["", "ทุกสถานการณ์"], ...Object.entries(scenarios)].map(([id, label]) =>
          `<a href="#library/${selected || "all"}${id ? "/" + id : ""}" ${id === scenario ? 'aria-current="true"' : ""}>${label}</a>`).join("")}</nav>
        ${Object.entries(scenarios).filter(([id]) => !scenario || id === scenario).map(([id, label]) => {
          const unit = lessons.filter((lesson) => lesson.scenario === id);
          return `<section class="library-topic"><div class="library-topic-heading">${illustration(`scene-${id}`, "topic-art", true)}<div><p class="eyebrow">ENGLISH FOR REAL LIFE</p><h2>${label}</h2><p class="muted">ส่งแล้ว ${unit.filter((lesson) => submitted.has(lesson.id)).length}/${unit.length} บท</p></div></div>
            <ul class="lesson-list library-list">${unit.filter((lesson) => !selected || lesson.skill === selected)
              .map((lesson) => lessonCard(lesson, done, true)).join("")}</ul></section>`;
        }).join("")}
      </div>
    </div>`;
}

const libraryFilters = { query: "", status: "all" };
let focusLibrarySearch = false;
function bindLibrary() {
  const search = main.querySelector("#lesson-search");
  const status = main.querySelector("#lesson-status");
  search.value = libraryFilters.query;
  status.value = libraryFilters.status;
  const completed = new Set(state.attempts.map((attempt) => attempt.lessonId));
  function filter() {
    libraryFilters.query = search.value;
    libraryFilters.status = status.value;
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const row of main.querySelectorAll("[data-lesson-id]")) {
      const lesson = lessons.find((entry) => entry.id === row.dataset.lessonId);
      const matches = `${lesson.title} ${lesson.goal} ${scenarios[lesson.scenario]} ${skills[lesson.skill].name}`.toLocaleLowerCase().includes(query);
      row.hidden = !matches || (status.value === "new" && completed.has(lesson.id)) || (status.value === "done" && !completed.has(lesson.id));
      if (!row.hidden) count++;
    }
    for (const section of main.querySelectorAll(".library-topic")) section.hidden = !section.querySelector("[data-lesson-id]:not([hidden])");
    main.querySelector("#library-empty").hidden = count !== 0;
    main.querySelector("#library-count").textContent = `พบ ${count} บทเรียน`;
  }
  search.addEventListener("input", filter);
  status.addEventListener("change", filter);
  main.querySelector("#clear-search").addEventListener("click", () => {
    libraryFilters.query = "";
    libraryFilters.status = "all";
    focusLibrarySearch = true;
    if (location.hash === "#library") render();
    else location.hash = "#library";
  });
  filter();
}

function comprehensionQuestions(lesson) {
  return [lesson, ...(lesson.followUps ?? [])];
}

function lessonPage(lesson) {
  const context = lesson.skill === "listening"
    ? `<div class="context">
        ${lesson.before ? `<p class="listening-strategy">${lesson.before} รอบแรกฟังเพื่อจับภาพรวม รอบถัดไปฟังเพื่อตรวจรายละเอียด</p>` : ""}
        <div class="listen-control">
          <button class="btn secondary" id="listen" type="button"><span aria-hidden="true">▶</span> เล่นเสียงตัวอย่าง</button>
          <button class="btn secondary" id="stop-listening" type="button" disabled>หยุดเสียง</button>
          <span class="sound-wave" aria-hidden="true"></span>
        </div>
        <label class="listening-speed">ความเร็ว <select id="listening-rate"><option value="1">ปกติ</option><option value="0.8">ช้าลง</option></select></label>
        <p id="audio-status" class="muted" role="status"></p>
        <details id="transcript"><summary>เปิดบทถอดเสียง</summary>${lesson.turns
          ? lesson.turns.map(([speaker, line]) => `<p lang="en"><strong>${speaker}</strong> · ${line}</p>`).join("")
          : `<p lang="en">${lesson.context}</p>`}</details>
      </div>`
    : `<blockquote class="context context-quote" lang="en">${lesson.context}</blockquote>
      ${(lesson.sources ?? []).map(({label, text}) => `<div class="lesson-source"><h3>${label}</h3>
        <blockquote class="context-quote" lang="en">${text}</blockquote></div>`).join("")}`;
  const form = lesson.choices
    ? `${comprehensionQuestions(lesson).map((item, number) => `<fieldset><legend>${number + 1}. ${item.question}</legend>${item.choices.map((choice, index) =>
      `<label class="option"><input type="radio" name="answer-${number}" value="${index}" required><span lang="en">${choice}</span></label>`).join("")}</fieldset>`).join("")}
      <button class="btn primary" type="submit">ตรวจคำตอบ</button>`
    : `<label for="draft"><strong>${lesson.question}</strong></label>
      <textarea id="draft" name="draft" lang="en" required maxlength="1500" aria-describedby="draft-status"></textarea>
      <p id="draft-status" class="muted" role="status"></p>
      <div class="controls"><button class="btn primary" type="submit">บันทึกฉบับและดูตัวอย่าง</button></div>`;
  return `<div class="practice">
    <a class="back-link" href="#library">← คลังบทเรียน</a>
    <header class="practice-header page-heading-art">
      <div><span class="eyebrow">B1 · ${lesson.type} · ${lesson.minutes} นาที</span>
      <h1 class="display" lang="en">${lesson.title}</h1><p class="muted">${lesson.goal}</p></div>
      ${illustration(`scene-${lesson.scenario}`, "heading-illustration lesson-heading-art")}
    </header>
    <div class="practice-layout">
      <section class="context-panel"><h2>สถานการณ์</h2>${context}</section>
      <section class="exercise-panel" aria-labelledby="exercise-heading"><h2 id="exercise-heading">คำตอบของคุณ</h2><form id="exercise" class="flow">${form}</form>
      <div class="feedback" id="feedback" tabindex="-1" hidden></div>
      <div id="after-exercise" class="controls" hidden>
        <a class="btn secondary" href="#today">กลับไปหน้าวันนี้</a>
        <a class="btn secondary" href="#progress">ดูประวัติ</a>
        ${lesson.choices ? '<button class="btn secondary" id="retry-exercise" type="button">ลองทำอีกครั้ง</button>' : ""}
      </div>
      </section>
    </div></div>`;
}

function bindListening(lesson, transcript) {
  const listen = main.querySelector("#listen");
  const stop = main.querySelector("#stop-listening");
  const speed = main.querySelector("#listening-rate");
  const status = main.querySelector("#audio-status");
  const synthesis = window.speechSynthesis;
  const evidence = { audioPlays: 0, usedSlowAudio: false, usedTranscript: false };
  let run = 0;
  let waiting;

  function finish(message) {
    clearTimeout(waiting);
    waiting = undefined;
    run++;
    stop.disabled = true;
    status.textContent = message;
  }

  function play(voices) {
    clearTimeout(waiting);
    waiting = undefined;
    const current = ++run;
    synthesis.cancel();
    const turns = lesson.turns ?? [["", lesson.context]];
    const speakers = [...new Set(turns.map(([speaker]) => speaker))];
    const rate = Number(speed.value);
    stop.disabled = false;
    status.textContent = "กำลังเตรียมเสียง";

    function speak(index) {
      const [speaker, line] = turns[index];
      const utterance = new SpeechSynthesisUtterance(line);
      const voice = voices[speakers.indexOf(speaker) % voices.length];
      utterance.lang = voice.lang;
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.onstart = () => {
        if (current !== run) return;
        if (index === 0) {
          evidence.audioPlays++;
          evidence.usedSlowAudio ||= rate < 1;
        }
        status.textContent = "กำลังเล่นเสียง";
      };
      utterance.onend = () => {
        if (current !== run) return;
        if (index + 1 < turns.length) speak(index + 1);
        else finish("เล่นจบแล้ว");
      };
      utterance.onerror = () => {
        if (current === run) finish("เล่นเสียงไม่ได้ในขณะนี้ เปิดบทถอดเสียงเพื่อฝึกต่อได้");
      };
      synthesis.speak(utterance);
    }
    speak(0);
  }

  function localVoices() {
    return synthesis.getVoices().filter((voice) => voice.localService && /^en(?:[-_]|$)/i.test(voice.lang));
  }

  function voicesChanged() {
    if (waiting === undefined) return;
    const voices = localVoices();
    if (voices.length) play(voices);
  }

  transcript.addEventListener("toggle", () => { evidence.usedTranscript ||= transcript.open; });
  transcript.querySelector("summary").addEventListener("click", () => { evidence.usedTranscript ||= !transcript.open; });
  synthesis?.addEventListener("voiceschanged", voicesChanged);
  listen.addEventListener("click", () => {
    if (!synthesis) {
      finish("อุปกรณ์นี้เล่นเสียงไม่ได้ เปิดบทถอดเสียงเพื่อฝึกต่อได้");
      return;
    }
    const voices = localVoices();
    if (voices.length) { play(voices); return; }
    finish("กำลังค้นหาเสียงภาษาอังกฤษบนอุปกรณ์");
    stop.disabled = false;
    waiting = setTimeout(() => finish("ยังไม่พบเสียงภาษาอังกฤษบนอุปกรณ์ เปิดบทถอดเสียงเพื่อฝึกต่อได้"), 1500);
  });
  stop.addEventListener("click", () => { finish("หยุดเสียงแล้ว"); synthesis.cancel(); listen.focus(); });
  closeListening = () => {
    finish("");
    synthesis?.removeEventListener("voiceschanged", voicesChanged);
    synthesis?.cancel();
  };
  return evidence;
}

let closeListening = () => {};

function bindLesson(lesson) {
  const form = main.querySelector("#exercise");
  const feedback = main.querySelector("#feedback");
  const draft = form.elements.namedItem("draft");
  const transcript = main.querySelector("#transcript");
  const listening = transcript && bindListening(lesson, transcript);
  const submit = form.querySelector('button[type="submit"]');
  const after = main.querySelector("#after-exercise");
  const draftStatus = main.querySelector("#draft-status");
  let submittedDraft = draft && latestWriting(lesson);
  const paired = lessons.find((item) => item !== lesson && (
    (lesson.pair && item.pair === lesson.pair) ||
    (lesson.transfer !== undefined && item.transfer !== undefined && item.scenario === lesson.scenario && item.skill === lesson.skill)
  ));
  if (paired) {
    const comparisonLink = after.querySelector("a");
    comparisonLink.href = `#lesson/${paired.id}`;
    comparisonLink.textContent = "เปิดโจทย์อีกฉบับ";
  }
  main.querySelector("#retry-exercise")?.addEventListener("click", () => {
    render();
    main.querySelector(transcript ? "#listen" : "#exercise input").focus();
  });

  function showWriting(attempt, newlySubmitted = false) {
    submittedDraft = attempt;
    feedback.innerHTML = `<strong>${newlySubmitted ? "บันทึกฉบับแล้ว" : "ฉบับที่ส่งล่าสุด"}</strong>
      ${newlySubmitted ? "" : '<p class="writing-response" lang="en"></p>'}
      <p>ใช้รายการนี้ตรวจงานของคุณ แล้วลองแก้และส่งอีกครั้ง</p>
      <ul>${lesson.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
      <p><strong>ตัวอย่างคำตอบ</strong></p><p lang="en">${lesson.model}</p>
      <fieldset class="writing-check"><legend>ประเมินฉบับนี้ด้วยตนเอง</legend>
        ${writingCriteria.map(([label, detail], index) => `<label class="option">
          <input type="checkbox" name="writing-criterion" value="${index}" ${attempt.selfCheck?.includes(index) ? "checked" : ""}>
          <span><strong>${label}</strong> · ${detail}</span></label>`).join("")}</fieldset>
      <p id="writing-next" role="status"></p>`;
    if (!newlySubmitted) feedback.querySelector(".writing-response").textContent = attempt.text;
    if (attempt.selfCheck) showWritingNext(attempt.selfCheck);
    feedback.hidden = after.hidden = false;
  }

  function showWritingNext(checks) {
    const next = writingCriteria.findIndex((_, index) => !checks.includes(index));
    feedback.querySelector("#writing-next").textContent = next < 0
      ? "ลองทวนจุดตรวจเฉพาะโจทย์อีกครั้ง แล้วส่งฉบับแก้หากมีส่วนที่อยากปรับ"
      : `ลองแก้เรื่อง${writingCriteria[next][0]}ก่อน · ${writingCriteria[next][2]}`;
  }

  feedback.addEventListener("change", (event) => {
    if (!submittedDraft || event.target.name !== "writing-criterion") return;
    const { at, text } = submittedDraft;
    const checks = [...feedback.querySelectorAll("input:checked")].map((input) => Number(input.value));
    showWritingNext(checks);
    void updateState((data) => {
      const attempt = data.attempts.findLast((entry) => entry.lessonId === lesson.id && entry.at === at && entry.text === text);
      if (!attempt) return false;
      attempt.selfCheck = checks;
    });
  });

  if (draft) {
    draft.value = state.drafts[lesson.id] ?? submittedDraft?.text ?? "";
    if (hasDraft(lesson)) draftStatus.textContent = "เปิดร่างที่บันทึกไว้แล้ว";
    if (submittedDraft) showWriting(submittedDraft);
    draft.addEventListener("input", async () => {
      draft.setCustomValidity("");
      const value = draft.value;
      const { saved } = await updateState((data) => {
        if (value.trim() && value.trim() !== latestWriting(lesson, data)?.text) data.drafts[lesson.id] = value;
        else delete data.drafts[lesson.id];
      });
      if (draft.value !== value) return;
      const message = saved ? (hasDraft(lesson) ? "บันทึกร่างอัตโนมัติแล้ว" : "") : "ร่างอยู่ในหน้านี้ชั่วคราว";
      if (draftStatus.textContent !== message) draftStatus.textContent = message;
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const attempt = { lessonId: lesson.id, at: new Date().toISOString() };
    if (draft) {
      const value = draft.value;
      const text = value.trim();
      if (!text) {
        draft.setCustomValidity("ใส่ข้อความก่อนบันทึก");
        draft.reportValidity();
        return;
      }
      attempt.text = text;
      submit.disabled = true;
      const { changed, saved } = await updateState((data) => {
        if (text === latestWriting(lesson, data)?.text) return false;
        data.attempts.push(attempt);
        if (data.drafts[lesson.id] === value) delete data.drafts[lesson.id];
      });
      if (!form.isConnected) return;
      submit.disabled = false;
      if (!changed) {
        showWriting(latestWriting(lesson));
        draftStatus.textContent = "ส่งฉบับนี้แล้ว แก้ข้อความเพื่อบันทึกฉบับใหม่";
        draft.focus();
        return;
      }
      showWriting(attempt, true);
      draftStatus.textContent = saved ? "" : "ฉบับที่ส่งอยู่ในหน้านี้ชั่วคราว";
    } else {
      const questions = comprehensionQuestions(lesson);
      const selected = questions.map((_, index) => form.elements.namedItem(`answer-${index}`).value);
      if (selected.includes("")) return;
      attempt.answers = selected.map(Number);
      attempt.total = questions.length;
      attempt.score = questions.filter((item, index) => attempt.answers[index] === item.answer).length;
      attempt.correct = attempt.score === attempt.total;
      if (listening) {
        Object.assign(attempt, listening, { usedTranscript: listening.usedTranscript || transcript.open });
        closeListening();
        main.querySelector("#listen").disabled = true;
        main.querySelector("#listening-rate").disabled = true;
      }
      for (const fieldset of form.querySelectorAll("fieldset")) fieldset.disabled = true;
      submit.disabled = true;
      await updateState((data) => data.attempts.push(attempt));
      if (!form.isConnected) return;
      feedback.innerHTML = `<strong>ตอบถูก ${attempt.score}/${attempt.total} ข้อ</strong><ol>${questions.map((item, index) =>
        `<li><strong>${attempt.answers[index] === item.answer ? "ตอบถูก" : "คำตอบที่ถูก"} · <span lang="en">${item.choices[item.answer]}</span></strong><p>${item.reason}</p></li>`).join("")}</ol>`;
    }
    feedback.hidden = after.hidden = false;
    feedback.focus();
  });
}

function reviewPage(queue = reviewQueue()) {
  const card = queue[0];
  const heading = pageHeading("ทบทวนวลี", "ลองนึกเป็นภาษาอังกฤษก่อนเปิดเฉลย", card ? "loop" : "complete");
  const nextDate = !card && cards.map((item) => {
    const event = latestReview(item);
    return nextReviewDate(event.at, event.step ?? 0);
  }).sort((a, b) => a - b)[0];
  const meter = `<div class="review-meter"><span><strong>${queue.length}</strong> วลีพร้อมทบทวน</span>
    ${nextDate ? `<span>รอบถัดไป ${thaiDate.format(nextDate)}</span>` : ""}</div>`;
  if (!card) return `${heading}<div class="review-layout">${meter}<section class="review-prompt" id="review-content" tabindex="-1">
    <h2>ทบทวนวลีครบแล้ววันนี้</h2><p class="muted">ให้ความจำได้พัก แล้วกลับมาฝึกอีกครั้งตามรอบถัดไป</p><a class="back-link" href="#today">← กลับไปหน้าวันนี้</a></section></div>`;
  return `${heading}<div class="review-layout">${meter}
    <section class="review-prompt" aria-labelledby="review-content">
      <p class="eyebrow">${scenarios[card.scenario]}</p>
      <h2 id="review-content" tabindex="-1">${card.clue}</h2>
      <div><button class="btn primary" id="reveal">เปิดเฉลย</button></div>
      <div id="review-answer" class="flow" hidden>
        <div class="feedback" id="phrase" tabindex="-1"><strong lang="en">${card.phrase}</strong><p lang="en">${card.example}</p></div>
        <div class="controls"><button class="btn secondary" data-rating="recalled">นึกออกเอง</button>
          <button class="btn secondary" data-rating="with-help">นึกออกเมื่อเห็นเฉลย</button>
          <button class="btn secondary" data-rating="again">อยากฝึกซ้ำ</button></div>
      </div></section></div>`;
}

function bindReview(card) {
  if (!card) return;
  main.querySelector("#reveal").addEventListener("click", (event) => {
    event.currentTarget.disabled = true;
    main.querySelector("#review-answer").hidden = false;
    main.querySelector("#phrase").focus();
  });
  const buttons = [...main.querySelectorAll("[data-rating]")];
  for (const button of buttons) {
    button.addEventListener("click", async () => {
      const rating = button.dataset.rating;
      buttons.forEach((control) => { control.disabled = true; });
      const now = new Date();
      await updateState((data) => {
        const previous = latestReview(card, data);
        if (!reviewDue(previous, now)) return false;
        const previousStep = previous?.step ?? 0;
        let step = 0;
        if (rating === "recalled" && previous) step = Math.min(previousStep + 1, reviewIntervals.length - 1);
        if (rating === "with-help") step = previousStep;
        data.reviews.push({ cardId: card.id, rating, step, at: now.toISOString() });
      });
      if (!button.isConnected) return;
      render();
      main.querySelector("#review-content").focus();
    }, { once: true });
  }
}

function progressPage() {
  const skillsByLesson = new Map(lessons.map(({ id, skill }) => [id, skill]));
  const totals = Object.fromEntries(Object.keys(skills).map((id) => [id, 0]));
  for (const attempt of state.attempts) {
    const skill = skillsByLesson.get(attempt.lessonId);
    if (skill) totals[skill] += 1;
  }
  const max = Math.max(1, ...Object.values(totals));
  const rows = Object.entries(skills).map(([id, skill]) => `<li class="skill-total">
    <span>${skill.name}</span><span class="skill-track" aria-hidden="true"><i style="--share:${totals[id] / max * 100}%"></i></span>
    <strong>${totals[id]} ครั้ง</strong></li>`).join("");
  const submitted = new Set(state.attempts.map((attempt) => attempt.lessonId));
  const tasks = lessons.filter((lesson) => lesson.sources);
  const listeningComparisons = Object.entries(scenarios).map(([id, label]) => {
    const pair = lessons.filter((lesson) => lesson.pair === id);
    return `<section><h3>${label}</h3><ul class="lesson-list">${pair.map((lesson, index) => {
      const attempt = state.attempts.find((entry) => entry.lessonId === lesson.id && entry.total);
      const summary = attempt
        ? [`${attempt.score}/${attempt.total} ข้อ`, thaiDate.format(new Date(attempt.at)), listeningEvidence(attempt)].filter(Boolean).join(" · ")
        : "ยังไม่มีผล";
      return `<li><a class="lesson" href="#lesson/${lesson.id}">ฉบับ ${index === 0 ? "A" : "B"} <small class="muted">${summary}</small></a></li>`;
    }).join("")}</ul></section>`;
  }).join("");
  const speakingComparisons = speakingTasks.map((lesson) => {
    const summaries = [0, 1].map((form) => {
      const attempt = state.attempts.findLast((entry) => entry.lessonId === lesson.id && entry.speakingForm === form);
      const label = form === 0 ? "A" : "B";
      return attempt ? `ฉบับ ${label} ${attempt.speakingChecks.length}/${lesson.criteria.length}` : `ฉบับ ${label} ยังไม่ได้ส่ง`;
    });
    return `<li><a class="lesson" href="#lesson/${lesson.id}"><span class="lesson-name">${scenarios[lesson.scenario]}
      <small>${summaries.join(" · ")}</small></span></a></li>`;
  }).join("");
  const transferComparisons = Object.entries(scenarios).map(([id, label]) => {
    const pairs = ["reading", "writing"].map((skill) => {
      const variants = lessons.filter((lesson) => lesson.scenario === id && lesson.skill === skill && lesson.transfer !== undefined);
      return `<li><strong>${skills[skill].name}</strong><ul class="lesson-list">${variants.map((lesson, index) => {
        const attempt = skill === "reading"
          ? state.attempts.find((entry) => entry.lessonId === lesson.id && entry.total)
          : state.attempts.findLast((entry) => entry.lessonId === lesson.id && entry.text);
        let summary = "ยังไม่ได้ส่ง";
        if (attempt?.total) summary = `${attempt.score}/${attempt.total} ข้อ · ครั้งแรก`;
        if (attempt?.text) summary = attempt.selfCheck
          ? `ประเมินตนเอง ${attempt.selfCheck.length}/${writingCriteria.length} ด้าน · ฉบับล่าสุด`
          : "ส่งงานแล้ว · รอประเมินตนเอง";
        return `<li><a class="lesson" href="#lesson/${lesson.id}">ฉบับ ${index ? "B" : "A"} <small class="muted">${summary}</small></a></li>`;
      }).join("")}</ul></li>`;
    });
    return `<section><h3>${label}</h3><ul class="transfer-summary">${pairs.join("")}</ul></section>`;
  }).join("");
  return `${pageHeading("ความก้าวหน้า", "ประวัติจากการฝึกบนอุปกรณ์นี้", "steps")}
    ${summaryCards()}
    ${weekActivity()}
    <div class="progress-layout">
      <div><section><h2>จำนวนครั้งที่ฝึก</h2><ul class="skill-totals">${rows}</ul></section>
        <section class="flow"><h2>ภารกิจท้ายชุด</h2><ul class="lesson-list">${tasks.map((lesson) => `<li>
          <a class="lesson" href="#lesson/${lesson.id}"><span class="lesson-name">${scenarios[lesson.scenario]}</span>
          <span class="muted">${submitted.has(lesson.id) ? "ส่งแล้ว" : "รอส่ง"}</span></a></li>`).join("")}</ul></section></div>
      <div class="history-section">
        <section><h2>เทียบผลจากโจทย์ฟังคนละฉบับ</h2><p class="muted">ใช้ผลครั้งแรกของแต่ละฉบับ ดูคะแนนควบคู่กับการใช้ตัวช่วย</p>
          <div class="flow">${listeningComparisons}</div></section>
        <section class="flow"><h2>ผลประเมินตนเองของบทพูด</h2><p class="muted">ใช้ผลล่าสุดของแต่ละฉบับ</p><ul class="lesson-list">${speakingComparisons}</ul></section>
        <section class="flow"><h2>เทียบโจทย์อ่านและเขียน</h2>${transferComparisons}</section>
        <section class="flow"><h2>ประวัติการฝึก</h2><div id="archive"></div></section>
      </div>
    </div>`;
}

function weekActivity() {
  const { dates } = practiceSummary();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const practiced = dates.has(localDay.format(date));
    return `<li class="${practiced ? "active" : ""} ${index === 6 ? "is-today" : ""}"><span>${index === 6 ? "วันนี้" : new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(date)}</span><span class="day-check" aria-label="${thaiDate.format(date)} ${practiced ? "ฝึกแล้ว" : "ยังไม่มีการฝึก"}">${practiced ? "✓" : "·"}</span><small>${date.getDate()}</small></li>`;
  });
  return `<section class="week-activity"><div><p class="eyebrow">ONE DAY AT A TIME</p><h2>ทุกวันที่ฝึก มีความหมาย</h2><p class="muted">กิจกรรมใน 7 วันที่ผ่านมา</p></div><ol>${days.join("")}</ol></section>`;
}

function listeningEvidence(attempt) {
  const parts = [];
  if (attempt.audioPlays !== undefined) parts.push(attempt.audioPlays ? `เปิดเสียง ${attempt.audioPlays} ครั้ง` : "ไม่มีการเล่นเสียงที่บันทึกได้");
  if (attempt.usedSlowAudio) parts.push("ใช้เสียงช้า");
  if (attempt.usedTranscript) parts.push("เปิดบทถอดเสียง");
  return parts.join(" · ");
}

function bindProgress() {
  const archive = main.querySelector("#archive");
  const history = [...state.attempts, ...state.reviews].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  if (!history.length) {
    archive.innerHTML = `<div class="history-empty">${illustration("progress", "state-art", true)}<h3>ทุกความก้าวหน้า เริ่มจากบทแรก</h3><p class="muted">ผลการฝึกจะแสดงที่นี่เมื่อส่งคำตอบหรือทบทวนวลี</p><a class="back-link" href="#start">เลือกจุดเริ่มต้น →</a></div>`;
    return;
  }
  const list = document.createElement("ul");
  list.className = "archive";
  function appendEntry(item) {
    const lesson = lessons.find((entry) => entry.id === item.lessonId);
    const card = cards.find((entry) => entry.id === item.cardId);
    if (!lesson && !card) return;
    const row = document.createElement("li");
    const title = document.createElement(lesson ? "a" : "strong");
    title.lang = "en";
    title.textContent = lesson?.title ?? card.phrase;
    if (lesson) title.href = `#lesson/${lesson.id}`;
    const detail = document.createElement("small");
    let result = card ? ({ recalled: "นึกออกเอง", "with-help": "นึกออกเมื่อเห็นเฉลย", again: "อยากฝึกซ้ำ" })[item.rating]
      : item.text ? "ฉบับงานเขียน" : item.total ? `ตอบถูก ${item.score}/${item.total} ข้อ` : item.correct ? "ตอบถูก" : "ตอบผิด";
    if (item.speakingChecks) result = `พูดฉบับ ${item.speakingForm === 0 ? "A" : "B"} · ประเมินตนเอง ${item.speakingChecks.length}/${lesson.criteria.length} ข้อ`;
    detail.textContent = [historyDate.format(new Date(item.at)), result, listeningEvidence(item)].filter(Boolean).join(" · ");
    row.append(title, detail);
    if (item.text) {
      const response = document.createElement("p");
      response.lang = "en";
      response.textContent = item.text;
      row.append(response);
      if (item.selfCheck) {
        const assessment = document.createElement("small");
        const checked = item.selfCheck.map((index) => writingCriteria[index]?.[0]).filter(Boolean);
        assessment.textContent = checked.length ? `ประเมินตนเอง · ${checked.join(" · ")}` : "ประเมินตนเอง · รอตรวจทุกด้าน";
        row.append(assessment);
      }
    }
    list.append(row);
  }
  archive.append(list);
  const more = document.createElement("button");
  more.className = "btn secondary";
  more.type = "button";
  more.textContent = "ดูประวัติเพิ่ม";
  archive.append(more);
  const pageSize = 15;
  let shown = 0;
  function showMore(focus = false) {
    const firstIndex = list.children.length;
    history.slice(shown, shown + pageSize).forEach(appendEntry);
    shown += pageSize;
    more.hidden = shown >= history.length;
    const next = list.children[firstIndex];
    if (focus && next) { next.tabIndex = -1; next.focus(); }
  }
  more.addEventListener("click", () => showMore(true));
  showMore();
}

function settingsPage() {
  return `${pageHeading("ตั้งค่า", "ปรับเวลาฝึกให้เข้ากับตารางของคุณ", "dial")}
    <div class="settings-layout">
    <p class="saved-goal"><strong id="saved-goal">${state.goal}</strong> นาทีต่อวัน</p>
    <form class="flow" id="settings">
      <fieldset><legend>เวลาที่ตั้งใจฝึกต่อวัน</legend>
        <div class="goal-options">${[5, 10, 15, 20, 30].map((value) =>
          `<label><input type="radio" name="goal" value="${value}" required ${state.goal === value ? "checked" : ""}><span>${value} นาที</span></label>`).join("")}</div>
      </fieldset>
      <div><button class="btn primary" type="submit">บันทึกเป้าหมาย</button></div>
      <p id="settings-status" role="status"></p>
      <a class="back-link" href="#start">ปรับสถานการณ์และทักษะที่อยากฝึก</a>
    </form></div>
    <section class="data-settings"><div><p class="eyebrow">YOUR LEARNING, YOUR DATA</p><h2>เก็บความก้าวหน้าไว้กับคุณ</h2><p class="muted">ข้อมูลอยู่ในเบราว์เซอร์นี้ สำรองเป็นไฟล์ไว้เพื่อย้ายอุปกรณ์หรือเก็บก่อนล้างข้อมูลเบราว์เซอร์</p></div><div class="flow"><div class="controls"><button class="btn secondary" id="export-data">ดาวน์โหลดข้อมูลสำรอง ↓</button><button class="btn secondary" id="choose-import">นำเข้าข้อมูล</button><input id="import-data" type="file" accept=".json,application/json" hidden></div><p id="data-status" role="status"></p></div></section>
    <dialog id="import-dialog" aria-labelledby="import-title"><h2 id="import-title">นำเข้าข้อมูลการฝึก</h2><p id="import-summary"></p><p class="muted">ไฟล์จะแทนที่ประวัติ ร่างงานเขียน และการตั้งค่า ดาวน์โหลดข้อมูลปัจจุบันเก็บไว้ก่อนได้</p><div class="controls"><button id="confirm-import" class="btn primary">ยืนยันการนำเข้า</button><button id="cancel-import" class="btn secondary" autofocus>ยกเลิก</button></div></dialog>`;
}

function bindDataSettings() {
  const status = main.querySelector("#data-status");
  const input = main.querySelector("#import-data");
  const dialog = main.querySelector("#import-dialog");
  const confirm = main.querySelector("#confirm-import");
  let pending;
  let fileSelection = 0;
  main.querySelector("#export-data").addEventListener("click", () => {
    readCurrentState();
    const blob = new Blob([JSON.stringify({ app: "EnglishMe", version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `englishme-backup-${localDay.format(new Date())}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "เตรียมไฟล์สำรองแล้ว ตรวจสอบไฟล์ในรายการดาวน์โหลดของเบราว์เซอร์";
  });
  main.querySelector("#choose-import").addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    const selection = ++fileSelection;
    input.value = "";
    status.textContent = "";
    try {
      const originalRaw = localStorage.getItem(storageKey);
      if (file.size > 10 * 1024 * 1024) throw new Error("File too large");
      const backup = JSON.parse(await file.text());
      if (backup.app !== "EnglishMe" || backup.version !== 1 || !validateState(backup.data)) throw new Error("Invalid backup");
      if (!dialog.isConnected || selection !== fileSelection || dialog.open) return;
      const data = normalizeState(backup.data);
      pending = { data, originalRaw };
      dialog.querySelector("#import-summary").textContent = `พบประวัติฝึก ${data.attempts.length} ครั้ง ทบทวน ${data.reviews.length} ครั้ง และร่างงานเขียน ${Object.keys(data.drafts).length} บท · เป้าหมาย ${data.goal} นาทีต่อวัน`;
      dialog.showModal();
    } catch {
      if (selection === fileSelection) status.textContent = "นำเข้าไม่ได้ กรุณาเลือกไฟล์สำรอง EnglishMe ที่ถูกต้อง ขนาดไม่เกิน 10 MB ข้อมูลเดิมยังอยู่";
    }
  });
  main.querySelector("#cancel-import").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { if (!dialog.open) pending = undefined; });
  confirm.addEventListener("click", async () => {
    if (!pending || confirm.disabled) return;
    const { data, originalRaw } = pending;
    confirm.disabled = true;
    const result = await withStorageLock(() => {
      if (!dialog.open || !dialog.isConnected) return "cancelled";
      try {
        if (localStorage.getItem(storageKey) !== originalRaw) return "changed";
      } catch {
        return "failed";
      }
      if (!persistState(data)) return "failed";
      Object.assign(state, data);
      return "saved";
    });
    if (!dialog.isConnected || result === "cancelled") { confirm.disabled = false; return; }
    dialog.close();
    confirm.disabled = false;
    if (result !== "saved") {
      status.textContent = result === "changed" ? "ข้อมูลเปลี่ยนระหว่างเปิดไฟล์ กรุณาตรวจข้อมูลล่าสุดแล้วเริ่มนำเข้าอีกครั้ง" : "บันทึกข้อมูลนำเข้าไม่ได้ ข้อมูลเดิมยังอยู่";
      return;
    }
    render();
    main.querySelector("#data-status").textContent = "นำเข้าข้อมูลสำเร็จแล้ว";
    main.querySelector("#choose-import").focus();
  });
}

function startPage() {
  return `${pageHeading("เลือกจุดเริ่มต้น", "เลือกสถานการณ์และสิ่งที่อยากฝึกจากงานที่ทำได้ในชีวิตจริง", "start")}
    <form id="start-practice" class="flow start-practice">
      <label>อยากใช้ภาษาอังกฤษในสถานการณ์ไหน
        <select name="scenario" required>${Object.entries(scenarios).map(([id, title]) =>
          `<option value="${id}" ${state.startScenario === id ? "selected" : ""}>${title}</option>`).join("")}</select>
      </label>
      <fieldset><legend>ตอนนี้อยากฝึกเรื่องไหนก่อน</legend>
        ${[["listening", "ฟังประกาศและจับรายละเอียดที่ต้องนำไปใช้"], ["speaking", "อธิบายแผนหรือตอบกลับด้วยคำของตัวเอง"],
          ["reading", "อ่านประกาศหรือข้อความแล้วตัดสินใจว่าจะทำอะไร"], ["writing", "เขียนข้อความให้ผู้รับรู้ว่าจะทำอะไรต่อ"]].map(([id, label]) =>
            `<label class="option"><input type="radio" name="skill" value="${id}" required ${state.startSkill === id ? "checked" : ""}><span>${label}</span></label>`).join("")}
      </fieldset>
      <p class="muted">ใช้สำหรับจัดลำดับแบบฝึกในชุด B1 · ผลการเลือกใช้แนะนำบทเริ่มต้น</p>
      <div><button class="btn primary" type="submit">บันทึกและเริ่มฝึก</button></div>
    </form>`;
}

let renderedDay;

function render(focus = false) {
  readCurrentState();
  renderedDay = localDay.format(new Date());
  closeListening();
  closeListening = () => {};
  closeSpeaking();
  closeSpeaking = () => {};
  const [page, item, topic] = (location.hash.slice(1) || "today").split("/");
  const lesson = page === "lesson" && lessons.find((entry) => entry.id === item);
  const current = lesson ? "library" : page === "start" ? "today" : page;
  for (const link of document.querySelectorAll(".masthead a:not(.brand)")) {
    if (link.hash === "#" + current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }

  if (lesson?.conversation) {
    main.innerHTML = `<a class="back-link" href="#library">← คลังบทเรียน</a><h1 class="room-lesson-title" lang="en">${lesson.title}</h1>${conversationRoom(lesson)}`;
    bindConversation(lesson);
  } else if (lesson?.prompts) {
    main.innerHTML = speakingPage(lesson);
    bindSpeaking(lesson);
  } else if (lesson) {
    main.innerHTML = lessonPage(lesson);
    bindLesson(lesson);
  } else if (page === "library") {
    main.innerHTML = libraryPage(item, topic);
    bindLibrary();
  } else if (page === "review") {
    const queue = reviewQueue();
    main.innerHTML = reviewPage(queue);
    bindReview(queue[0]);
  } else if (page === "progress") {
    main.innerHTML = progressPage();
    bindProgress();
  } else if (page === "start") {
    main.innerHTML = startPage();
    const form = main.querySelector("#start-practice");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const { scenario, skill } = Object.fromEntries(new FormData(form));
      if (!Object.hasOwn(scenarios, scenario) || !Object.hasOwn(skills, skill)) return;
      const button = form.querySelector("button");
      if (button.disabled) return;
      button.disabled = true;
      await updateState((data) => {
        data.startScenario = scenario;
        data.startSkill = skill;
      });
      if (!form.isConnected) return;
      const matching = lessons.filter((entry) => entry.scenario === scenario && entry.skill === skill)
        .sort((a, b) => Number(Boolean(b.prompts)) - Number(Boolean(a.prompts)));
      const next = matching.find((entry) => !state.attempts.some((attempt) => attempt.lessonId === entry.id));
      location.hash = next ? `#lesson/${next.id}` : `#library/${skill}/${scenario}`;
    });
  } else if (page === "settings") {
    main.innerHTML = settingsPage();
    bindDataSettings();
    const settings = main.querySelector("#settings");
    settings.addEventListener("submit", async (event) => {
      event.preventDefault();
      const goal = Number(settings.elements.namedItem("goal").value);
      const { saved } = await updateState((data) => { data.goal = goal; });
      if (!settings.isConnected) return;
      main.querySelector("#saved-goal").textContent = state.goal;
      main.querySelector("#settings-status").textContent = saved ? `ตั้งเป้าหมายเป็น ${state.goal} นาทีต่อวันแล้ว` : "ปรับเป้าหมายชั่วคราวแล้ว แต่บันทึกบนอุปกรณ์ไม่ได้";
    });
  } else if (page !== "today") {
    main.innerHTML = `<section class="empty-state not-found">${illustration("empty", "state-art")}<p class="eyebrow">404 · PAGE NOT FOUND</p><h1>ไม่พบหน้าที่คุณกำลังหา</h1><p>ลิงก์อาจไม่ถูกต้อง เลือกบทเรียนเพื่อฝึกต่อได้เลย</p><a class="btn primary" href="#library">ไปคลังบทเรียน →</a></section>`;
  } else {
    main.innerHTML = todayPage();
    bindConversation(featuredConversation(), true);
  }
  document.title = `${lesson?.title ?? ({ today: "วันนี้", library: "คลังบทเรียน", review: "ทบทวนวลี", progress: "ความก้าวหน้า", settings: "ตั้งค่า", start: "เลือกจุดเริ่มต้น" })[page] ?? "ไม่พบหน้า"} · EnglishMe`;
  if (focusLibrarySearch && page === "library") main.querySelector("#lesson-search").focus();
  else if (focus) main.focus();
  focusLibrarySearch = false;
}

document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});
window.addEventListener("hashchange", () => {
  render(true);
  window.scrollTo(0, 0);
});
window.addEventListener("focus", () => {
  const now = new Date();
  const day = localDay.format(now);
  if (day === renderedDay) return;
  const date = main.querySelector("#today-date");
  if (date) {
    readCurrentState();
    renderedDay = day;
    date.textContent = thaiDate.format(now);
    main.querySelector("#today-summary").innerHTML = summaryCards();
    main.querySelector("#daily-plan").innerHTML = dailyPlan(completedToday(now));
    const review = main.querySelector(".today-sidebar .review-link");
    review.innerHTML = `<span class="eyebrow">A LITTLE REVIEW, A BIG DIFFERENCE</span>${todayReviewCard(reviewQueue(now).length)}`;
  } else if (location.hash === "#progress" || (location.hash === "#review" && main.querySelector("#review-answer")?.hidden !== false)) {
    render();
  }
});
render();

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest?.("input, textarea, select, [contenteditable]")) {
    const search = main.querySelector("#lesson-search");
    if (search) { event.preventDefault(); search.focus(); }
  }
});
