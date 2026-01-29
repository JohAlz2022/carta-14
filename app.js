// app.js — reproductor persistente (mejor esfuerzo) para GitHub Pages
(() => {
  const audio = document.getElementById("bgm");
  const playBtn = document.getElementById("playBtn");

  if (!audio) return;

  const K_PLAY = "bgm_play";
  const K_TIME = "bgm_time";
  const K_VOL  = "bgm_vol";

  const savedPlay = localStorage.getItem(K_PLAY) === "1";
  const savedTime = parseFloat(localStorage.getItem(K_TIME) || "0");
  const savedVol  = parseFloat(localStorage.getItem(K_VOL)  || "0.85");

  if (!Number.isNaN(savedVol)) audio.volume = Math.min(1, Math.max(0, savedVol));

  function ui(isPlaying){
    if (!playBtn) return;
    playBtn.textContent = isPlaying ? "⏸" : "▶";
  }

  function save(){
    try{
      localStorage.setItem(K_TIME, String(audio.currentTime || 0));
      localStorage.setItem(K_VOL,  String(audio.volume || 0.85));
    }catch(e){}
  }

  // Intentar reubicar el tiempo cuando ya hay metadata
  audio.addEventListener("loadedmetadata", () => {
    if (!Number.isNaN(savedTime) && savedTime > 0 && audio.duration && savedTime < audio.duration) {
      audio.currentTime = savedTime;
    }
  });

  // Guardado continuo
  setInterval(save, 800);
  window.addEventListener("beforeunload", save);

  async function play(){
    localStorage.setItem(K_PLAY, "1");
    try{
      await audio.play();
      ui(true);
    }catch(e){
      // Autoplay bloqueado -> mantenemos K_PLAY=1 para reintentar al próximo click
      ui(false);
      toast("Toca ▶ para continuar la música");
    }
  }

  function pause(){
    audio.pause();
    localStorage.setItem(K_PLAY, "0");
    ui(false);
  }

  function toast(msg){
    let t = document.querySelector(".toast");
    if (t) t.remove();
    t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(()=>t.remove(), 200); }, 1600);
  }

  // Botón play/pause
  if (playBtn){
    playBtn.addEventListener("click", () => {
      audio.paused ? play() : pause();
    });
  }

  // Reanudar si antes estaba en play
  if (savedPlay) play(); else ui(false);

  // Si autoplay falla, al primer toque reintentamos
  window.addEventListener("pointerdown", () => {
    if (localStorage.getItem(K_PLAY) === "1" && audio.paused) play();
  }, { passive: true });

})();
