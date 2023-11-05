import {urlToEntry, urlToId} from "../util/utils.js";

async function INIT_EXTENSION() {

    /* init add-active-url button */
    const activeTab = await getCurrentTab();
    if (activeTab) {
        const url = new URL(activeTab.url);
        const urlEntry = urlToEntry(url);
        document.getElementById('add-active-url-text').innerText = urlEntry;
        document.getElementById('add-active-url-button').addEventListener('click', async () => {
            await addUrlToList(new URL(url));
        });
        validateUrl(urlEntry).then(result => {
            if (!result.valid) {
                document.getElementById('add-active-url-button').setAttribute('disabled', '');
                console.log(result.message);
            } else {
                document.getElementById('add-active-url-button').removeAttribute('disabled');
            }
        });
    }

    /* init add-url button */
    document.getElementById('add-url-button').addEventListener('click', async () => {
        const url = document.getElementById('add-url-input').value;

        const result = await validateUrl(url);
        if (!result.valid) {
            console.log(result.message);
            return;
        }

        await addUrlToList(new URL(url));
    });
    document.getElementById('add-url-input').addEventListener('keydown', async (event) => {
        const url = event.target.value;
        const result = await validateUrl(url);
        if (result.valid) {
            if (event.key === 'Enter') {
                await addUrlToList(new URL(url));
            }
        }
    });

    document.getElementById('add-url-input').addEventListener('input', async (event) => {
        const result = await validateUrl(event.target.value);
        if (!result.valid) {
            document.getElementById('add-url-button').setAttribute('disabled', '');
            document.getElementById('add-url').setAttribute('disabled', '');
            console.log(result.message);
        } else {
            document.getElementById('add-url-button').removeAttribute('disabled');
            document.getElementById('add-url').removeAttribute('disabled');
        }
    });

    chrome.storage.sync.get(["bigMute"]).then(bigData => {
        const bigMute = bigData.bigMute ?? { urls: [] };
        for (const bigMuteElement of bigMute.urls) {
            const url = new URL(bigMuteElement.entry);
            createUrlElement(url);
        }
        emptyElementIsShown(bigMute.urls.length === 0);
    });

    /* register storage change listener */
    chrome.storage.onChanged.addListener((changes, area) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (area === 'sync' && key === 'bigMute') {
                oldValue = oldValue?? { urls: [] };
                newValue = newValue?? { urls: [] };

                const addedUrls = newValue.urls.filter(newElem =>
                    !oldValue.urls.some(oldElem => oldElem.id === newElem.id)
                );
                console.log(addedUrls);

                const removedUrls = oldValue.urls.filter(oldElem =>
                    !newValue.urls.some(newElem => newElem.id === oldElem.id)
                );
                console.log(removedUrls);

                for (const elem of addedUrls) {
                    const url = new URL(elem.entry);
                    registerContentScript(url);
                    createUrlElement(url);
                }
                for (const elem of removedUrls) {
                    const url = new URL(elem.entry);
                    unregisterContentScript(url);
                    removeUrlElement(urlToId(url));
                }

                emptyElementIsShown(newValue.urls.length === 0);
            }
        }
    });
}






async function addUrlToList(url) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:'){
        return false;
    }

    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };

    if (bigMute.urls.some(elem => elem.id === urlToId(url))){
        return false;
    }

    const tab = await getCurrentTab();

    bigMute.urls.push({
        id: urlToId(url),
        entry: urlToEntry(url),
        pos: {x: "50%", y: "50%"},
        muted: false,
        minimized: false,
        sessionId: tab.sessionId,
        originTabId: tab.id
    });
    chrome.storage.sync.set({['bigMute']: bigMute});
    return true;
}

async function removeUrlFromList(urlEntry) {
    const url = new URL(urlEntry);
    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };

    const idx = bigMute.urls.findIndex(elem => elem.id === urlToId(url));
    if (idx !== -1){
        bigMute.urls.splice(idx, 1);
        chrome.storage.sync.set({['bigMute']: bigMute});
    }
    console.log('bigMute', bigMute);
}

function createUrlElement(url) {

    const favIconElement = document.createElement('img');
    favIconElement.classList.add('url-list-item-icon');
    favIconElement.src = getFaviconURL(urlToEntry(url));

    const urlProtocolElement = document.createElement('span');
    urlProtocolElement.classList.add('url-list-item-url-protocol');
    urlProtocolElement.innerText = url.protocol + '//';

    const urlElement = document.createElement('span');
    urlElement.classList.add('url-list-item-url');
    urlElement.innerText = url.hostname;

    const urlTrailingElement = document.createElement('span');
    urlTrailingElement.classList.add('url-list-item-url-protocol');
    urlTrailingElement.innerText = '/';

    const urlContainerElement = document.createElement('div');
    urlContainerElement.classList.add('url-list-item-url-container');
    urlContainerElement.appendChild(urlProtocolElement);
    urlContainerElement.appendChild(urlElement);
    urlContainerElement.appendChild(urlTrailingElement);

    const deleteElement = document.createElement('span');
    deleteElement.classList.add('url-list-item-delete', 'material-symbols-outlined');
    deleteElement.innerText = 'delete';
    deleteElement.onclick = () => removeUrlFromList(urlToEntry(url));

    const listItemElement = document.createElement('div');
    listItemElement.id = urlToId(url); // crypto.randomUUID();
    listItemElement.classList.add('url-list-item');
    listItemElement.onmouseenter = () => deleteElement.style.opacity = '1';
    listItemElement.onmouseleave = () => deleteElement.style.opacity = '0';
    listItemElement.appendChild(favIconElement);
    listItemElement.appendChild(urlContainerElement);
    listItemElement.appendChild(deleteElement);

    const urlListElement = document.getElementById('url-list');
    urlListElement.appendChild(listItemElement);
}

function removeUrlElement(id) {
    const elementToRemove = document.getElementById(id);
    elementToRemove?.remove();
}

function emptyElementIsShown(isShown) {
    document.getElementById('empty-url-item').style.display = isShown ? 'block' : 'none';
}

function getFaviconURL(url) {
    // chrome-extension://EXTENSION_ID/_favicon/?pageUrl=https://www.youtube.com/&size=32
    const favIconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
    favIconUrl.searchParams.set('pageUrl', url); // this encodes the URL as well
    favIconUrl.searchParams.set('size', '32');
    return favIconUrl.toString();
}

async function validateUrl(urlString) {
    if (!urlString || urlString?.length === 0) {
        return {valid: true};
    }

    let url;
    try {
        url = new URL(urlString);
    } catch (e){
        if (e instanceof TypeError) {
            return {valid: false, message: "Invalid Urls!."};
        } else {
            return {valid: false, message: "Could not parse the provided Url!"};
        }
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:'){
        return {valid: false, message: "Invalid protocol! Must be 'http' or 'https'."};
    }

    let bigData = await chrome.storage.sync.get(["bigMute"]);
    const bigMute = bigData.bigMute ?? { urls: [] };
    const idx = bigMute.urls.findIndex(elem => elem.id === urlToId(url));
    if (idx !== -1){
        return {valid: false, message: "URL already added."};
    }
    return {valid: true};
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function registerContentScript(url) {
    const urlEntry = urlToEntry(url);
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

async function unregisterContentScript(url) {
    const urlEntry = urlToEntry(url);
    chrome.scripting.unregisterContentScripts({ids: [urlToId(url)]})
        .then(() => console.log("Unregister script for " + urlEntry))
        .catch((err) => console.warn("Could not unregister script!", err));
}



/* init popup page */
void INIT_EXTENSION();
console.log('INIT_EXTENSION');
