// Shows a tiny pill. Listens to PG_OVERLAY messages + storage changes.
// Alt+P toggles locally for a quick sanity check.

(function () {
  if (window.__PG_PILL__) return;
  window.__PG_PILL__ = true;

  let state = { isSlouch: false, title: "Posture", message: "Good posture" };
  let minimized = false;

  const wrap = document.createElement("div");
  wrap.className = "pg-pill";
  wrap.innerHTML = `
    <div class="pg-pill-inner" role="status" aria-live="polite">
      <div class="dot" aria-hidden="true"></div>
      <div class="text">
        <div class="title">Posture</div>
        <div class="msg">Good posture</div>
      </div>
      <div class="actions">
        <button class="min" title="Minimize/Expand">–</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(wrap);

  const inner = wrap.querySelector(".pg-pill-inner");
  const titleEl = wrap.querySelector(".title");
  const msgEl = wrap.querySelector(".msg");
  const btnMin = wrap.querySelector(".min");

  const render = () => {
    wrap.classList.toggle("slouch", !!state.isSlouch);
    wrap.classList.toggle("minimized", minimized);
    titleEl.textContent = state.title || (state.isSlouch ? "Posture Alert" : "Posture");
    msgEl.textContent   = state.message || (state.isSlouch ? "You're slouching! Sit up straight!" : "Good posture");
  };

  btnMin.addEventListener("click", (e) => { e.preventDefault(); minimized = !minimized; render(); });

  // Drag to reposition
  let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
  const startDrag = (ev) => {
    const p = ev.touches ? ev.touches[0] : ev;
    dragging = true; startX = p.clientX; startY = p.clientY;
    const r = wrap.getBoundingClientRect(); startLeft = r.left; startTop = r.top;
    wrap.style.right = "auto"; wrap.style.bottom = "auto";
    wrap.style.left = `${startLeft}px`; wrap.style.top = `${startTop}px`;
    document.addEventListener("mousemove", onDrag, true);
    document.addEventListener("touchmove", onDrag, { passive: false, capture: true });
    document.addEventListener("mouseup", endDrag, true);
    document.addEventListener("touchend", endDrag, { capture: true });
  };
  const onDrag = (ev) => {
    if (!dragging) return;
    const p = ev.touches ? ev.touches[0] : ev;
    const dx = p.clientX - startX, dy = p.clientY - startY;
    const left = Math.max(0, Math.min(window.innerWidth - wrap.offsetWidth, startLeft + dx));
    const top  = Math.max(0, Math.min(window.innerHeight - wrap.offsetHeight, startTop + dy));
    wrap.style.left = `${left}px`; wrap.style.top = `${top}px`;
    ev.preventDefault();
  };
  const endDrag = () => {
    dragging = false;
    document.removeEventListener("mousemove", onDrag, true);
    document.removeEventListener("touchmove", onDrag, true);
    document.removeEventListener("mouseup", endDrag, true);
    document.removeEventListener("touchend", endDrag, true);
  };
  inner.style.cursor = "move";
  inner.addEventListener("mousedown", startDrag);
  inner.addEventListener("touchstart", startDrag, { passive: true });

  // Messages from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "PG_OVERLAY") {
      const { show, title, message } = msg.payload || {};
      state.isSlouch = !!show;
      if (title) state.title = title;
      state.message = state.isSlouch ? (message || "You're slouching! Sit up straight!") : "Good posture";
      render();
    }
  });

  // Init from storage + react to changes
  chrome.storage.local.get(["pgLast"]).then(({ pgLast }) => {
    if (pgLast && typeof pgLast === "object") {
      state.isSlouch = !!pgLast.isSlouch;
      state.title    = pgLast.title || state.title;
      state.message  = state.isSlouch ? (pgLast.message || state.message) : "Good posture";
    }
    render();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.pgLast) return;
    const v = changes.pgLast.newValue;
    if (!v) return;
    state.isSlouch = !!v.isSlouch;
    state.title    = v.title || state.title;
    state.message  = state.isSlouch ? (v.message || state.message) : "Good posture";
    render();
  });

  // Local quick test
  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "p" || e.key === "P")) {
      state.isSlouch = !state.isSlouch;
      state.title = state.isSlouch ? "Posture Alert" : "Posture";
      state.message = state.isSlouch ? "You're slouching! Sit up straight!" : "Good posture";
      render();
    }
  });

  render();
})();
