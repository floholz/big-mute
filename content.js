console.log('BIG_MUTE injected');

const bigMuteContainer = document.createElement('div');
bigMuteContainer.id = 'bigMute_container';

const bigMuteButton = document.createElement('button');
bigMuteButton.id = 'bigMute_button';
bigMuteButton.innerHTML = 'MUTE'
bigMuteButton.onclick = () => console.log('BIG_MUTE muted');


bigMuteContainer.append(bigMuteButton);
document.body.append(bigMuteContainer);
