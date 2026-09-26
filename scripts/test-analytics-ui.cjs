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
        else if (url.pathname === '/api/admin/analytics') payload = { day: '2026-09-26', totals: { views: 80, articleViews: 43 }, today: { views: 20, visitors: 8 }, counts: { posts: 1, comments: 2, messages: 3 }, trend: [{ day: '2026-09-26', views: 20, visitors: 8 }], topPosts: [{ id: 1, title: '统计测试文章', views: 43 }] };
        else if (url.pathname.includes('comments')) payload = { comments: [] };
        else if (url.pathname === '/api/messages') payload = { messages: [] };
        return route.fulfill({ json: payload });
      }
      let file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (file === 'config.js') return route.fulfill({ contentType: 'application/javascript', body: 'window.BLOG_CONFIG={API_URL:"/api"};' });
      if (file === 'image-layout.js') file = 'public/image-layout.js';
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : 'text/html' });
    });
    await page.goto('http://blog.test/');
    await page.locator('#admin-analytics-button').click();
    await page.locator('.analytics-cards').waitFor();
    assert.equal(await page.locator('.analytics-dialog tbody tr').count(), 14);
    assert.match(await page.locator('.analytics-cards').textContent(), /80/);
    await page.screenshot({ path: '.wrangler/analytics-preview.png' });
    await page.locator('.analytics-ranking a').click();
    await page.locator('[data-post-views="1"]').filter({ hasText: '43' }).waitFor();
    assert.equal(await page.locator('#analytics-dialog').evaluate(el => el.open), false);
    admin = false;
    await page.reload();
    await page.locator('[data-post-views="1"]').filter({ hasText: '43' }).waitFor();
    assert.equal(await page.locator('#admin-analytics-button').isVisible(), false);
    assert.ok(visits.some(visit => visit.page === 'post-1'));
    assert.deepEqual(errors, []);
    console.log('PASS: admin dashboard, 14-day table, ranking navigation, visitor article counts, hidden admin controls');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
