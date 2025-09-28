const $ = (s) => document.querySelector(s);
const urlInput = $('#pgUrl');

// Prefill URL
chrome.runtime.sendMessage({ type: 'PG_GET_URL' }, (res) => {
  if (res && res.url) urlInput.value = res.url;
});

// Save URL
$('#save').addEventListener('click', async () => {
  const url = urlInput.value.trim();
  await chrome.runtime.sendMessage({ type: 'PG_SET_URL', url });
});

// Open pinned app tab
$('#open').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'PG_OPEN' });
});

// Test alerts (simulate PG app events)
$('#test-on').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    type: 'PG_ALERT',
    payload: { isSlouch: true, title: 'Posture Alert', message: "You're slouching! Sit up straight!" }
  });
});

$('#test-off').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({
    type: 'PG_ALERT',
    payload: { isSlouch: false, title: 'Posture', message: 'Good posture' }
  });
});
