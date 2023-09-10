/*
document.getElementById('popup-btn').addEventListener('click', async () => {
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
*/


async function INIT_EXTENSION() {

    /* init add-active-url button */
    const activeTab = await getCurrentTab();
    if (activeTab) {
        const url = new URL(activeTab.url);
        document.getElementById('add-active-url-text').innerText = urlToEntry(url);
        document.getElementById('add-active-url-button').addEventListener('click', async () => {
            await addUrlToList(new URL(url));
        });
    }

    /* init add-url button */
    document.getElementById('add-url-button').addEventListener('click', async () => {
        const url = document.getElementById('add-url-input').value;
        try {
            await addUrlToList(new URL(url));
        } catch (e) {
            if (e instanceof TypeError) {
                //todo: display invalid error
                console.log(e.message);
            } else {
                console.error(e)
            }
        }
    });
    document.getElementById('add-url-input').addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const url = event.target.value;
            try {
                await addUrlToList(new URL(url));
            } catch (e) {
                if (e instanceof TypeError) {
                    //todo: display invalid error
                    console.log(e.message);
                } else {
                    console.error(e)
                }
            }
        }
    });

    /* init registered urls from storage */
    chrome.storage.sync.get({urlList: []}, async (data) => {
        const urlSet = new Set(data.urlList);
        console.log(urlSet);
        for (const entry of urlSet) {
            console.log(entry);
            createUrlElement(new URL(entry));
        }
        emptyElementIsShown(urlSet.size === 0);
    });

    /* register storage change listener */
    chrome.storage.onChanged.addListener((changes, area) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (area === 'sync') {
                console.log(
                    `Storage key "${key}" in namespace "${area}" changed.`,
                    `Old value was "${oldValue}", new value is "${newValue}".`
                );

                const added = new Set(newValue);
                for (const element of oldValue) {
                    added.delete(element);
                }
                console.log(added);
                const removed = new Set(oldValue);
                for (const element of newValue) {
                    removed.delete(element);
                }
                console.log(removed);

                for (const entry of added) {
                    const url = new URL(entry);
                    registerContentScript(url);
                    createUrlElement(url);
                }
                for (const entry of removed) {
                    const url = new URL(entry);
                    const elementToRemove = document.getElementById(urlToId(url));
                    elementToRemove?.remove();
                }

                emptyElementIsShown(newValue.length === 0);
            }
        }
    });
}






async function addUrlToList(url) {
    const data = await chrome.storage.sync.get({urlList: []});
    const urlSet = new Set(data.urlList);
    console.log('old', urlSet);

    urlSet.add(urlToEntry(url));
    console.log('new', urlSet);

    chrome.storage.sync.set({urlList: [...urlSet]});
}

async function removeUrlFromList(urlEntry) {
    const data = await chrome.storage.sync.get({urlList: []});
    const urlSet = new Set(data.urlList);
    console.log('old', urlSet);

    if (urlSet.delete(urlEntry)) {
        chrome.storage.sync.set({urlList: [...urlSet]});
    }
    console.log('new', urlSet);
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

function emptyElementIsShown(isShown) {
    document.getElementById('empty-url-item').style.display = isShown ? 'block' : 'none';
}

function urlToId(url) {
    return 'url-list-item-' + url.hostname.replaceAll('.', '_');
}

function urlToEntry(url) {
    return `${url.protocol}//${url.hostname}/`;
}

function getFaviconURL(url) {
    // chrome-extension://EXTENSION_ID/_favicon/?pageUrl=https://www.youtube.com/&size=32
    const favIconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
    favIconUrl.searchParams.set('pageUrl', url); // this encodes the URL as well
    favIconUrl.searchParams.set('size', '32');
    return favIconUrl.toString();
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
        js: ["content.js"],
        css: ['content.css'],
        persistAcrossSessions: true,
        matches: [urlEntry + '*'],
        runAt: "document_idle",
    }])
    .then(() => console.log("Registered script for " + urlEntry))
    .catch((err) => console.warn("Could not register script!", err));
}



/* init popup page */
void INIT_EXTENSION();
