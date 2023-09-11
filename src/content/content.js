console.log('BIG_MUTE injected');

const matSymLinkElement = document.createElement('link');
matSymLinkElement.rel = 'stylesheet';
matSymLinkElement.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0';
document.head.append(matSymLinkElement);

const bigMuteContainer = document.createElement('div');
bigMuteContainer.id = 'bigMute_container';

const bigMuteButton = document.createElement('button');
bigMuteButton.id = 'bigMute_button';
bigMuteButton.classList.add('material-symbols-outlined');
bigMuteButton.innerText = 'volume_up';


bigMuteContainer.append(bigMuteButton);
document.body.append(bigMuteContainer);

let timer;
document.onmousemove = function(e) {
    e = e || window.event;
    bigMuteButton.classList.add('moving');
    clearTimeout(timer)
    timer = setTimeout(() => {
        bigMuteButton.classList.remove('moving')
    }, 200);
}

dragElement(bigMuteButton);

function dragElement(element) {
    let nextPosX = 0, nextPosY = 0, prevPosX = 0, prevPosY = 0;
    let mouseDragged = false;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        // mousedownFired = true;

        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        prevPosX = e.clientX;
        prevPosY = e.clientY;
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
        if (!mouseDragged) {
            // click event
            console.log('bigMute', 'clicked');
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

async function toggleMuteState() {
    const response = await chrome.runtime.sendMessage({bigMute: {toggleMute: true}});
    bigMuteButton.innerHTML = response ? 'volume_off' : 'volume_up';
}
