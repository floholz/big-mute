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

let minimized = false;
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
    minimized = !minimized;
    bigMuteMinimize.innerText = minimized ? 'unfold_more' : 'unfold_less';

    if (minimized) {
        bigMuteButton.classList.add('minimized');
        bigMuteContent.classList.add('minimized');
        bigMuteMinimize.classList.add('minimized');
    } else {
        bigMuteButton.classList.remove('minimized');
        bigMuteContent.classList.remove('minimized');
        bigMuteMinimize.classList.remove('minimized');
    }

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

document.addEventListener('mouseenter', () => {
    getCurrentMuteState().then(setMuteButtonContent);
});



let timer;
document.addEventListener('mousemove', function() {
    if (timer) return;

    bigMuteMainElement.classList.add('moving');
    clearTimeout(timer)
    timer = setTimeout(() => {
        bigMuteMainElement.classList.remove('moving')
        timer = null;
    }, 500);
});

getCurrentMuteState().then(setMuteButtonContent);
placeContainerInRootElement();
dragElement(bigMuteMainElement, bigMuteContainer);


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

        console.log(e.target.id, e.type);
        clickIsHandledByDrag = true;

        // get the mouse cursor position at startup:
        initPosX = prevPosX = e.clientX;
        initPosY = prevPosY = e.clientY;
        document.addEventListener('mouseup', closeDragElement, true);
        // call a function whenever the cursor moves:
        document.addEventListener('mousemove', elementDrag, true);
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log(e.target.id, e.type);
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
        console.log(e.target.id, e.type);

        if (mouseDragged && dist > 5) {
            console.log('btn dragged');
            e.preventDefault();
            e.stopImmediatePropagation();
        } else {
            console.log('btn clicked');
            // toggleMuteState();
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
    const response = await chrome.runtime.sendMessage({bigMute: {toggleMute: true}});
    setMuteButtonContent(response);
}

async function getCurrentMuteState() {
    return await chrome.runtime.sendMessage({bigMute: {getMuteState: true}});
}
