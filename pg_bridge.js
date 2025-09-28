// Runs as a content script on every page.
// If your PG site posts { type:'PG_ALERT', payload:{...} } via window.postMessage,
// this relays it to the extension with retries (handles extension reloads).

(function () {
  if (window.__PG_BRIDGE__) return;
  window.__PG_BRIDGE__ = true;

  try { chrome.runtime.sendMessage({ type: "PG_BRIDGE_READY" }); } catch {}

  function sendToBG(payload, attempt = 0) {
    try {
      chrome.runtime.sendMessage({ type: "PG_ALERT", payload }, (res) => {
        if (chrome.runtime.lastError) {
          // Common during extension reload or service-worker restart
          if (attempt < 6) setTimeout(() => sendToBG(payload, attempt + 1), 300 * (attempt + 1));
        }
      });
    } catch {
      if (attempt < 6) setTimeout(() => sendToBG(payload, attempt + 1), 300 * (attempt + 1));
    }
  }

  window.addEventListener("message", (evt) => {
    const data = evt?.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "PG_ALERT") {
      const payload = data.payload || {};
      sendToBG(payload);
    }
  });

  // Optional helper from the page console:
  // window.__pgAlert({ isSlouch:true, title:'Neck Tilt', message:'Uncurl your neck 🙂' })
  window.__pgAlert = (payload) => sendToBG(payload || {});
})();
