/** 同源 VoceChat iframe 内发送文本（需 H5 dev 代理或生产反代到同域） */

function getIframeDocument(iframeEl) {
  if (!iframeEl) {
    return null;
  }
  try {
    return iframeEl.contentDocument || iframeEl.contentWindow?.document || null;
  } catch {
    return null;
  }
}

export function findVoceChatTextarea(iframeEl) {
  const doc = getIframeDocument(iframeEl);
  if (!doc) {
    return null;
  }
  return doc.querySelector('aside textarea') || doc.querySelector('textarea');
}

export function isVoceIframeSameOrigin(iframeEl) {
  return Boolean(getIframeDocument(iframeEl));
}

function setTextareaValue(textarea, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(textarea, value);
  } else {
    textarea.value = value;
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function clickVoceSendButton(doc) {
  const buttons = Array.from(doc.querySelectorAll('aside button'));
  const sendBtn = buttons.find((btn) => {
    if (btn.disabled) {
      return false;
    }
    return Boolean(btn.querySelector('svg')) && !btn.querySelector('input[type="file"]');
  });
  sendBtn?.click();
  return Boolean(sendBtn);
}

/** @returns {boolean} 是否已触发发送 */
export function sendTextViaVoceIframe(iframeEl, content) {
  const text = String(content || '').trim();
  if (!text) {
    return false;
  }
  const textarea = findVoceChatTextarea(iframeEl);
  if (!textarea) {
    return false;
  }
  textarea.focus();
  setTextareaValue(textarea, text);
  if (clickVoceSendButton(textarea.ownerDocument)) {
    return true;
  }
  textarea.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    }),
  );
  return true;
}

function findVoceChatMessageArea(iframeEl) {
  const doc = getIframeDocument(iframeEl);
  if (!doc) {
    return null;
  }
  return (
    doc.querySelector('#MESSAGE_LIST_CONTAINER') ||
    doc.querySelector('aside main') ||
    doc.querySelector('aside')
  );
}

/** 等待 iframe 内消息区就绪（不依赖被裁掉的输入框） */
export function waitForVoceChatMessageArea(iframeEl, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => {
      const area = findVoceChatMessageArea(iframeEl);
      if (area) {
        resolve(area);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('VoceChat 会话区未就绪'));
        return;
      }
      setTimeout(poll, 300);
    };
    poll();
  });
}

export function waitForVoceChatTextarea(iframeEl, timeoutMs = 25000) {
  return waitForVoceChatMessageArea(iframeEl, timeoutMs);
}
