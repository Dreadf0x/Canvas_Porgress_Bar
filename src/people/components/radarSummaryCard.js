export function renderRadarSummaryCard(label, value) {
  return `
    <div class="cpt-stat-card">
      <div class="cpt-stat-number">${value}</div>
      <div class="cpt-stat-label">${label}</div>
    </div>
  `;
}