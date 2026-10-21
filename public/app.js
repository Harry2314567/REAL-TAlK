document.addEventListener('DOMContentLoaded', () => {
  const fullText = "R34L_T4LK";
  let configMode = 'wire_bt';
  let fixedUserId = 'R34L-USR-' + Math.floor(1000 + Math.random() * 9000);
  let linkedUsers = [];

  // DOM Elements
  const loadingScreen = document.getElementById('loading-screen');
  const loadingText = document.getElementById('loading-text');
  const talkBtn = document.getElementById('talk-btn');
  const talkLabel = document.getElementById('talk-label');
  const statusBadge = document.querySelector('.status-badge');
  const userIdText = document.getElementById('user-id-text');

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

  // Display Generated User Identity
  if (userIdText) userIdText.innerText = fixedUserId;

  // 1. Establish WebSocket Connection for Audio Stream
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    if (statusBadge) {
      statusBadge.innerText = 'ONLINE';
      statusBadge.style.color = '#00ff66';
    }
    audioEngine.init(ws);
  };

  ws.onclose = () => {
    if (statusBadge) {
      statusBadge.innerText = 'OFFLINE';
      statusBadge.style.color = '#ff3366';
    }
  };

  ws.onmessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      audioEngine.playReceivedAudio(event.data);
    }
  };

  // 2. Animated Loading Screen
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
      setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
    }
  }, 120);

  // 3. Functional Hold to Talk Controls
  const startTalk = (e) => {
    if (e) e.preventDefault();
    talkBtn.classList.add('active');
    talkLabel.innerText = 'TRANSMITTING...';
    audioEngine.startTransmission();
  };

  const stopTalk = (e) => {
    if (e) e.preventDefault();
    talkBtn.classList.remove('active');
    talkLabel.innerText = 'HOLD TO TALK';
    audioEngine.stopTransmission();
  };

  talkBtn.addEventListener('mousedown', startTalk);
  talkBtn.addEventListener('mouseup', stopTalk);
  talkBtn.addEventListener('mouseleave', stopTalk);

  talkBtn.addEventListener('touchstart', startTalk, { passive: false });
  talkBtn.addEventListener('touchend', stopTalk);
  talkBtn.addEventListener('touchcancel', stopTalk);

  // 4. Slide Drawer Handlers
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

  // 5. Hardware Mode and Volume Control Events
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

  // 6. QR Matrix Generation & Friend Linking
  const qrMatrix = document.querySelector('.qr-matrix');
  if (qrMatrix) {
    qrMatrix.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const dot = document.createElement('div');
      dot.classList.add('qr-dot');
      if (i % 2 === 0 || i % 7 === 0) dot.classList.add('cyan');
      qrMatrix.appendChild(dot);
    }
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
      addUser('R34L-USR-' + Math.floor(1000 + Math.random() * 9000));
      scanQrBtn.innerText = '📷 SCAN USER QR';
    }, 1200);
  });
});
