document.getElementById('popup-btn').addEventListener('click', async () => {
    // window.alert('clicked!');


    const currentTab = await getCurrentTab();
    console.log(currentTab);

    await toggleMuteState(currentTab.id);

});


async function toggleMuteState(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const muted = !tab.mutedInfo.muted;
    await chrome.tabs.update(tabId, {muted});
    console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`);
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
