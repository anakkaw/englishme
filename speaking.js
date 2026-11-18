"use strict";

let closeSpeaking = () => {};

function speakingPage(lesson) {
  return `<a class="back-link" href="#library/speaking">← คลังบทฝึกพูด</a>
    ${pageHeading(`<span lang="en">${lesson.title}</span>`, lesson.goal, `scene-${lesson.scenario}`)}
    <div class="practice-layout">
      <section class="context-panel">
        <h2>โจทย์พูด</h2>
        <label>สถานการณ์ <select id="speaking-form"><option value="0">ฉบับ A</option><option value="1">ฉบับ B</option></select></label>
        <p class="flow context-quote" id="speaking-prompt"></p>
        <p class="flow">${lesson.question}</p>
        <details id="speaking-model" class="flow"><summary>ดูตัวอย่างคำตอบ</summary><p lang="en"></p></details>
      </section>
      <section class="exercise-panel">
        <h2>อัดเสียงและฟังย้อน</h2>
        <p class="muted">เสียงเล่นย้อนในหน้านี้ได้จนกว่าจะออกจากบท ประวัติเก็บเฉพาะผลที่คุณประเมิน</p>
        <div class="controls flow">
          <button class="btn primary" id="record" type="button">เริ่มอัดเสียง</button>
          <button class="btn secondary" id="stop-recording" type="button" disabled>หยุดอัด</button>
        </div>
        <p id="record-status" role="status"></p>
        <audio id="record-playback" controls hidden></audio>
        <form id="speaking-check" class="flow">
          <fieldset><legend>หลังพูด ลองตรวจคำตอบของตัวเอง</legend>
            ${lesson.criteria.map((criterion, index) => `<label class="option">
              <input name="criterion" type="checkbox" value="${index}"><span>${criterion}</span></label>`).join("")}
          </fieldset>
          <div><button class="btn secondary" type="submit">บันทึกผลประเมินตนเอง</button></div>
          <p id="speaking-status" role="status" tabindex="-1"></p>
        </form>
      </section>
    </div>`;
}

function bindSpeaking(lesson) {
  const variant = main.querySelector("#speaking-form");
  const prompt = main.querySelector("#speaking-prompt");
  const model = main.querySelector("#speaking-model");
  const start = main.querySelector("#record");
  const stop = main.querySelector("#stop-recording");
  const playback = main.querySelector("#record-playback");
  const status = main.querySelector("#record-status");
  const evidence = main.querySelector("#speaking-check");
  const evidenceStatus = main.querySelector("#speaking-status");
  const submit = evidence.querySelector('button[type="submit"]');
  let recorder;
  let stream;
  let playbackUrl;
  let timer;
  let closed = false;
  let savedChecks;
  let saving = false;

  function selectedChecks() {
    return [...evidence.querySelectorAll("input:checked")].map((input) => Number(input.value));
  }

  function releaseMic() {
    clearTimeout(timer);
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
  }

  function clearPlayback() {
    playback.pause();
    playback.removeAttribute("src");
    playback.load();
    playback.hidden = true;
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    playbackUrl = undefined;
  }

  function showPrompt() {
    prompt.textContent = lesson.prompts[Number(variant.value)];
    model.querySelector("p").textContent = lesson.models[Number(variant.value)];
    model.open = false;
    evidence.reset();
    savedChecks = undefined;
    submit.disabled = false;
    const previous = state.attempts.findLast((entry) => entry.lessonId === lesson.id && entry.speakingForm === Number(variant.value));
    evidenceStatus.textContent = previous ? `ประเมินครั้งล่าสุด ${previous.speakingChecks.length}/${lesson.criteria.length} ข้อ` : "";
    status.textContent = "";
    clearPlayback();
  }

  function unlock() {
    start.disabled = false;
    stop.disabled = true;
    variant.disabled = false;
  }

  variant.addEventListener("change", showPrompt);
  showPrompt();

  start.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      status.textContent = "หน้านี้ใช้ไมค์ไม่ได้ ลองพูดออกเสียงแล้วประเมินด้วยตัวเองด้านล่าง";
      return;
    }
    start.disabled = variant.disabled = true;
    evidenceStatus.textContent = "";
    evidence.reset();
    status.textContent = "กำลังขอใช้ไมโครโฟน";
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (closed) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = input;
      const recording = new MediaRecorder(stream);
      recorder = recording;
      const chunks = [];
      recording.addEventListener("dataavailable", (event) => {
        if (event.data.size) chunks.push(event.data);
      });
      recording.addEventListener("error", () => {
        if (recorder !== recording) return;
        recorder = undefined;
        releaseMic();
        if (closed) return;
        unlock();
        status.textContent = "อัดเสียงไม่สำเร็จ ลองใหม่หรือฝึกโดยไม่ใช้ไมค์";
      });
      recording.addEventListener("stop", () => {
        if (recorder !== recording) return;
        recorder = undefined;
        releaseMic();
        if (closed) return;
        unlock();
        if (!chunks.length) {
          status.textContent = "ยังไม่มีเสียงสำหรับเล่นย้อน ลองอัดอีกครั้ง";
          return;
        }
        clearPlayback();
        playbackUrl = URL.createObjectURL(new Blob(chunks, { type: recording.mimeType }));
        playback.src = playbackUrl;
        playback.hidden = false;
        status.textContent = "อัดเสร็จแล้ว ลองฟังย้อนก่อนประเมิน";
      });
      recording.start();
      clearPlayback();
      savedChecks = undefined;
      submit.disabled = false;
      stop.disabled = false;
      status.textContent = "กำลังอัดเสียง · จำกัด 90 วินาที";
      timer = setTimeout(stopRecording, 90000);
    } catch {
      recorder = undefined;
      releaseMic();
      if (closed) return;
      unlock();
      status.textContent = "เปิดไมค์ไม่สำเร็จ ตรวจสิทธิ์ของเบราว์เซอร์ หรือฝึกออกเสียงและประเมินด้านล่าง";
    }
  });

  function stopRecording() {
    if (recorder?.state !== "recording") return;
    stop.disabled = true;
    recorder.stop();
  }
  stop.addEventListener("click", stopRecording);

  evidence.addEventListener("change", () => {
    if (!saving) submit.disabled = selectedChecks().join(",") === savedChecks;
  });
  evidence.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled || saving) return;
    if (start.disabled) {
      evidenceStatus.textContent = "หยุดอัดและฟังย้อนหลังได้ก่อนบันทึก";
      return;
    }
    const checks = selectedChecks();
    const attempt = {
      lessonId: lesson.id, at: new Date().toISOString(),
      speakingForm: Number(variant.value), speakingChecks: checks,
    };
    saving = submit.disabled = start.disabled = variant.disabled = true;
    const { saved } = await updateState((data) => data.attempts.push(attempt));
    if (closed) return;
    saving = false;
    unlock();
    savedChecks = checks.join(",");
    submit.disabled = selectedChecks().join(",") === savedChecks;
    evidenceStatus.textContent = saved
      ? `บันทึกการประเมินตนเองแล้ว ${checks.length}/${lesson.criteria.length} ข้อ`
      : "ประเมินแล้ว แต่เบราว์เซอร์บันทึกประวัติไม่ได้";
    if (document.activeElement === document.body) evidenceStatus.focus();
  });

  closeSpeaking = () => {
    closed = true;
    stopRecording();
    releaseMic();
    clearPlayback();
  };
}
