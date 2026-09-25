/* Image layout is stored alongside Markdown, so edits survive saving and reopening. */
(() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const metadataPattern = /^<!--blog-image:(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)(?::([a-zA-Z0-9-]+))?-->/;

  function inspect(source) {
    if (!window.marked?.lexer) return { images: [], blocks: [] };
    const tokens = window.marked.lexer(source, { gfm: true, breaks: true });
    const images = [];
    const blocks = [];
    function visit(list, start, limit, top = false) {
      let cursor = start;
      for (const token of list || []) {
        if (!token.raw) continue;
        const offset = source.indexOf(token.raw, cursor);
        if (offset < 0 || offset + token.raw.length > limit) continue;
        const end = offset + token.raw.length;
        if (top && !['space', 'def'].includes(token.type)) blocks.push(offset);
        if (token.type === 'image') {
          const metadata = source.slice(end).match(metadataPattern);
          const width = metadata ? clamp(Number(metadata[1]), 10, 100) : null;
          const left = metadata ? clamp(Number(metadata[2]), 0, 100 - width) : 0;
          images.push({ start: offset, end: end + (metadata?.[0].length || 0), raw: token.raw,
            href: token.href, alt: token.text, title: token.title, width, left, row: metadata?.[3] || null });
        } else if (token.tokens) visit(token.tokens, offset, end);
        else if (token.items) visit(token.items, offset, end);
        cursor = end;
      }
    }
    visit(tokens, 0, source.length, true);
    return { images, blocks: [...blocks, source.length] };
  }

  function rowMembers(source, model, item) {
    const index = model.images.indexOf(item);
    let first = index, last = index;
    if (item.row) {
      while (first > 0 && model.images[first - 1].row === item.row && !source.slice(model.images[first - 1].end, model.images[first].start).trim()) first--;
      while (last + 1 < model.images.length && model.images[last + 1].row === item.row && !source.slice(model.images[last].end, model.images[last + 1].start).trim()) last++;
    }
    return model.images.slice(first, last + 1);
  }

  const serialize = (item, width = item.width ?? 100, left = item.left, row = item.row) => `${item.raw}<!--blog-image:${width}:${left}${row ? `:${row}` : ''}-->`;

  function joinRow(source, item, target, before = false) {
    const model = inspect(source);
    item = model.images.find(image => image.start === item.start);
    target = model.images.find(image => image.start === target.start);
    if (!item || !target || item === target) return source;
    const group = rowMembers(source, model, target);
    const members = group.filter(image => image !== item);
    members.splice(members.indexOf(target) + (before ? 0 : 1), 0, item);
    const row = target.row || `row-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const replacement = members.map(image => serialize(image, image === item || group.length === 1 ? 100 : image.width ?? 100, image === item || group.length === 1 ? 0 : image.left, row)).join('\n\n');
    const edits = [{ start: group[0].start, end: group.at(-1).end, text: replacement }];
    if (!group.includes(item)) edits.push({ start: item.start, end: item.end, text: '' });
    edits.sort((a, b) => b.start - a.start);
    for (const edit of edits) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
    return source;
  }

  function separateRow(source, item) {
    const model = inspect(source);
    const current = model.images.find(image => image.start === item.start);
    if (!current) return source;
    const group = rowMembers(source, model, current);
    const text = group.filter(image => image !== current).map(image => serialize(image)).join('\n\n');
    return source.slice(0, group[0].start) + text + `\n\n${serialize(current, 100, 0, null)}\n\n` + source.slice(group.at(-1).end);
  }

  function prepare(source, editing = false) {
    const model = inspect(source);
    const imageHTML = item => `<img src="${escape(item.href)}" alt="${escape(item.alt)}"${item.title ? ` title="${escape(item.title)}"` : ''}${editing ? ` data-blog-image="${model.images.indexOf(item)}"` : ''}${item.width !== null ? ` class="laid-out-image" style="width:${item.width}%;margin-left:${item.left}%;height:auto"` : ''}>`;
    const edits = [];
    for (let index = 0; index < model.images.length;) {
      const group = rowMembers(source, model, model.images[index]);
      edits.push({ start: group[0].start, end: group.at(-1).end,
        text: group.length > 1 ? `<span class="blog-image-row">${group.map(item => `<span class="blog-image-cell">${imageHTML(item)}</span>`).join('')}</span>` : imageHTML(group[0]) });
      index += group.length;
    }
    if (editing) {
      const ranges = [...edits];
      for (const offset of model.blocks) edits.push({ start: offset, end: offset,
        text: ranges.some(range => offset > range.start && offset < range.end) ? '' : `\n\n<div class="image-drop-anchor" data-source-offset="${offset}"></div>\n\n` });
    }
    // Image replacement comes before a marker at the same source position.
    edits.sort((a, b) => b.start - a.start || b.end - a.end);
    for (const edit of edits) if (edit.text || edit.end > edit.start) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
    return source;
  }

  function replace(source, item, width, left, destination = null) {
    const w = Math.round(clamp(width, 10, 100) * 10) / 10;
    const x = Math.round(clamp(left, 0, 100 - w) * 10) / 10;
    const replacement = serialize(item, w, x, destination === null ? item.row : null);
    if (destination === null || (destination >= item.start && destination <= item.end)) {
      return source.slice(0, item.start) + replacement + source.slice(item.end);
    }
    const remainder = source.slice(0, item.start) + source.slice(item.end);
    const offset = destination > item.end ? destination - (item.end - item.start) : destination;
    return remainder.slice(0, offset) + `\n\n${replacement}\n\n` + remainder.slice(offset);
  }

  let sizeObserver;
  function enhance(preview, editor, refresh) {
    sizeObserver?.disconnect();
    const positions = new Map();
    sizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) positions.get(entry.target)?.();
    });
    const source = editor.value;
    const model = inspect(source);
    preview.querySelectorAll('img[data-blog-image]').forEach(image => {
      const item = model.images[Number(image.dataset.blogImage)];
      if (!item) return;
      image.draggable = false;
      const frame = document.createElement('span');
      frame.className = 'editable-image';
      image.before(frame);
      frame.append(image);
      const controls = document.createElement('span');
      controls.className = 'image-layout-controls';
      controls.innerHTML = '<span>拖到图片旁并排 · 拖右下角缩放</span>';
      const status = document.createElement('span');
      status.className = 'image-layout-size';
      controls.append(status);
      function dimensions() {
        const width = frame.getBoundingClientRect().width || 1;
        return { width: clamp(image.getBoundingClientRect().width / width * 100, 10, 100), left: item.left };
      }
      function save(nextSource) {
        // An upload or another edit may have changed the source during a gesture.
        if (editor.value !== source) { refresh(); return; }
        const scroll = window.scrollY;
        const start = editor.selectionStart;
        editor.setRangeText(nextSource, 0, source.length, 'start');
        editor.setSelectionRange(Math.min(start, editor.value.length), Math.min(start, editor.value.length));
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        window.scrollTo({ top: scroll, behavior: 'instant' });
      }
      function commit(width, left, destination = null) { save(replace(source, item, width, left, destination)); }
      for (const [label, alignment] of [['居左', 0], ['居中', .5], ['居右', 1]]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', () => { const { width } = dimensions(); commit(width, (100 - width) * alignment); });
        controls.append(button);
      }
      const reset = document.createElement('button');
      reset.type = 'button'; reset.textContent = '铺满';
      reset.addEventListener('click', () => commit(100, 0));
      controls.append(reset);
      const previous = model.images[model.images.indexOf(item) - 1];
      if (previous) {
        const join = document.createElement('button');
        join.type = 'button'; join.textContent = '与上一张并排';
        join.addEventListener('click', () => save(joinRow(source, item, previous)));
        controls.append(join);
      }
      if (item.row) {
        const separate = document.createElement('button');
        separate.type = 'button'; separate.textContent = '独占一行';
        separate.addEventListener('click', () => save(separateRow(source, item)));
        controls.append(separate);
      }
      const handle = document.createElement('button');
      handle.type = 'button'; handle.className = 'image-resize-handle';
      handle.setAttribute('aria-label', '缩放图片，左右方向键调整大小');
      handle.title = '拖动等比例缩放；方向键微调';
      frame.append(controls, handle);
      function positionHandle() {
        const parent = frame.getBoundingClientRect();
        const rect = image.getBoundingClientRect();
        handle.style.left = `${rect.right - parent.left}px`;
        handle.style.top = `${rect.bottom - parent.top}px`;
        status.textContent = `${Math.round(rect.width / (parent.width || 1) * 100)}%`;
      }
      image.addEventListener('load', positionHandle);
      positions.set(image, positionHandle);
      positions.set(frame, positionHandle);
      sizeObserver.observe(image);
      sizeObserver.observe(frame);
      requestAnimationFrame(positionHandle);
      handle.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const { width, left } = dimensions();
        commit(clamp(width + (event.key === 'ArrowRight' ? 2 : -2), 10, 100 - left), left);
        preview.querySelectorAll('.image-resize-handle')[Number(image.dataset.blogImage)]?.focus();
      });
      function begin(event, resizing) {
        if (event.button !== 0) return;
        event.preventDefault();
        const rect = image.getBoundingClientRect();
        const area = frame.getBoundingClientRect();
        const initial = dimensions();
        const pointerX = event.clientX;
        const pointerY = event.clientY;
        const scrollY = window.scrollY;
        let width = initial.width, left = initial.left, destination = null, changed = false;
        let activeAnchor = null;
        let snapped = null;
        let rowTarget = null, rowBefore = false, rowElement = null;
        const snapTargets = [
          { left: 0, edge: 0 },
          { left: (100 - width) / 2, edge: .5 },
          { left: 100 - width, edge: 1 }
        ];
        preview.querySelectorAll('img[data-blog-image]').forEach(other => {
          if (other === image) return;
          const bounds = other.getBoundingClientRect();
          for (const edge of [0, 1]) {
            const candidate = (bounds.left + bounds.width * edge - area.left) / area.width * 100 - width * edge;
            if (candidate >= 0 && candidate <= 100 - width) snapTargets.push({ left: candidate, edge });
          }
        });
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        frame.classList.add('is-adjusting');
        const ghost = resizing ? null : image.cloneNode();
        const guide = resizing ? null : document.createElement('div');
        if (guide) {
          guide.className = 'image-alignment-guide';
          guide.hidden = true;
          guide.setAttribute('aria-hidden', 'true');
          document.body.append(guide);
        }
        if (ghost) {
          ghost.removeAttribute('data-blog-image');
          ghost.className = 'image-drag-ghost';
          ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0`;
          document.body.append(ghost);
        }
        function move(e) {
          const dx = e.clientX - pointerX;
          const dy = e.clientY - pointerY;
          if (Math.abs(dx) + Math.abs(dy) < 3 && !changed) return;
          changed = true;
          if (resizing) {
            const scale = Math.abs(dx) >= Math.abs(dy) ? dx : dy * rect.width / (rect.height || 1);
            width = clamp(initial.width + scale / area.width * 100, 10, 100 - left);
            image.style.width = `${width}%`;
            image.style.marginLeft = `${left}%`;
            positionHandle();
          } else {
            left = clamp(initial.left + dx / area.width * 100, 0, 100 - width);
            const distance = target => Math.abs(target.left - left) * area.width / 100;
            // Edges take priority over hysteresis, even when another image sits near an edge.
            if (left * area.width / 100 <= 12) snapped = snapTargets[0];
            else if ((100 - width - left) * area.width / 100 <= 12) snapped = snapTargets[2];
            else if (!snapped || distance(snapped) > 20) {
              snapped = snapTargets.reduce((best, candidate) => distance(candidate) <= 12 && (!best || distance(candidate) < distance(best)) ? candidate : best, null);
            }
            if (snapped) left = snapped.left;
            ghost.style.transform = `translate(${(left - initial.left) / 100 * area.width}px, ${dy}px)`;
            guide.hidden = !snapped;
            if (snapped) {
              const previewBounds = preview.getBoundingClientRect();
              const top = Math.max(0, previewBounds.top);
              guide.style.left = `${area.left + (left + width * snapped.edge) / 100 * area.width}px`;
              guide.style.top = `${top}px`;
              guide.style.height = `${Math.max(0, Math.min(window.innerHeight, previewBounds.bottom) - top)}px`;
            }
            activeAnchor?.classList.remove('is-drop-target');
            rowElement?.classList.remove('is-row-drop-left', 'is-row-drop-right');
            rowTarget = null;
            rowElement = null;
            for (const other of preview.querySelectorAll('img[data-blog-image]')) {
              if (other === image) continue;
              const bounds = other.getBoundingClientRect();
              const cell = other.closest('.blog-image-cell') || other.closest('.editable-image');
              const cellBounds = cell.getBoundingClientRect();
              if (e.clientY > bounds.top + 8 && e.clientY < bounds.bottom - 8 && e.clientX >= cellBounds.left - 12 && e.clientX <= cellBounds.right + 12) {
                rowTarget = model.images[Number(other.dataset.blogImage)];
                rowBefore = e.clientX < bounds.left + bounds.width / 2;
                rowElement = cell;
                cell.classList.add(rowBefore ? 'is-row-drop-left' : 'is-row-drop-right');
                break;
              }
            }
            destination = null;
            const originalTop = rect.top - (window.scrollY - scrollY);
            if (!rowTarget && (e.clientY < originalTop - 20 || e.clientY > originalTop + rect.height + 20)) {
              const anchors = [...preview.querySelectorAll('.image-drop-anchor')];
              activeAnchor = anchors.reduce((best, anchor) => !best || Math.abs(anchor.getBoundingClientRect().top - e.clientY) < Math.abs(best.getBoundingClientRect().top - e.clientY) ? anchor : best, null);
              activeAnchor?.classList.add('is-drop-target');
              if (activeAnchor) destination = Number(activeAnchor.dataset.sourceOffset);
            }
            if (e.clientY < 70) window.scrollBy(0, -18);
            else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 18);
          }
        }
        function finish(e) {
          target.removeEventListener('pointermove', move);
          target.removeEventListener('pointerup', finish);
          target.removeEventListener('pointercancel', cancel);
          target.removeEventListener('lostpointercapture', cancel);
          ghost?.remove();
          guide?.remove();
          rowElement?.classList.remove('is-row-drop-left', 'is-row-drop-right');
          activeAnchor?.classList.remove('is-drop-target');
          frame.classList.remove('is-adjusting');
          if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
          if (e.type === 'pointerup' && changed) {
            if (rowTarget) save(joinRow(source, item, rowTarget, rowBefore));
            else commit(width, left, destination);
          }
          else { image.style.width = item.width === null ? '' : `${item.width}%`; image.style.marginLeft = `${item.left}%`; positionHandle(); }
        }
        function cancel(e) { finish(e); }
        target.addEventListener('pointermove', move);
        target.addEventListener('pointerup', finish);
        target.addEventListener('pointercancel', cancel);
        target.addEventListener('lostpointercapture', cancel);
      }
      image.addEventListener('pointerdown', event => begin(event, false));
      handle.addEventListener('pointerdown', event => begin(event, true));
    });
  }
  window.BlogImageLayout = { prepare, enhance, inspect, replace, joinRow, separateRow };
})();
