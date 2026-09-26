const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    const visits = [];
    let admin = true;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://blog.test/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/api/')) {
        let payload = {};
        if (url.pathname === '/api/auth/me') payload = { authenticated: admin, username: admin ? 'test' : null };
        else if (url.pathname === '/api/posts') payload = { posts: [{ id: 1, title: '统计测试文章', body: '测试正文', category: '杂谈集', date: '2026年9月26日', isMarkdown: true, views: 42 }] };
        else if (url.pathname === '/api/analytics/view') { visits.push(route.request().postDataJSON()); payload = { views: 43, counted: !admin }; }
        else if (url.pathname === '/api/admin/analytics') payload = { day: '2026-09-26', totals: { views: 80, startedAt: '2026-09-13' }, today: { views: 20, visitors: 8 }, trend: Array.from({ length: 14 }, (_, i) => ({ day: `2026-09-${13+i}`, views: (i * 7) % 23 })), topPosts: [{ id: 1, title: '统计测试文章', views: 43 }] };
        else if (url.pathname.includes('comments')) payload = { comments: [] };
        else if (url.pathname === '/api/messages') payload = { messages: [] };
        return route.fulfill({ json: payload });
      }
      let file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (file === 'config.js') return route.fulfill({ contentType: 'application/javascript', body: 'window.BLOG_CONFIG={API_URL:"/api"};' });
      if (file === 'image-layout.js') file = 'public/image-layout.js';
      if (file === 'analytics-charts.js') file = 'public/analytics-charts.js';
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : 'text/html' });
    });
    await page.goto('http://blog.test/');
    await page.locator('#admin-session-tools').waitFor();
    await page.goto('http://blog.test/#write');
    await page.locator('#markdown-editor').fill('你好世界');
    await page.locator('#markdown-editor').evaluate(editor => editor.setSelectionRange(2, 2));
    await page.locator('#emoji-toggle').click();
    await page.locator('#emoji-search').fill('开心');
    await page.locator('[data-emoji="😀"]').click();
    assert.equal(await page.locator('#markdown-editor').inputValue(), '你好😀世界');
    assert.match(await page.locator('#markdown-preview').textContent(), /😀/);
    await page.locator('#markdown-editor').evaluate(editor => editor.setSelectionRange(2, 4));
    await page.locator('#emoji-toggle').click();
    await page.locator('[data-emoji-category="手势与爱心"]').click();
    await page.locator('[data-emoji="❤️"]').click();
    assert.equal(await page.locator('#markdown-editor').inputValue(), '你好❤️世界');
    await page.locator('#emoji-toggle').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#emoji-picker').isVisible(), false);
    await page.locator('#admin-analytics-button').click();
    await page.locator('.analytics-cards').waitFor();
    assert.equal(await page.locator('.chart-dot').count(), 14);
    assert.equal(await page.locator('.heat-day').count(), 365);
    assert.equal(await page.locator('.analytics-cards > div').count(), 3);
    assert.equal(new URL(page.url()).hash, '#analytics');
    await page.locator('.heat-day').last().focus();
    assert.match(await page.locator('#heatmap-detail').textContent(), /2026-09-26/);
    assert.match(await page.locator('.analytics-cards').textContent(), /80/);
    await page.screenshot({ path: '.wrangler/analytics-preview.png' });
    await page.locator('.analytics-ranking a').click();
    await page.locator('[data-post-views="1"]').filter({ hasText: '43' }).waitFor();
    assert.equal(await page.locator('.analytics-page').isVisible(), false);
    await page.goto('http://blog.test/#analytics');
    await page.locator('.heat-day').first().waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: '.wrangler/analytics-mobile.png', fullPage: true });
    admin = false;
    await page.reload();
    await page.locator('#login-dialog').waitFor();
    assert.equal(await page.locator('.analytics-page').isVisible(), false);
    await page.goto('http://blog.test/#post-1');
    await page.locator('[data-post-views="1"]').filter({ hasText: '43' }).waitFor();
    assert.equal(await page.locator('#admin-analytics-button').isVisible(), false);
    assert.ok(visits.some(visit => visit.page === 'post-1'));
    assert.deepEqual(errors, []);
    console.log('PASS: full-page route, 14-day line, 365-day heatmap, tooltips, mobile overflow, ranking navigation and admin guard');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
