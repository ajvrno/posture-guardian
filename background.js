// Stable live-linked background: receive PG_ALERT from PG site, persist & broadcast to all tabs.

let lastState = null; // null=unknown, true=slouch, false=good
let lastPayload = { title: "Posture", message: "Good posture" };

function log(...a){ try{ console.log("[PG BG]", ...a); } catch {} }

async function setBadge(on) {
  try {
    await chrome.action.setBadgeText({ text: on ? "!" : "" });
    await chrome.action.setBadgeBackgroundColor({ color: on ? "#ef4444" : "#00000000" });
  } catch {}
}

async function broadcastToAllTabs(isSlouch, title, message) {
  try {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    await Promise.all(
      tabs.map(t =>
        chrome.tabs.sendMessage(t.id, {
          type: "PG_OVERLAY",
          payload: { show: !!isSlouch, title, message }
        }).catch(() => {})
      )
    );
  } catch {}
}

// Paint new active/focused tab with the last known state
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (lastState === null) return;
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "PG_OVERLAY",
      payload: { show: !!lastState, title: lastPayload.title, message: lastPayload.message }
    });
  } catch {}
});
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE || lastState === null) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: "PG_OVERLAY",
        payload: { show: !!lastState, title: lastPayload.title, message: lastPayload.message }
      });
    }
  } catch {}
});

// If storage pgLast changes (e.g., message missed), still push to all tabs
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes.pgLast) return;
  const v = changes.pgLast.newValue;
  if (!v) return;
  await broadcastToAllTabs(!!v.isSlouch, v.title, v.message);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PG_ALERT") {
      let { isSlouch = false, title = "Posture Alert", message = "You're slouching! Sit up straight!" } = msg.payload || {};
      const slouch = isSlouch === true || isSlouch === 1 || (typeof isSlouch === "string" && isSlouch.toLowerCase() === "true");

      lastPayload = { title, message };
      await chrome.storage.local.set({ pgLast: { isSlouch: slouch, title, message, ts: Date.now() } });

      if (lastState !== slouch) {
        lastState = slouch;
        await setBadge(slouch);
        await broadcastToAllTabs(slouch, title, message);
      }
      sendResponse({ ok: true });
      return;
    }

    if (msg?.type === "PG_BRIDGE_READY") { sendResponse({ ok: true }); return; }
    sendResponse({ ok: false, error: "unknown_message_type" });
  })();
  return true;
});
