chrome.runtime.onInstalled.addListener(({reason}) => {
    if (reason === 'install') {
      chrome.tabs.create({
        url: "onboarding.html"
      });

      chrome.storage.sync.set(JSON.stringify({
          allowedUrls: [
              "https://www.youtube.com/",
              "https://www.twitch.tv/"
          ]
      }));
    }
  });

chrome.runtime.onMessage.addListener((message, sender) => {
    const msg = message.split(' ');
    if (msg[0] === 'bigMute') {
        console.log(sender);
        if (msg[1] === 'mute') {
            toggleMuteState(sender.tab.id);
        }
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function toggleMuteState(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const muted = !tab.mutedInfo.muted;
    await chrome.tabs.update(tabId, {muted});
    console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`);
}
