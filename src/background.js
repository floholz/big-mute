import {urlToId, hasValue} from "./util/utils.js";

chrome.runtime.onInstalled.addListener(async ({reason}) => {
    if (reason === 'install') {
      chrome.tabs.create({
        url: "src/onboarding/onboarding.html"
      });
    }

    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };

    const registeredScripts = await chrome.scripting.getRegisteredContentScripts();
    console.log(registeredScripts);

    for (const elem of bigMute.urls) {
        const url = new URL(elem.entry);
        if (registeredScripts.some(script => script.id === elem.id)) continue;
        chrome.scripting.registerContentScripts([{
            id: elem.id,
            js: ["src/content/content.js"],
            css: ['src/content/content.css'],
            persistAcrossSessions: true,
            matches: [elem.entry + '*'],
            runAt: "document_idle",
        }])
            .then(() => console.log("Registered script for " + elem.entry))
            .catch((err) => console.warn("Could not register script!", err));
    }
  });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.bigMute) {
        if (message.bigMute.syncMuteState) {
            syncMuteState(sender.tab).then(sendResponse);
        }
        if (message.bigMute.getOptions) {
            getBigMuteOptions(urlToId(new URL(sender.tab.url))).then(sendResponse);
        }
        if (message.bigMute.setOptions) {
            setBigMuteOptions(sender.tab, message.bigMute.setOptions).then(sendResponse);
        }
    }
    return true;
});

async function syncMuteState(tab) {
    const id = urlToId(new URL(tab.url));
    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };

    const idx = bigMute.urls.findIndex(elem => elem.id === id);
    if (idx === -1) {
        return undefined;
    }

    if (bigMute.urls[idx].muted !== tab.mutedInfo.muted) {

        if (tab.mutedInfo.reason === 'user') {
            bigMute.urls[idx].muted = tab.mutedInfo.muted;
            await chrome.storage.sync.set({['bigMute']: bigMute});
        } else {
            await chrome.tabs.update(tab.id, {muted: bigMute.urls[idx].muted});
        }
    }

    return bigMute.urls[idx].muted;
}

async function setBigMuteOptions(tab, options) {
    const id = urlToId(new URL(tab.url));
    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };

    const idx = bigMute.urls.findIndex(elem => elem.id === id);
    if (idx === -1) {
        return false;
    }

    if (options.pos) {
        bigMute.urls[idx].pos = options.pos;
    }
    if (hasValue(options.minimized)) {
        bigMute.urls[idx].minimized = options.minimized;
    }
    if (hasValue(options.muted)) {
        if (options.muted === 'toggle') {
            options.muted = !bigMute.urls[idx].muted;
        }
        await chrome.tabs.update(tab.id, {muted: options.muted});
        bigMute.urls[idx].muted = options.muted;
    }

    await chrome.storage.sync.set({['bigMute']: bigMute});
    return bigMute.urls[idx];
}

async function getBigMuteOptions(id) {
    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };

    const idx = bigMute.urls.findIndex(elem => elem.id === id);
    if (idx === -1) {
        return false;
    }

    return bigMute.urls[idx];
}
