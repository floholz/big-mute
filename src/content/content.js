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

const bigMuteButton = document.createElement('button');
bigMuteButton.id = 'bigMute_button';
bigMuteButton.classList.add('material-symbols-outlined');
bigMuteButton.innerText = 'volume_up';

const bigMuteContainer = document.createElement('div');
bigMuteContainer.id = 'bigMute_container';
bigMuteContainer.append(bigMuteButton);

document.addEventListener('fullscreenchange', () => {
    placeContainerInRootElement();
});

document.addEventListener('mouseenter', () => {
    getCurrentMuteState().then(setMuteButtonContent);
});



let timer;
document.addEventListener('mousemove', function() {
    if (timer) return;

    bigMuteButton.classList.add('moving');
    clearTimeout(timer)
    timer = setTimeout(() => {
        bigMuteButton.classList.remove('moving')
        timer = null;
    }, 500);
});

getCurrentMuteState().then(setMuteButtonContent);
placeContainerInRootElement();
dragElement(bigMuteButton);


function placeContainerInRootElement() {
    const fullscreenRoot = document.fullscreenElement;
    if (fullscreenRoot) {
        fullscreenRoot.append(bigMuteContainer);
    } else {
        document.body.append(bigMuteContainer);
    }
}

function dragElement(element) {
    let initPosX = 0, initPosY = 0,
        nextPosX = 0, nextPosY = 0,
        prevPosX = 0, prevPosY = 0;
    let mouseDragged = false;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        // only listen for mouse1 events
        if (e.buttons !== 1) return;

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
        mouseDragged = true;

        const dragArea = bigMuteContainer.getClientRects()[0];
        const dragHandle = bigMuteButton.getClientRects()[0];

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

    function closeDragElement() {
        const dist = Math.sqrt(Math.pow(initPosX - prevPosX, 2) + Math.pow(initPosY - prevPosY, 2));

        if (mouseDragged && dist > 5) {
            console.log('btn dragged');
        } else {
            console.log('btn clicked');
            toggleMuteState();
        }

        // stop moving when mouse button is released:
        // document.onmouseup = null;
        // document.onmousemove = null;
        document.removeEventListener('mouseup', closeDragElement, true);
        document.removeEventListener('mousemove', elementDrag, true);
        mouseDragged = false;
    }
}

function setMuteButtonContent(muted) {
    bigMuteButton.innerHTML = muted ? 'volume_off' : 'volume_up';
}

async function toggleMuteState() {
    console.log('toggle mute state');
    const response = await chrome.runtime.sendMessage({bigMute: {toggleMute: true}});
    bigMuteButton.innerHTML = response ? 'volume_off' : 'volume_up';
}

async function getCurrentMuteState() {
    return await chrome.runtime.sendMessage({bigMute: {getMuteState: true}});
}
