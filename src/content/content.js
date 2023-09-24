const overrideLog = console.log;
console.log = function () {
    // 1. Convert args to a normal array
    const args = Array.from( arguments );
    // 2. Prepend log prefix log string
    args.unshift('[BIG_MUTE]');
    // 3. Pass along arguments to console.log
    overrideLog.apply(console, args);
}

console.log('injected');

const matSymLinkElement = document.createElement('link');
matSymLinkElement.rel = 'stylesheet';
matSymLinkElement.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0';
document.head.append(matSymLinkElement);

const bigMuteMinimize = document.createElement('button');
bigMuteMinimize.id = 'bigMute_minimize';
bigMuteMinimize.classList.add('material-symbols-outlined');
bigMuteMinimize.innerText = 'unfold_less';
bigMuteMinimize.onmouseup = (e) =>  {
    if (e.button === 2) return; // ignore mouse2 events
    if (clickIsHandledByDrag) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    console.log('bigMuteMinimize clicked');
    setMinimized();
    e.preventDefault();
    e.stopImmediatePropagation();
};

const bigMuteContent = document.createElement('span');
bigMuteContent.id = 'bigMute_content';
bigMuteContent.innerText = 'volume_up';
bigMuteContent.onmouseup = (e) => {
    if (e.button === 2) return; // ignore mouse2 events
    if (clickIsHandledByDrag) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
};

const bigMuteButton = document.createElement('button');
bigMuteButton.id = 'bigMute_button';
bigMuteButton.classList.add('material-symbols-outlined');
bigMuteButton.onmouseup = (e) => {
    if (e.button === 2) return; // ignore mouse2 events
    if (clickIsHandledByDrag) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }
    console.log('bigMuteButton clicked');
    toggleMuteState();
    e.preventDefault();
    e.stopImmediatePropagation();
}
bigMuteButton.append(bigMuteContent);

const bigMuteMainElement = document.createElement('div');
bigMuteMainElement.id = 'bigMute_main';
bigMuteMainElement.append(bigMuteButton);
bigMuteMainElement.append(bigMuteMinimize);

const bigMuteContainer = document.createElement('div');
bigMuteContainer.id = 'bigMute_container';
bigMuteContainer.append(bigMuteMainElement);

document.addEventListener('fullscreenchange', () => {
    placeContainerInRootElement();
});

document.addEventListener('mouseenter', async () => {
    await syncMuteState();
});




let timer;
document.addEventListener('mousemove', function() {
    if (timer) return;

    bigMuteMainElement.classList.add('moving');
    clearTimeout(timer)
    timer = setTimeout(() => {
        bigMuteMainElement.classList.remove('moving')
        timer = null;
    }, 650);
});

placeContainerInRootElement();
dragElement(bigMuteMainElement, bigMuteContainer);
initBigMuteOptions();


async function setMinimized(minimized, saveChanges = true) {
    const isMinimized = bigMuteContainer.classList.contains('minimized');

    if (minimized === isMinimized) {
        return;
    }

    if (minimized === null || minimized === undefined) {
        minimized = !isMinimized;
    }

    if (minimized) {
        bigMuteContainer.classList.add('minimized');
        bigMuteMinimize.innerText = 'unfold_more';
    } else {
        bigMuteContainer.classList.remove('minimized');
        bigMuteMinimize.innerText = 'unfold_less';
    }

    if (saveChanges) {
        await setOptions({minimized: minimized});
    }
}

function placeContainerInRootElement() {
    const fullscreenRoot = document.fullscreenElement;
    if (fullscreenRoot) {
        fullscreenRoot.append(bigMuteContainer);
    } else {
        document.body.append(bigMuteContainer);
    }
}

let clickIsHandledByDrag = false;
function dragElement(element, container) {
    let initPosX = 0, initPosY = 0,
        nextPosX = 0, nextPosY = 0,
        prevPosX = 0, prevPosY = 0;
    let mouseDragged = false;
    let target = element;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopImmediatePropagation();

        // only listen for mouse1 events
        if (e.buttons !== 1) return;
        target = e.target;

        clickIsHandledByDrag = true;

        // get the mouse cursor position at startup:
        initPosX = prevPosX = e.clientX;
        initPosY = prevPosY = e.clientY;
        document.addEventListener('mouseup', closeDragElement, true);
        // call a function whenever the cursor moves:
        document.addEventListener('mousemove', elementDrag, true);
    }

    async function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopImmediatePropagation();
        mouseDragged = true;

        const dragArea = container.getClientRects()[0];
        const dragHandle = element.getClientRects()[0];

        // calculate the new cursor position:
        const changeX = prevPosX - e.clientX;
        const changeY = prevPosY - e.clientY;
        if (
            !(changeX < 0 && e.clientX < dragHandle.width/2 - dragArea.left) &&
            !(changeX > 0 && e.clientX > dragArea.right - dragHandle.width/2)
        ) {
            nextPosX = changeX;
        }
        if (
            !(changeY < 0 && e.clientY < dragHandle.height/2 - dragArea.top) &&
            !(changeY > 0 && e.clientY > dragArea.bottom - dragHandle.height/2)
        ) {
            nextPosY = changeY;
        }
        prevPosX = e.clientX;
        prevPosY = e.clientY;

        // set the element's new position:
        let top = element.offsetTop - nextPosY;
        let left = element.offsetLeft - nextPosX;
        top = Math.max(dragArea.top, Math.min(top, dragArea.bottom - dragHandle.height));
        left = Math.max(dragArea.left, Math.min(left, dragArea.right - dragHandle.width));
        element.style.top = top + "px";
        element.style.left = left + "px";
    }

    function closeDragElement(e) {
        const dist = Math.sqrt(Math.pow(initPosX - prevPosX, 2) + Math.pow(initPosY - prevPosY, 2));

        if (mouseDragged && dist > 5) {
            console.log('btn dragged');

            setOptions({pos: {x: element.style.left, y: element.style.top}}).then(r => {
                console.log(r?.pos ? `position saved ${JSON.stringify(r.pos)}` : "couldn't save position");
            });

            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            console.log('btn clicked');
            target.click();
        }

        // stop moving when mouse button is released:
        document.removeEventListener('mouseup', closeDragElement, true);
        document.removeEventListener('mousemove', elementDrag, true);
        mouseDragged = false;
        clickIsHandledByDrag = false;
    }
}

function setMuteButtonContent(muted) {
    bigMuteContent.innerHTML = muted ? 'volume_off' : 'volume_up';
}

async function toggleMuteState() {
    console.log('toggle mute state');
    const response = await chrome.runtime.sendMessage({bigMute: {setOptions: {muted: 'toggle'}}});
    if (response) {
        setMuteButtonContent(response.muted);
    }
}

async function setOptions(options) {
    return await chrome.runtime.sendMessage({bigMute: {setOptions: options}});
}

async function initBigMuteOptions() {
    const options = await chrome.runtime.sendMessage({bigMute: {getOptions: true}});

    if (options) {
        // set position
        bigMuteMainElement.style.left = options.pos.x;
        bigMuteMainElement.style.top = options.pos.y;

        // set mute state
        await syncMuteState();

        // set minimized state
        await setMinimized(options.minimized, false);
    }
}

async function syncMuteState() {
    const muteState = await chrome.runtime.sendMessage({bigMute: {syncMuteState: true}});
    if (muteState !== undefined){
        setMuteButtonContent(muteState);
    }
}
