(() => {
  const prefix = 'lorne-editor-draft-v1:';
  const form = document.querySelector('#post-editor-form');
  const status = document.querySelector('#draft-status');
  let active = null, timer = null, last = '', failed = false;
  const values = () => ({ title: form.elements.title.value, category: form.elements.category.value, body: form.elements.body.value });
  const message = text => { status.textContent = text; };
  function save() {
    clearTimeout(timer);
    if (active === null) return true;
    const fields = values(), serialized = JSON.stringify(fields);
    if (serialized === last && !failed) return true;
    try {
      const savedAt = new Date().toISOString();
      localStorage.setItem(prefix + active, JSON.stringify({ ...fields, savedAt }));
      localStorage.setItem(prefix + 'last', active);
      last = serialized; failed = false;
      message(`草稿已自动保存到本机 · ${new Date(savedAt).toLocaleTimeString('zh-CN')}`);
      return true;
    } catch {
      failed = true;
      message('本机草稿保存失败，请尽快复制正文或保存文章，暂勿关闭页面。');
      return false;
    }
  }
  function schedule() {
    if (active === null || JSON.stringify(values()) === last) return;
    clearTimeout(timer);
    message('正在保存草稿…');
    timer = setTimeout(save, 400);
  }
  function begin(id) {
    clearTimeout(timer); active = String(id ?? 'new'); failed = false;
    last = JSON.stringify(values());
    message('自动保存已开启 · 草稿仅保存在当前浏览器，点击发布或保存修改才会更新正式文章。');
    try {
      localStorage.setItem(prefix + 'last', active);
      const draft = JSON.parse(localStorage.getItem(prefix + active) || 'null');
      if (draft && typeof draft.title === 'string' && typeof draft.body === 'string' && [...form.elements.category.options].some(option => option.value === draft.category)) {
        for (const name of ['title', 'category', 'body']) form.elements[name].value = draft[name];
        last = JSON.stringify(values());
        message('已恢复上次未提交的本机草稿 · 继续编辑即可自动保存。');
      }
    } catch { failed = true; message('无法读取本机草稿，请勿依赖自动保存；完成后请及时保存文章。'); }
  }
  function lastId() { try { return localStorage.getItem(prefix + 'last') || 'new'; } catch { return 'new'; } }
  function complete(id, submitted) {
    if (String(id ?? 'new') !== active) return;
    save();
    if (JSON.stringify(values()) === JSON.stringify(submitted)) {
      try { localStorage.removeItem(prefix + active); } catch { message('文章已提交，但本机旧草稿未能清除。'); }
    }
    clearTimeout(timer); active = null;
  }
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('beforeunload', event => {
    if (!save() || (active !== null && /<!-- image-upload:/.test(form.elements.body.value))) {
      event.preventDefault(); event.returnValue = '';
    }
  });
  window.EditorDrafts = { begin, save, schedule, complete, lastId, values, get active() { return active; } };
})();
