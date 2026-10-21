document.addEventListener('DOMContentLoaded', () => {
  const fullText = "R34L_T4LK";
  let configMode = 'wire_bt';
  let fixedUserId = 'R34L-USR-9042';
  let linkedUsers = ['R34L-USR-1104'];

  const loadingScreen = document.getElementById('loading-screen');
  const loadingText = document.getElementById('loading-text');
  const talkBtn = document.getElementById('talk-btn');
  const talkLabel = document.getElementById('talk-label');

  const gearBtn = document.getElementById('gear-btn');
  const dualAudioBtn = document.getElementById('dual-audio-btn');
  const audioDrawer = document.getElementById('audio-drawer');
  const audioBackdrop = document.getElementById('audio-backdrop');
  const closeAudioBtn = document.getElementById('close-audio-btn');

  const settingsDrawer = document.getElementById('settings-drawer');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const closeSettingsBtn = document.getElementById('close-settings-btn');

  const modeWireBt = document.getElementById('mode-wire-bt');
  const modeBtBt = document.getElementById('mode-bt-bt');
  const devALabel = document.getElementById('device-a-label');
  const devBLabel = document.getElementById('device-b-label');
  const volA = document.getElementById('vol-a');
  const volB = document.getElementById('vol-b');

  const eqStudio = document.getElementById('eq-studio');
  const eqBass = document.getElementById('eq-bass');
  const eqTreble = document.getElementById('eq-treble');

  const scanQrBtn = document.getElementById('scan-qr-btn');
  const manualIdInput = document.getElementById('manual-id-input');
  const linkIdBtn = document.getElementById('link-id-btn');
  const linkedUsersList = document.getElementById('linked-users-list');

  // Loading animation
  fullText.split('').forEach((char) => {
    const span = document.createElement('span');
    span.classList.add('char');
    span.innerText = char;
    loadingText.appendChild(span);
  });

  const charSpans = loadingText.querySelectorAll('.char');
  let charIdx = 0;
  const timer = setInterval(() => {
    if (charIdx < charSpans.length) {
      charSpans[charIdx].classList.add('active');
      charIdx++;
    } else {
      clearInterval(timer);
      setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);
    }
  }, 150);

  // Talk Button
  const startTalk = () => {
    audioEngine.init();
    talkBtn.classList.add('active');
    talkLabel.innerText = 'TRANSMITTING...';
  };

  const stopTalk = () => {
    talkBtn.classList.remove('active');
    talkLabel.innerText = 'HOLD TO TALK';
  };

  talkBtn.addEventListener('mousedown', startTalk);
  talkBtn.addEventListener('mouseup', stopTalk);
  talkBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startTalk(); });
  talkBtn.addEventListener('touchend', stopTalk);

  // Audio Drawer Toggles
  dualAudioBtn.addEventListener('click', () => {
    audioDrawer.classList.add('open');
    audioBackdrop.classList.add('open');
  });

  const closeAudio = () => {
    audioDrawer.classList.remove('open');
    audioBackdrop.classList.remove('open');
  };

  closeAudioBtn.addEventListener('click', closeAudio);
  audioBackdrop.addEventListener('click', closeAudio);

  // Settings Drawer Toggles
  gearBtn.addEventListener('click', () => {
    settingsDrawer.classList.add('open');
    settingsBackdrop.classList.add('open');
  });

  const closeSettings = () => {
    settingsDrawer.classList.remove('open');
    settingsBackdrop.classList.remove('open');
  };

  closeSettingsBtn.addEventListener('click', closeSettings);
  settingsBackdrop.addEventListener('click', closeSettings);

  // Hardware Modes
  modeWireBt.addEventListener('click', () => {
    configMode = 'wire_bt';
    modeWireBt.classList.add('active');
    modeBtBt.classList.remove('active');
    devALabel.innerText = 'Analog/Type-C Wired Headset';
    devBLabel.innerText = 'Bluetooth Wireless Audio';
    dualAudioBtn.innerText = 'DUAL AUDIO // ROUTE TO WIRE + BT';
  });

  modeBtBt.addEventListener('click', () => {
    configMode = 'bt_bt';
    modeBtBt.classList.add('active');
    modeWireBt.classList.remove('active');
    devALabel.innerText = 'Bluetooth Headset Alpha';
    devBLabel.innerText = 'Bluetooth Headset Beta';
    dualAudioBtn.innerText = 'DUAL AUDIO // ROUTE TO 2x BT';
  });

  volA.addEventListener('input', () => audioEngine.setVolume(volA.value, volB.value));
  volB.addEventListener('input', () => audioEngine.setVolume(volA.value, volB.value));

  const setEqActive = (btn) => {
    [eqStudio, eqBass, eqTreble].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };

  eqStudio.addEventListener('click', () => { setEqActive(eqStudio); audioEngine.setPreset('studio'); });
  eqBass.addEventListener('click', () => { setEqActive(eqBass); audioEngine.setPreset('bass'); });
  eqTreble.addEventListener('click', () => { setEqActive(eqTreble); audioEngine.setPreset('treble'); });

  // QR matrix render
  const qrMatrix = document.querySelector('.qr-matrix');
  for (let i = 0; i < 25; i++) {
    const dot = document.createElement('div');
    dot.classList.add('qr-dot');
    if (i % 2 === 0 || i % 7 === 0) dot.classList.add('cyan');
    qrMatrix.appendChild(dot);
  }

  const renderLinkedUsers = () => {
    linkedUsersList.innerHTML = '';
    if (linkedUsers.length === 0) {
      linkedUsersList.innerHTML = '<span style="font-size:0.75rem; color:#444;">No linked users yet.</span>';
      return;
    }

    linkedUsers.forEach(id => {
      const row = document.createElement('div');
      row.classList.add('linked-item');
      row.innerHTML = `<span>${id}</span><button class="unlink-btn">UNLINK</button>`;
      row.querySelector('.unlink-btn').addEventListener('click', () => {
        linkedUsers = linkedUsers.filter(item => item !== id);
        renderLinkedUsers();
      });
      linkedUsersList.appendChild(row);
    });
  };

  renderLinkedUsers();

  const addUser = (id) => {
    if (id && !linkedUsers.includes(id) && id !== fixedUserId) {
      linkedUsers.push(id);
      renderLinkedUsers();
      manualIdInput.value = '';
    }
  };

  linkIdBtn.addEventListener('click', () => addUser(manualIdInput.value.trim()));
  scanQrBtn.addEventListener('click', () => {
    scanQrBtn.innerText = 'SCANNING QR CAM...';
    setTimeout(() => {
      addUser('R34L-USR-8821');
      scanQrBtn.innerText = '📷 SCAN USER QR';
    }, 1500);
  });
});
