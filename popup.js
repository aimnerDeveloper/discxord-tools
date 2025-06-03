let tokenInput; // declared globally so it's accessible everywhere

document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.querySelector('#submit');
  const messageBox = document.getElementById('messageBox');
  const copyTokenButton = document.querySelector('#copy-token-button');
  tokenInput = document.querySelector('#token'); // assign here
  const tokenNameInput = document.querySelector('#tokenName');
  const saveTokenBtn = document.querySelector('#save-token');
  const tokenSelect = document.querySelector('#tokenSelect');

  messageBox.style.display = 'none';
  copyTokenButton.classList.add('disabled');

  checkCorrectTab();
  loadSavedTokens();

  // Save Token button
  saveTokenBtn.addEventListener('click', () => {
    const name = tokenNameInput.value.trim() || `Token-${Date.now()}`;
    const token = tokenInput.value.trim();
    if (!token) return alert("Please enter a token to save.");

    chrome.storage.local.get('tokens', (data) => {
      const tokens = data.tokens || {};
      tokens[name] = token;
      chrome.storage.local.set({ tokens }, () => {
        const option = document.createElement('option');
        option.value = token;
        option.text = name;
        tokenSelect.appendChild(option);
        tokenNameInput.value = '';
        alert("Token saved successfully.");
      });
    });
  });

  // Select token from dropdown
  tokenSelect.addEventListener('change', () => {
    const selected = tokenSelect.value;
    if (selected) {
      tokenInput.value = selected;
    }
  });

  // Login button
  submitButton.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if (!token) {
      tokenInput.style.border = '1px solid #ee4445';
      showMessage('Please enter your Discord token.', true);
    } else {
      tokenInput.style.border = '1px solid #222428';
      verifyToken(token);
    }
  });
});

function checkCorrectTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    if (!currentUrl || !currentUrl.includes('https://discord.com')) {
      showMessage('Please navigate to discord.com/login to use this extension.', true);
    }
  });
}

function verifyToken(token) {
  console.log("Verifying token:", token); // Debug

  fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
  })
    .then((response) => {
      console.log("Response status:", response.status); // Debug
      if (response.ok) {
        tokenInput.style.border = '1px solid #00ff15';
        injectToken(token);
        showMessage('Token is valid! Logging in...', false);
      } else {
        tokenInput.style.border = '1px solid #ee4445';
        showMessage('Invalid token. Please check.', true);
      }
    })
    .catch((err) => {
      console.error("Validation error:", err);
      showMessage('An error occurred during validation.', true);
    });
}

function injectToken(token) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (token) => {
        localStorage.setItem('token', `"${token}"`);
        window.location.href = 'https://discord.com/channels/@me';
      },
      args: [token]
    });
  });
}

function showMessage(message, isError) {
  const box = document.getElementById('messageBox');
  box.textContent = message;
  box.style.display = 'block';
  box.style.backgroundColor = isError ? '#ee4445' : '#00ff15';

  const closeButton = document.createElement('span');
  closeButton.className = 'close-button';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => box.style.display = 'none';
  box.appendChild(closeButton);

  setTimeout(() => {
    if (box.contains(closeButton)) box.removeChild(closeButton);
    box.style.display = 'none';
  }, 5000);
}

function loadSavedTokens() {
  const select = document.getElementById('tokenSelect');
  chrome.storage.local.get('tokens', (data) => {
    const tokens = data.tokens || {};
    for (const name in tokens) {
      const option = document.createElement('option');
      option.text = name;
      option.value = tokens[name];
      select.appendChild(option);
    }
  });
}
