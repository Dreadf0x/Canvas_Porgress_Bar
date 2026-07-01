export function getStatusInfo(item) {
  switch (item.status) {
    case "passed":
      return { icon: "✓", label: "Passed", className: "cpt-item-complete" };
    case "below_passing":
      return { icon: "!", label: "Below 80%", className: "cpt-item-warning" };
    case "waiting":
      return { icon: "…", label: "Waiting for grade", className: "cpt-item-waiting" };
    case "missing":
      return { icon: "○", label: "Missing", className: "cpt-item-incomplete" };
    case "not_scorable":
      return { icon: "?", label: "Not scorable", className: "cpt-item-muted" };
    default:
      return { icon: "!", label: "Error", className: "cpt-item-error" };
  }
}

export function renderItem(item, escapeHtml) {
  const statusInfo = getStatusInfo(item);
  const gradeText = item.percent === null ? "" : ` <span class="cpt-grade">(${item.percent}%)</span>`;

  return `
    <li class="${statusInfo.className}">
      <span class="cpt-icon">${statusInfo.icon}</span>
      <span>
        <strong>${escapeHtml(item.title)}</strong>${gradeText}
        <small>${escapeHtml(statusInfo.label)} · ${escapeHtml(item.detail || "")}</small>
      </span>
    </li>
  `;
}


export function renderModule(
  module,
  index,
  isInstructor,
  settingsPanel,
  renderItem,
  escapeHtml
) {
  const itemList = module.items.length
    ? module.items.map((item) => renderItem(item, escapeHtml)).join("")
    : `<li class="cpt-item-muted">No required items found.</li>`;

  const ruleBadge = isInstructor
    ? `<span class="cpt-rule-badge">${module.ruleMode === "custom" ? "Custom" : "Keyword"}</span>`
    : "";

  const settingsButton = isInstructor
    ? `<button class="cpt-settings-btn" type="button" data-module-id="${module.id}" title="Set requirements">⚙</button>`
    : "";

  return `
    <details class="cpt-module-row" ${index === 0 ? "open" : ""}>
      <summary>
        ${isInstructor ? `<div class="cpt-module-actions">${ruleBadge}${settingsButton}</div>` : ""}
        <div class="cpt-module-topline">
          <span class="cpt-module-title">${escapeHtml(module.name)}</span>
          <span class="cpt-module-percent">${module.percent}%</span>
        </div>
        <div class="cpt-bar">
          <div class="cpt-bar-fill" style="width:${module.percent}%"></div>
        </div>
        <div class="cpt-status">
          ${module.complete}/${module.total} required passed
        </div>
      </summary>

      ${settingsPanel}

      <ul class="cpt-item-list">
        ${itemList}
      </ul>
    </details>
  `;
}