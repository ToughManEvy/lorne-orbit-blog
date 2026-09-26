(() => {
  const dateAt = (day, offset) => new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  function daysEnding(day, count, records, startedAt) {
    const recordsByDay = new Map(records.map(record => [record.day, record]));
    return Array.from({ length: count }, (_, index) => {
      const date = dateAt(day, index - count + 1);
      return { day: date, views: Number(recordsByDay.get(date)?.views || 0), known: !!startedAt && date >= startedAt };
    });
  }
  function line(days) {
    const maximum = Math.max(4, ...days.map(day => day.views));
    const step = Math.max(1, Math.ceil(maximum / 4));
    const ceiling = step * 4;
    const x = index => 58 + index * 820 / (days.length - 1);
    const y = value => 242 - value / ceiling * 204;
    const points = days.filter(day => day.known).map(day => `${x(days.indexOf(day))},${y(day.views)}`).join(' ');
    return `<div class="analytics-chart-scroll"><svg class="analytics-line" viewBox="0 0 920 292" role="img" aria-label="近14天每日浏览量折线图">
      ${Array.from({ length: 5 }, (_, index) => `<line class="chart-grid" x1="58" x2="878" y1="${y(index * step)}" y2="${y(index * step)}"/><text x="44" y="${y(index * step) + 4}" text-anchor="end">${index * step}</text>`).join('')}
      <polyline class="chart-line" points="${points}"/>
      ${days.map((day, index) => `${index % 2 === 0 || index === days.length - 1 ? `<text x="${x(index)}" y="272" text-anchor="middle">${day.day.slice(5)}</text>` : ''}${day.known ? `<circle tabindex="0" class="chart-dot" cx="${x(index)}" cy="${y(day.views)}" r="5" aria-label="${day.day}：${day.views} 次浏览"><title>${day.day}：${day.views} 次浏览</title></circle>` : ''}`).join('')}
      </svg></div>`;
  }
  function heat(days) {
    const offset = new Date(`${days[0].day}T00:00:00Z`).getUTCDay();
    const columns = Math.ceil((offset + days.length) / 7);
    const maximum = Math.max(1, ...days.map(day => day.views));
    let previousMonth = '';
    const months = days.map((day, index) => {
      const month = day.day.slice(0, 7);
      if (month === previousMonth) return '';
      previousMonth = month;
      // Skip a truncated first week if the next month label would overlap it.
      if (index === 0 && Number(day.day.slice(8)) > 24) return '';
      return `<span style="grid-column:${Math.floor((index + offset) / 7) + 1}">${Number(day.day.slice(5, 7))}月</span>`;
    }).join('');
    return `<div class="heatmap-scroll"><div class="heatmap" style="--weeks:${columns}"><div class="heatmap-months">${months}</div><div class="heatmap-weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="heatmap-days">${days.map((day, index) => {
      const level = day.views === 0 ? 0 : Math.min(4, Math.ceil(day.views / maximum * 4));
      const label = `${day.day} · ${day.known ? `${day.views} 次浏览` : '尚未开始统计'}`;
      return `<button type="button" class="heat-day${day.known ? '' : ' is-untracked'}" data-level="${level}" style="grid-column:${Math.floor((index + offset) / 7) + 1};grid-row:${(index + offset) % 7 + 1}" title="${label}" aria-label="${label}"></button>`;
    }).join('')}</div></div></div><div class="heatmap-footer"><span id="heatmap-detail" aria-live="polite">悬停或点击方块，查看当天浏览量</span><span class="heatmap-legend">少 ${[0, 1, 2, 3, 4].map(level => `<i data-level="${level}"></i>`).join('')} 多</span></div>`;
  }
  window.AnalyticsCharts = { daysEnding, line, heat };
})();
