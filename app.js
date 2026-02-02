// ==========================
// CONFIG
// ==========================
const TARGET_DATE = "2026-04-11T00:00:00-05:00"; // Perú
const HIDE_COUNTDOWN_ON = new Set(["sorpresa.html"]);

// Tu MP3 (sin renombrar). Si falla, usa fallback.
const AUDIO_CANDIDATES = [
  "UWAIE - Kapo (Video Oficial).mp3",
  "audio/uwaie.mp3",
  "uwaie.mp3"
];

// ==========================
// HELPERS
// ==========================
function pad2(n){ return String(n).padStart(2, "0"); }
function pageName(){
  const p = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return p;
}

function toast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}

// ==========================
// COUNTDOWN (solo 1)
// ==========================
function removeOldCountdowns(){
  // Por si tenías versiones anteriores, las borra
  document.querySelectorAll(".countdown-badge,.countdown-box").forEach(el => el.remove());
}

function ensureCountdownDock(){
  if (document.getElementById("countdownDock")) return;

  const dock = document.createElement("div");
  dock.className = "countdown-dock";
  dock.id = "countdownDock";

  dock.innerHTML = `
    <div class="cd-title">Faltan para volver a vernos, mi amor</div>
    <div class="cd-sub" id="cdShort">Faltan --d --h --m --s ✨</div>

    <div class="cd-clock-grid" aria-live="polite">
      <div class="cd-chip">
        <span class="cd-num" id="cdDays">00</span>
        <span class="cd-lab">DÍAS</span>
      </div>
      <div class="cd-chip">
        <span class="cd-num" id="cdHours">00</span>
        <span class="cd-lab">HRS</span>
      </div>
      <div class="cd-chip">
        <span class="cd-num" id="cdMins">00</span>
        <span class="cd-lab">MIN</span>
      </div>
      <div class="cd-chip">
        <span class="cd-num" id="cdSecs">00</span>
        <span class="cd-lab">SEG</span>
      </div>
    </div>
  `;
  document.body.appendChild(dock);
}

function updateCountdown(){
  const dEl = document.getElementById("cdDays");
  const hEl = document.getElementById("cdHours");
  const mEl = document.getElementById("cdMins");
  const sEl = document.getElementById("cdSecs");
  const shortEl = document.getElementById("cdShort");
  if(!dEl || !hEl || !mEl || !sEl) return;

  const now = Date.now();
  const target = new Date(TARGET_DATE).getTime();
  let diff = target - now;

  if(diff <= 0){
    dEl.textContent = "0";
    hEl.textContent = "00";
    mEl.textContent = "00";
    sEl.textContent = "00";
    if(shortEl) shortEl.textContent = "Ya llegó el día ✨";
    return;
  }

  const sec = Math.floor(diff/1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);

  dEl.textContent = String(days);
  hEl.textContent = pad2(hours);
  mEl.textContent = pad2(mins);
  sEl.textContent = pad2(secs);

  if(shortEl){
    shortEl.textContent = `Faltan ${days}d ${pad2(hours)}h ${pad2(mins)}m ${pad2(secs)}s ✨`;
  }
}

// ==========================
// AUDIO (persistencia básica)
// ==========================
function initAudio(){
  const bgm = document.getElementById("bgm");
  const playBtn = document.getElementById("playBtn");
  if(!bgm || !playBtn) return;

  // Inyecta source sin renombrar (usa encodeURI para espacios)
  let idx = 0;
  function setSrc(i){
    const src = AUDIO_CANDIDATES[i];
    bgm.src = encodeURI(src);
  }
  setSrc(idx);

  bgm.addEventListener("error", ()=>{
    idx++;
    if(idx < AUDIO_CANDIDATES.length){
      setSrc(idx);
    }else{
      toast("No encontré el MP3 (revisa que esté en el repo).");
    }
  });

  // Restaurar estado
  const wasPlaying = localStorage.getItem("bgm_playing") === "1";
  const lastTime = Number(localStorage.getItem("bgm_time") || "0");

  bgm.currentTime = isFinite(lastTime) ? lastTime : 0;

  // Guardar tiempo si está sonando
  setInterval(()=>{
    if(!bgm.paused){
      localStorage.setItem("bgm_time", String(bgm.currentTime || 0));
    }
  }, 900);

  async function toggle(){
    try{
      if(bgm.paused){
        await bgm.play();
        localStorage.setItem("bgm_playing","1");
        playBtn.textContent = "⏸";
      }else{
        bgm.pause();
        localStorage.setItem("bgm_playing","0");
        playBtn.textContent = "▶";
      }
    }catch(e){
      toast("Toca otra vez para activar audio (bloqueo del navegador).");
    }
  }

  playBtn.addEventListener("click", toggle);

  // Si antes estaba sonando, intenta continuar (puede bloquearse)
  if(wasPlaying){
    bgm.play().then(()=> {
      playBtn.textContent = "⏸";
    }).catch(()=> {
      playBtn.textContent = "▶";
      localStorage.setItem("bgm_playing","0");
    });
  }else{
    playBtn.textContent = "▶";
  }
}

// ==========================
// MODAL (cierra bien, móvil ok)
// ==========================
function wireModal(){
  const modal = document.getElementById("modal");
  if(!modal) return;

  const bg = document.getElementById("modalBg");
  const closeBtn = document.getElementById("modalClose");
  const img = document.getElementById("modalImg");

  function open(src){
    img.src = src;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }
  function close(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    img.src = "";
    document.body.style.overflow = "";
  }

  bg && bg.addEventListener("click", close);
  closeBtn && closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && modal.classList.contains("open")) close();
  });

  // anti "pegado" al hacer scroll dentro del modal en móvil
  modal.addEventListener("touchmove", (e)=> e.preventDefault(), { passive:false });

  // expone para la galería
  window.__OPEN_MODAL = open;
}

// ==========================
// INIT
// ==========================
(function init(){
  removeOldCountdowns();

  const page = pageName();
  if(!HIDE_COUNTDOWN_ON.has(page)){
    ensureCountdownDock();
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  initAudio();
  wireModal();
})();
