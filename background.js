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

/*

chrome.tabs.onActivated.addListener(executeScriptOnActiveTab);
async function executeScriptOnActiveTab(activeInfo) {
    try {
        // await chrome.scripting.executeScript({
        //     target : {tabId : activeInfo.tabId},
        //     files : [ "script.js" ],
        // }).then(() => console.log("script injected"));

        activeInfo

        const scripts = await chrome.scripting.getRegisteredContentScripts();
        console.log(scripts);

        await chrome.scripting.registerContentScripts([
            {
                "id": "dhskdhkasdhk",
                "js": ["script.js"],
                "matches": [
                    "https://developer.chrome.com/*"
                ]
            }
        ]);

    } catch (error) {
        console.error(error);
    }
}


async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

*/
