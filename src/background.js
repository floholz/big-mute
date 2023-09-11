import {urlToId, urlToEntry} from "./util/utils.js";

chrome.runtime.onInstalled.addListener(async ({reason}) => {
    if (reason === 'install') {
      chrome.tabs.create({
        url: "src/onboarding/onboarding.html"
      });
    }

    const data = await chrome.storage.sync.get({urlList: []});
    const urlSet = new Set(data.urlList);

    const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
    console.log(registeredScripts);

    for (const urlEntry of urlSet) {
        const url = new URL(urlEntry);
        if (registeredScripts.some(script => script.id === urlToId(url))) continue;
        chrome.scripting.registerContentScripts([{
            id: urlToId(url),
            js: ["src/content/content.js"],
            css: ['src/content/content.css'],
            persistAcrossSessions: true,
            matches: [urlEntry + '*'],
            runAt: "document_idle",
        }])
            .then(() => console.log("Registered script for " + urlEntry))
            .catch((err) => console.warn("Could not register script!", err));
    }
  });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.bigMute) {
        if (message.bigMute.toggleMute) {
            toggleMuteState(sender.tab).then(sendResponse);
        }
    }
    return true;
});

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function toggleMuteState(tab) {
    // const tab = await chrome.tabs.get(tabId);
    const muted = !tab.mutedInfo.muted;
    await chrome.tabs.update(tab.id, {muted});
    console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`);
    return muted;
}
