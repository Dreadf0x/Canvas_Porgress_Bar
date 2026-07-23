(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/people/peopleApi.js
  async function canvasFetchJson(path) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status}`);
    }
    return response.json();
  }
  async function canvasFetchAll(path) {
    const allResults = [];
    let nextUrl = path;
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status}`);
      }
      const pageResults = await response.json();
      if (Array.isArray(pageResults)) {
        allResults.push(...pageResults);
      }
      const linkHeader = response.headers.get("Link");
      nextUrl = getNextPageUrl(linkHeader);
    }
    return allResults;
  }
  function getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;
    const links = linkHeader.split(",");
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match && match[2] === "next") {
        return match[1];
      }
    }
    return null;
  }
  async function getCourseStudents(courseId) {
    return canvasFetchJson(
      `/api/v1/courses/${courseId}/users?enrollment_type[]=student&include[]=enrollments&per_page=100`
    );
  }
  async function getRadarAssignments(courseId) {
    const modules = await canvasFetchJson(
      `/api/v1/courses/${courseId}/modules?include[]=items&per_page=100`
    );
    const assignmentsById = /* @__PURE__ */ new Map();
    for (const module of modules) {
      if (module.published === false) continue;
      for (const item of module.items || []) {
        if (item.type !== "Assignment") continue;
        const assignmentId = item.content_id;
        if (!assignmentId) continue;
        assignmentsById.set(String(assignmentId), {
          id: assignmentId,
          name: item.title || "Untitled assignment",
          moduleId: module.id,
          moduleName: module.name
        });
      }
    }
    return Array.from(assignmentsById.values());
  }
  async function getRadarSubmissions(courseId, assignmentIds) {
    if (!assignmentIds.length) {
      return [];
    }
    const params = new URLSearchParams();
    params.append("student_ids[]", "all");
    params.append("per_page", "100");
    for (const assignmentId of assignmentIds) {
      params.append("assignment_ids[]", String(assignmentId));
    }
    return canvasFetchAll(
      `/api/v1/courses/${courseId}/students/submissions?${params.toString()}`
    );
  }
  var init_peopleApi = __esm({
    "src/people/peopleApi.js"() {
    }
  });

  // src/people/components/radarSummaryCard.js
  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderStudentList(students, emptyMessage) {
    if (!students.length) {
      return `
      <div class="cpt-summary-tooltip-empty">
        ${escapeHtml(emptyMessage)}
      </div>
    `;
    }
    const visibleStudents = students.slice(
      0,
      MAX_TOOLTIP_ITEMS
    );
    const remainingCount = Math.max(
      0,
      students.length - MAX_TOOLTIP_ITEMS
    );
    return `
    <ul class="cpt-summary-tooltip-list">
      ${visibleStudents.map(
      (student) => `
            <li class="cpt-summary-tooltip-item">
              <span class="cpt-summary-tooltip-student-name">
                ${escapeHtml(student.name)}
              </span>

              ${student.detail ? `
                    <span class="cpt-summary-tooltip-detail">
                      \u2014 ${escapeHtml(student.detail)}
                    </span>
                  ` : ""}
            </li>
          `
    ).join("")}
    </ul>

    ${remainingCount > 0 ? `
          <div class="cpt-summary-tooltip-more">
            +${remainingCount} more
          </div>
        ` : ""}
  `;
  }
  function renderRadarSummaryCard({
    label,
    students = [],
    emptyMessage = "No students in this category."
  } = {}) {
    const count = students.length;
    const accessibleLabel = count === 1 ? `${label}: 1 student` : `${label}: ${count} students`;
    return `
    <div
      class="cpt-stat-card cpt-radar-summary-card"
      tabindex="0"
      aria-label="${escapeHtml(accessibleLabel)}"
    >
      <div class="cpt-stat-number">
        ${count}
      </div>

      <div class="cpt-stat-label">
        ${escapeHtml(label)}
      </div>

      <div
        class="cpt-radar-summary-tooltip"
        role="tooltip"
      >
        <div class="cpt-summary-tooltip-title">
          ${escapeHtml(label)}
        </div>

        ${renderStudentList(
      students,
      emptyMessage
    )}
      </div>
    </div>
  `;
  }
  var MAX_TOOLTIP_ITEMS;
  var init_radarSummaryCard = __esm({
    "src/people/components/radarSummaryCard.js"() {
      MAX_TOOLTIP_ITEMS = 10;
    }
  });

  // src/people/components/radarProgressBar.js
  function escapeHtml2(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderTooltipItems(items = []) {
    return `
    <ul class="cpt-radar-tooltip-list">
      ${items.map(
      (item) => `
            <li class="cpt-radar-tooltip-item">
              ${escapeHtml2(
        item.name || "Unnamed item"
      )}
            </li>
          `
    ).join("")}
    </ul>
  `;
  }
  function renderRadarProgressBar({
    percent = null,
    tooltipTitle = "",
    items = [],
    completeMessage = "All required items complete"
  } = {}) {
    if (percent === null || percent === void 0) {
      return `
      <span class="cpt-radar-empty">
        \u2014
      </span>
    `;
    }
    const safePercent = Math.max(
      0,
      Math.min(100, Number(percent) || 0)
    );
    const tooltipBody = items.length ? renderTooltipItems(items) : `
      <div class="cpt-radar-tooltip-complete">
        ${escapeHtml2(completeMessage)}
      </div>
    `;
    const accessibleLabel = items.length ? `${tooltipTitle}. ${items.length} item${items.length === 1 ? "" : "s"}.` : `${tooltipTitle}. ${completeMessage}.`;
    return `
    <div
      class="cpt-radar-progress-wrapper"
      tabindex="0"
      aria-label="${escapeHtml2(
      accessibleLabel
    )}"
    >
      <div class="cpt-radar-progress">
        <div
          class="cpt-radar-progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${safePercent}"
        >
          <div
            class="cpt-radar-progress-fill"
            style="width: ${safePercent}%"
          ></div>
        </div>

        <span class="cpt-radar-progress-label">
          ${safePercent}%
        </span>
      </div>

      <div
        class="cpt-radar-progress-tooltip"
        role="tooltip"
      >
        <div class="cpt-radar-tooltip-title">
          ${escapeHtml2(tooltipTitle)}
        </div>

        ${tooltipBody}
      </div>
    </div>
  `;
  }
  var init_radarProgressBar = __esm({
    "src/people/components/radarProgressBar.js"() {
    }
  });

  // src/people/components/studentRadarTable.js
  function escapeHtml3(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function getDaysSinceLastActivity(student) {
    const enrollment = student.enrollments?.[0];
    const lastActivity = enrollment?.last_activity_at;
    if (!lastActivity) {
      return Number.POSITIVE_INFINITY;
    }
    const lastActivityTime = new Date(lastActivity).getTime();
    if (Number.isNaN(lastActivityTime)) {
      return Number.POSITIVE_INFINITY;
    }
    const differenceMs = Date.now() - lastActivityTime;
    return Math.max(
      0,
      Math.floor(
        differenceMs / (1e3 * 60 * 60 * 24)
      )
    );
  }
  function formatLastActivity(student) {
    const diffDays = getDaysSinceLastActivity(student);
    if (!Number.isFinite(diffDays)) {
      return "No activity";
    }
    if (diffDays <= 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "1 day";
    }
    return `${diffDays} days`;
  }
  function getActivityStatus(student) {
    const diffDays = getDaysSinceLastActivity(student);
    if (!Number.isFinite(diffDays) || diffDays >= 8) {
      return {
        icon: "\u26D4",
        className: "cpt-activity-inactive"
      };
    }
    if (diffDays <= 3) {
      return {
        icon: "\u2713",
        className: "cpt-activity-recent"
      };
    }
    return {
      icon: "\u26A0",
      className: "cpt-activity-watch"
    };
  }
  function renderStudentRadarTable({
    students = [],
    endDates = {},
    loading = false,
    error = null
  } = {}) {
    let rows = "";
    if (loading) {
      rows = `
      <tr>
        <td colspan="6">
          Loading students...
        </td>
      </tr>
    `;
    } else if (error) {
      rows = `
      <tr>
        <td colspan="6">
          Could not load students:
          ${escapeHtml3(error)}
        </td>
      </tr>
    `;
    } else if (!students.length) {
      rows = `
      <tr>
        <td colspan="6">
          No students found.
        </td>
      </tr>
    `;
    } else {
      rows = students.map((student) => {
        const activity = getActivityStatus(student);
        const inactiveDays = getDaysSinceLastActivity(student);
        const studentName = student.name || student.sortable_name || "Unknown Student";
        const endDate = endDates[String(student.id)] || "";
        const missingItemCount = student.missingSubmissionItems?.length || 0;
        return `
          <tr
            data-radar-student-row
            data-student-id="${escapeHtml3(
          student.id
        )}"
            data-inactive-days="${inactiveDays}"
            data-submitted-percent="${student.submittedPercent ?? ""}"
            data-graded-percent="${student.gradedPercent ?? ""}"
          >
            <td>
              ${escapeHtml3(studentName)}
            </td>

            <td class="cpt-radar-schedule-cell">
              <button
                type="button"
                class="cpt-radar-schedule-button"
                data-student-id="${escapeHtml3(
          student.id
        )}"
                title="Create weekly schedule for ${escapeHtml3(
          studentName
        )}. ${missingItemCount} unsubmitted required items."
                aria-label="Create weekly schedule for ${escapeHtml3(
          studentName
        )}"
              >
                <span aria-hidden="true">\u25A6</span>
              </button>
            </td>

            <td>
              ${renderRadarProgressBar({
          percent: student.submittedPercent,
          tooltipTitle: "Required Items Not Submitted",
          items: student.missingSubmissionItems || [],
          completeMessage: "All required items submitted"
        })}
            </td>

            <td>
              ${renderRadarProgressBar({
          percent: student.gradedPercent,
          tooltipTitle: "Required Items Not Yet Graded",
          items: student.ungradedItems || [],
          completeMessage: "All required items graded"
        })}
            </td>

            <td>
              <span
                class="cpt-activity-badge ${activity.className}"
              >
                <span class="cpt-activity-icon">
                  ${activity.icon}
                </span>

                ${escapeHtml3(
          formatLastActivity(student)
        )}
              </span>
            </td>

            <td>
              <input
                type="date"
                class="cpt-end-date"
                data-student-id="${escapeHtml3(
          student.id
        )}"
                value="${escapeHtml3(endDate)}"
              >
            </td>
          </tr>
        `;
      }).join("");
    }
    return `
    <div class="cpt-module-row">
      <div class="cpt-module-topline">
        <span class="cpt-module-title">
          Students
        </span>
      </div>

      <div class="cpt-radar-table-wrap">
        <table class="cpt-radar-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Schedule</th>
              <th>Submitted</th>
              <th>Graded</th>
              <th>Last Activity</th>
              <th>End Date</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
  }
  var init_studentRadarTable = __esm({
    "src/people/components/studentRadarTable.js"() {
      init_radarProgressBar();
    }
  });

  // src/people/components/requiredItemsPanel.js
  function escapeHtml4(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function renderRequiredItemsPanel({
    assignments = [],
    selectedIds = []
  } = {}) {
    const selectedSet = new Set(selectedIds.map(String));
    const rows = assignments.length ? assignments.map((assignment) => {
      const checked = selectedSet.has(String(assignment.id)) ? "checked" : "";
      return `
            <label class="cpt-radar-required-item">
              <input
                type="checkbox"
                class="cpt-radar-required-checkbox"
                value="${escapeHtml4(assignment.id)}"
                ${checked}
              >

              <span>${escapeHtml4(assignment.name || "Untitled assignment")}</span>
            </label>
          `;
    }).join("") : `
      <p class="cpt-radar-required-empty">
        No gradable assignments found.
      </p>
    `;
    return `
    <section class="cpt-radar-required-panel" hidden>
      <div class="cpt-radar-required-header">
        <div>
          <strong>Required Items</strong>
          <span>Select which assignments count toward Student Radar progress.</span>
        </div>

        <button
          type="button"
          class="cpt-radar-required-close"
          title="Close required items"
        >
          \xD7
        </button>
      </div>

      <div class="cpt-radar-required-list">
        ${rows}
      </div>

      <div class="cpt-radar-required-actions">
        <button type="button" class="cpt-radar-required-save">
          Save
        </button>

        <button type="button" class="cpt-radar-required-reset">
          Reset to Defaults
        </button>

        <button type="button" class="cpt-radar-required-export">
          Export
        </button>

        <button type="button" class="cpt-radar-required-import">
          Import
        </button>
      </div>
    </section>
  `;
  }
  var init_requiredItemsPanel = __esm({
    "src/people/components/requiredItemsPanel.js"() {
    }
  });

  // src/people/peopleRenderer.js
  function getEmptySummaryGroups() {
    return {
      onTrack: [],
      watchList: [],
      atRisk: [],
      inactive: [],
      endDateAlert: []
    };
  }
  function renderStudentRadar({
    students = [],
    assignments = [],
    selectedAssignmentIds = [],
    endDates = {},
    summaryGroups = getEmptySummaryGroups(),
    loading = false,
    error = null
  } = {}) {
    return `
    <div class="cpt-student-radar">

      <div class="cpt-overall">
        <div class="cpt-module-topline">
          <div class="cpt-radar-heading">
            <span class="cpt-module-title">
              Wayfinder Student Radar
            </span>

            <div class="cpt-radar-heading-actions">
              <button
                type="button"
                id="cpt-radar-required-button"
                class="cpt-radar-required-button"
                title="Choose required items"
              >
                <span
                  class="cpt-radar-required-icon"
                  aria-hidden="true"
                >
                  \u2713
                </span>

                <span class="cpt-radar-required-label">
                  Required Items
                </span>

                <span class="cpt-radar-required-count">
                  ${selectedAssignmentIds.length}
                </span>
              </button>

              <button
                id="cpt-theme-button"
                type="button"
                title="Appearance"
                aria-label="Choose Wayfinder theme"
                aria-expanded="false"
              >
                \u2699
              </button>

              <div
                id="cpt-theme-menu"
                class="cpt-theme-menu"
                hidden
              >
                <button type="button" data-theme="ubtech">
                  UBTech
                </button>

                <button type="button" data-theme="slate">
                  Slate
                </button>

                <button type="button" data-theme="forest">
                  Forest
                </button>

                <button type="button" data-theme="dark">
                  Dark
                </button>

                <button type="button" data-theme="midnight">
                  Midnight
                </button>

                <button type="button" data-theme="highcontrast">
                  High Contrast
                </button>
              </div>

              <button
                type="button"
                id="cpt-radar-collapse"
                class="cpt-radar-collapse-button"
                title="Collapse Student Radar"
                aria-label="Collapse Student Radar"
              >
                \u2013
              </button>
            </div>
          </div>

          ${renderRequiredItemsPanel({
      assignments,
      selectedIds: selectedAssignmentIds
    })}
        </div>
      </div>

      <div class="cpt-summary cpt-radar-summary">
        ${renderRadarSummaryCard({
      label: "On Track",
      students: summaryGroups.onTrack,
      emptyMessage: "No unfinished students were active within the last 5 days."
    })}

        ${renderRadarSummaryCard({
      label: "Watch List",
      students: summaryGroups.watchList,
      emptyMessage: "No unfinished students have been inactive for 5\u20139 days."
    })}

        ${renderRadarSummaryCard({
      label: "At Risk",
      students: summaryGroups.atRisk,
      emptyMessage: "No unfinished students have been inactive for 10\u201399 days."
    })}

        ${renderRadarSummaryCard({
      label: "Inactive",
      students: summaryGroups.inactive,
      emptyMessage: "No unfinished students have been inactive for 100+ days."
    })}

        ${renderRadarSummaryCard({
      label: "End Date Alert",
      students: summaryGroups.endDateAlert,
      emptyMessage: "No unfinished students are within 10 days of their end date."
    })}
      </div>

      <div class="cpt-radar-filters">
        <label class="cpt-radar-filter">
          <input
            type="checkbox"
            id="cpt-hide-inactive"
            checked
          >
          <span>Hide inactive 100+ days</span>
        </label>

        <label class="cpt-radar-filter">
          <input
            type="checkbox"
            id="cpt-hide-complete"
            checked
          >
          <span>Hide 100% submitted and graded</span>
        </label>
      </div>

      <div class="cpt-body">
        ${renderStudentRadarTable({
      students,
      endDates,
      loading,
      error
    })}
      </div>

    </div>
  `;
  }
  var init_peopleRenderer = __esm({
    "src/people/peopleRenderer.js"() {
      init_radarSummaryCard();
      init_studentRadarTable();
      init_requiredItemsPanel();
    }
  });

  // src/storage/rules.js
  function storageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result[key]));
    });
  }
  function storageSet(obj) {
    return new Promise((resolve) => {
      chrome.storage.local.set(obj, resolve);
    });
  }
  function getRulesStorageKey(courseId) {
    return `cpt_rules_course_${courseId}`;
  }
  function getUiStorageKey(courseId) {
    return `cpt_ui_course_${courseId}`;
  }
  async function loadRules(courseId) {
    return await storageGet(getRulesStorageKey(courseId)) || {};
  }
  async function saveRules(courseId, rules) {
    await storageSet({ [getRulesStorageKey(courseId)]: rules });
  }
  async function loadUiState(courseId) {
    return await storageGet(getUiStorageKey(courseId)) || {};
  }
  async function saveUiState2(courseId, uiState) {
    await storageSet({
      [getUiStorageKey(courseId)]: uiState
    });
  }
  var init_rules = __esm({
    "src/storage/rules.js"() {
    }
  });

  // src/themes/themes.js
  function getTheme(themeId = "ubtech") {
    const id = typeof themeId === "string" ? themeId : themeId?.id || "ubtech";
    return THEMES[id] || THEMES.ubtech;
  }
  function applyTheme(themeId = "ubtech") {
    document.documentElement.dataset.cptTheme = getTheme(themeId).id;
  }
  var THEMES;
  var init_themes = __esm({
    "src/themes/themes.js"() {
      THEMES = {
        ubtech: {
          id: "ubtech",
          name: "UBTech",
          logo: "assets/branding/Wayfinder_White.svg"
        },
        slate: {
          id: "slate",
          name: "Slate",
          logo: "assets/branding/Wayfinder_Dark.svg"
        },
        forest: {
          id: "forest",
          name: "Forest",
          logo: "assets/branding/Wayfinder_Dark.svg"
        },
        dark: {
          id: "dark",
          name: "Dark",
          logo: "assets/branding/Wayfinder_White.svg"
        },
        midnight: {
          id: "midnight",
          name: "Midnight",
          logo: "assets/branding/Wayfinder_White.svg"
        },
        highcontrast: {
          id: "highcontrast",
          name: "High Contrast",
          logo: "assets/branding/Wayfinder_Dark.svg"
        }
      };
    }
  });

  // src/people/radarTooltips.js
  function getTooltipSource(target) {
    return target?.querySelector(
      TOOLTIP_SOURCE_SELECTOR
    );
  }
  function getOrCreatePortal() {
    let existingPortal = document.getElementById(
      PORTAL_ID
    );
    if (existingPortal) {
      return existingPortal;
    }
    existingPortal = document.createElement("div");
    existingPortal.id = PORTAL_ID;
    existingPortal.className = "cpt-radar-tooltip-portal";
    existingPortal.setAttribute("role", "tooltip");
    existingPortal.hidden = true;
    document.body.appendChild(existingPortal);
    return existingPortal;
  }
  function clamp(value, minimum, maximum) {
    return Math.min(
      Math.max(value, minimum),
      maximum
    );
  }
  function positionPortal() {
    if (!activeTarget || !portal || portal.hidden) {
      return;
    }
    const targetRect = activeTarget.getBoundingClientRect();
    const tooltipRect = portal.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    left = clamp(
      left,
      VIEWPORT_PADDING,
      viewportWidth - tooltipRect.width - VIEWPORT_PADDING
    );
    const spaceAbove = targetRect.top - VIEWPORT_PADDING;
    const spaceBelow = viewportHeight - targetRect.bottom - VIEWPORT_PADDING;
    const fitsAbove = spaceAbove >= tooltipRect.height + TARGET_GAP;
    const fitsBelow = spaceBelow >= tooltipRect.height + TARGET_GAP;
    let placement = "above";
    let top;
    if (fitsAbove) {
      top = targetRect.top - tooltipRect.height - TARGET_GAP;
    } else if (fitsBelow) {
      placement = "below";
      top = targetRect.bottom + TARGET_GAP;
    } else if (spaceBelow >= spaceAbove) {
      placement = "below";
      top = clamp(
        targetRect.bottom + TARGET_GAP,
        VIEWPORT_PADDING,
        viewportHeight - tooltipRect.height - VIEWPORT_PADDING
      );
    } else {
      top = clamp(
        targetRect.top - tooltipRect.height - TARGET_GAP,
        VIEWPORT_PADDING,
        viewportHeight - tooltipRect.height - VIEWPORT_PADDING
      );
    }
    portal.dataset.placement = placement;
    portal.style.left = `${Math.round(left)}px`;
    portal.style.top = `${Math.round(top)}px`;
    const targetCenter = targetRect.left + targetRect.width / 2;
    const arrowLeft = clamp(
      targetCenter - left,
      12,
      tooltipRect.width - 12
    );
    portal.style.setProperty(
      "--cpt-tooltip-arrow-left",
      `${Math.round(arrowLeft)}px`
    );
  }
  function showTooltip(target) {
    const source = getTooltipSource(target);
    if (!source) {
      return;
    }
    activeTarget = target;
    portal = getOrCreatePortal();
    portal.innerHTML = source.innerHTML;
    portal.hidden = false;
    portal.dataset.visible = "true";
    requestAnimationFrame(positionPortal);
  }
  function hideTooltip(target = null) {
    if (target && activeTarget && target !== activeTarget) {
      return;
    }
    activeTarget = null;
    if (!portal) {
      return;
    }
    portal.hidden = true;
    portal.dataset.visible = "false";
    portal.innerHTML = "";
  }
  function findTargetFromEvent(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return null;
    }
    return target.closest(
      TOOLTIP_TARGET_SELECTOR
    );
  }
  function handleMouseOver(event) {
    const target = findTargetFromEvent(event);
    if (!target) {
      return;
    }
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) {
      return;
    }
    showTooltip(target);
  }
  function handleMouseOut(event) {
    const target = findTargetFromEvent(event);
    if (!target) {
      return;
    }
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) {
      return;
    }
    hideTooltip(target);
  }
  function handleFocusIn(event) {
    const target = findTargetFromEvent(event);
    if (target) {
      showTooltip(target);
    }
  }
  function handleFocusOut(event) {
    const target = findTargetFromEvent(event);
    if (!target) {
      return;
    }
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) {
      return;
    }
    hideTooltip(target);
  }
  function handleEscape(event) {
    if (event.key === "Escape") {
      hideTooltip();
    }
  }
  function handleViewportChange() {
    if (activeTarget) {
      requestAnimationFrame(positionPortal);
    }
  }
  function initializeRadarTooltips(panel) {
    cleanupCurrentBinding?.();
    if (!(panel instanceof Element)) {
      return () => {
      };
    }
    portal = getOrCreatePortal();
    panel.addEventListener(
      "mouseover",
      handleMouseOver
    );
    panel.addEventListener(
      "mouseout",
      handleMouseOut
    );
    panel.addEventListener(
      "focusin",
      handleFocusIn
    );
    panel.addEventListener(
      "focusout",
      handleFocusOut
    );
    document.addEventListener(
      "keydown",
      handleEscape
    );
    window.addEventListener(
      "resize",
      handleViewportChange
    );
    document.addEventListener(
      "scroll",
      handleViewportChange,
      true
    );
    cleanupCurrentBinding = () => {
      panel.removeEventListener(
        "mouseover",
        handleMouseOver
      );
      panel.removeEventListener(
        "mouseout",
        handleMouseOut
      );
      panel.removeEventListener(
        "focusin",
        handleFocusIn
      );
      panel.removeEventListener(
        "focusout",
        handleFocusOut
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
      window.removeEventListener(
        "resize",
        handleViewportChange
      );
      document.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
      hideTooltip();
      cleanupCurrentBinding = null;
    };
    return cleanupCurrentBinding;
  }
  var TOOLTIP_TARGET_SELECTOR, TOOLTIP_SOURCE_SELECTOR, PORTAL_ID, VIEWPORT_PADDING, TARGET_GAP, activeTarget, portal, cleanupCurrentBinding;
  var init_radarTooltips = __esm({
    "src/people/radarTooltips.js"() {
      TOOLTIP_TARGET_SELECTOR = [
        ".cpt-radar-progress-wrapper",
        ".cpt-radar-summary-card"
      ].join(", ");
      TOOLTIP_SOURCE_SELECTOR = [
        ".cpt-radar-progress-tooltip",
        ".cpt-radar-summary-tooltip"
      ].join(", ");
      PORTAL_ID = "cpt-radar-tooltip-portal";
      VIEWPORT_PADDING = 10;
      TARGET_GAP = 7;
      activeTarget = null;
      portal = null;
      cleanupCurrentBinding = null;
    }
  });

  // src/people/studentSchedule.js
  function escapeHtml5(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function getStudentName(student) {
    return student?.name || student?.sortable_name || "Unknown Student";
  }
  function getStartOfToday() {
    const now = /* @__PURE__ */ new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }
  function parseLocalDate(value) {
    const match = String(value || "").match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );
    if (!match) {
      return null;
    }
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function addDays(date, numberOfDays) {
    const result = new Date(date);
    result.setDate(
      result.getDate() + numberOfDays
    );
    return result;
  }
  function formatDate(date) {
    return date.toLocaleDateString(void 0, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  function formatShortDate(date) {
    return date.toLocaleDateString(void 0, {
      month: "short",
      day: "numeric"
    });
  }
  function parseModuleHours(moduleName) {
    const match = String(moduleName || "").match(
      /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i
    );
    if (!match) {
      return null;
    }
    const hours = Number(match[1]);
    return Number.isFinite(hours) && hours > 0 ? hours : null;
  }
  function createScheduleWeeks(startDate, endDate) {
    const weeks = [];
    let weekStart = new Date(startDate);
    while (weekStart <= endDate) {
      const dayOfWeek = weekStart.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      let weekEnd = addDays(
        weekStart,
        daysUntilSunday
      );
      if (weekEnd > endDate) {
        weekEnd = new Date(endDate);
      }
      weeks.push({
        startDate: new Date(weekStart),
        endDate: new Date(weekEnd),
        items: [],
        estimatedHours: 0,
        unknownHourItems: 0,
        scheduleWeight: 0
      });
      weekStart = addDays(weekEnd, 1);
    }
    return weeks;
  }
  function buildModuleStats(assignments = []) {
    const stats = /* @__PURE__ */ new Map();
    for (const assignment of assignments) {
      const moduleName = assignment.moduleName || "Other Required Items";
      if (!stats.has(moduleName)) {
        stats.set(moduleName, {
          moduleName,
          totalRequiredItems: 0,
          moduleHours: parseModuleHours(moduleName)
        });
      }
      stats.get(
        moduleName
      ).totalRequiredItems += 1;
    }
    return stats;
  }
  function addWeightsToMissingItems({
    missingItems,
    assignments
  }) {
    const moduleStats = buildModuleStats(assignments);
    return missingItems.map((item) => {
      const moduleName = item.moduleName || "Other Required Items";
      const stats = moduleStats.get(moduleName);
      const moduleHours = stats?.moduleHours ?? parseModuleHours(moduleName);
      const totalRequiredItems = stats?.totalRequiredItems || 1;
      const estimatedHours = moduleHours !== null ? moduleHours / totalRequiredItems : null;
      return {
        ...item,
        moduleName,
        estimatedHours,
        /*
         * Items without an hour estimate still need weight
         * so they are spread through the plan rather than
         * being gathered into one week.
         */
        scheduleWeight: estimatedHours !== null ? estimatedHours : 1
      };
    });
  }
  function getRangeWeight(prefixWeights, startIndex, endIndex) {
    return prefixWeights[endIndex] - prefixWeights[startIndex];
  }
  function createBalancedPartitions(weightedItems, requestedPartitionCount) {
    const itemCount = weightedItems.length;
    if (!itemCount) {
      return [];
    }
    const partitionCount = Math.min(
      requestedPartitionCount,
      itemCount
    );
    const prefixWeights = new Array(itemCount + 1).fill(0);
    for (let index = 0; index < itemCount; index += 1) {
      prefixWeights[index + 1] = prefixWeights[index] + weightedItems[index].scheduleWeight;
    }
    const totalWeight = prefixWeights[itemCount];
    const targetWeight = totalWeight / partitionCount;
    const costs = Array.from(
      { length: partitionCount + 1 },
      () => new Array(itemCount + 1).fill(
        Number.POSITIVE_INFINITY
      )
    );
    const previousBreak = Array.from(
      { length: partitionCount + 1 },
      () => new Array(itemCount + 1).fill(-1)
    );
    costs[0][0] = 0;
    for (let groupCount2 = 1; groupCount2 <= partitionCount; groupCount2 += 1) {
      for (let itemsUsed2 = groupCount2; itemsUsed2 <= itemCount; itemsUsed2 += 1) {
        const minimumPreviousItems = groupCount2 - 1;
        const maximumPreviousItems = itemsUsed2 - 1;
        for (let splitIndex = minimumPreviousItems; splitIndex <= maximumPreviousItems; splitIndex += 1) {
          const previousCost = costs[groupCount2 - 1][splitIndex];
          if (!Number.isFinite(previousCost)) {
            continue;
          }
          const groupWeight = getRangeWeight(
            prefixWeights,
            splitIndex,
            itemsUsed2
          );
          const difference = groupWeight - targetWeight;
          const groupCost = difference * difference;
          const candidateCost = previousCost + groupCost;
          if (candidateCost < costs[groupCount2][itemsUsed2]) {
            costs[groupCount2][itemsUsed2] = candidateCost;
            previousBreak[groupCount2][itemsUsed2] = splitIndex;
          }
        }
      }
    }
    const partitions = [];
    let groupCount = partitionCount;
    let itemsUsed = itemCount;
    while (groupCount > 0) {
      const splitIndex = previousBreak[groupCount][itemsUsed];
      if (splitIndex < 0) {
        return weightedItems.map(
          (item) => [item]
        );
      }
      partitions.unshift(
        weightedItems.slice(
          splitIndex,
          itemsUsed
        )
      );
      itemsUsed = splitIndex;
      groupCount -= 1;
    }
    return partitions;
  }
  function addItemToWeek(week, item) {
    week.items.push(item);
    week.scheduleWeight += item.scheduleWeight;
    if (item.estimatedHours !== null) {
      week.estimatedHours += item.estimatedHours;
    } else {
      week.unknownHourItems += 1;
    }
  }
  function distributeItemsAcrossWeeks(weightedItems, weeks) {
    if (!weeks.length || !weightedItems.length) {
      return weeks;
    }
    const partitions = createBalancedPartitions(
      weightedItems,
      weeks.length
    );
    partitions.forEach(
      (partition, weekIndex) => {
        const week = weeks[weekIndex];
        if (!week) {
          return;
        }
        partition.forEach((item) => {
          addItemToWeek(week, item);
        });
      }
    );
    return weeks;
  }
  function formatWeeklyTaskCount(week) {
    const itemCount = week.items.length;
    if (!itemCount) {
      return "Catch-up and review";
    }
    return `${itemCount} required item${itemCount === 1 ? "" : "s"}`;
  }
  function groupWeekItemsByModule(items) {
    const groups = [];
    for (const item of items) {
      const lastGroup = groups.at(-1);
      if (lastGroup && lastGroup.moduleName === item.moduleName) {
        lastGroup.items.push(item);
      } else {
        groups.push({
          moduleName: item.moduleName,
          items: [item]
        });
      }
    }
    return groups;
  }
  function renderWeek(week, index) {
    const moduleGroups = groupWeekItemsByModule(
      week.items
    );
    const moduleHtml = moduleGroups.length ? moduleGroups.map(
      (group) => `
              <section
                class="cpt-schedule-module"
                >
                <h4>
                    ${escapeHtml5(
        group.moduleName
      )}
                    </h4>

                    <p class="cpt-schedule-module-instruction">
                        Before completing the required items below, complete
                        all learning materials that appear above them in Canvas.
                        This schedule lists only the required submissions.
                    </p>

                    <ul
                    class="cpt-schedule-task-list"
                    >
                  ${group.items.map(
        (item) => `
                        <li>
                          <span
                            class="cpt-schedule-checkbox"
                            aria-hidden="true"
                          ></span>

                          <span>
                            ${escapeHtml5(
          item.name || "Unnamed required item"
        )}
                          </span>
                        </li>
                      `
      ).join("")}
                </ul>
              </section>
            `
    ).join("") : `
        <p
          class="cpt-schedule-empty-week"
        >
          Catch-up, review, and completion week.
        </p>
      `;
    return `
    <article class="cpt-schedule-week">
      <div
        class="cpt-schedule-week-header"
      >
        <div>
          <h3>Week ${index + 1}</h3>

          <span>
            ${escapeHtml5(
      formatShortDate(
        week.startDate
      )
    )}
            \u2013
            ${escapeHtml5(
      formatShortDate(
        week.endDate
      )
    )}
          </span>
        </div>

        <strong>
            ${escapeHtml5(
      formatWeeklyTaskCount(week)
    )}
        </strong>
      </div>

      ${moduleHtml}
    </article>
  `;
  }
  function removeExistingSchedule() {
    document.querySelector(
      ".cpt-student-schedule-overlay"
    )?.remove();
  }
  function closeSchedule() {
    removeExistingSchedule();
    document.body.classList.remove(
      "cpt-printing-student-schedule"
    );
  }
  function createModal({
    title,
    body,
    showPrintButton = false,
    focusEndDateStudentId = null
  }) {
    removeExistingSchedule();
    const overlay = document.createElement("div");
    overlay.className = "cpt-student-schedule-overlay";
    overlay.innerHTML = `
    <section
      class="cpt-student-schedule-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cpt-schedule-dialog-title"
    >
      <header
        class="cpt-schedule-modal-header"
      >
        <h2
          id="cpt-schedule-dialog-title"
        >
          ${escapeHtml5(title)}
        </h2>

        <button
          type="button"
          class="cpt-schedule-close"
          aria-label="Close schedule"
          title="Close"
        >
          \xD7
        </button>
      </header>

      <div
        class="cpt-schedule-modal-body"
      >
        ${body}
      </div>

      <footer
        class="cpt-schedule-modal-actions"
      >
        ${focusEndDateStudentId ? `
              <button
                type="button"
                class="cpt-schedule-set-date"
                data-student-id="${escapeHtml5(
      focusEndDateStudentId
    )}"
              >
                Set End Date
              </button>
            ` : ""}

        ${showPrintButton ? `
              <button
                type="button"
                class="cpt-schedule-print"
              >
                Print Schedule
              </button>
            ` : ""}

        <button
          type="button"
          class="cpt-schedule-cancel"
        >
          Close
        </button>
      </footer>
    </section>
  `;
    document.body.appendChild(
      overlay
    );
    const modal = overlay.querySelector(
      ".cpt-student-schedule-modal"
    );
    overlay.querySelector(
      ".cpt-schedule-close"
    )?.addEventListener(
      "click",
      closeSchedule
    );
    overlay.querySelector(
      ".cpt-schedule-cancel"
    )?.addEventListener(
      "click",
      closeSchedule
    );
    overlay.addEventListener(
      "click",
      (event) => {
        if (event.target === overlay) {
          closeSchedule();
        }
      }
    );
    overlay.querySelector(
      ".cpt-schedule-set-date"
    )?.addEventListener(
      "click",
      (event) => {
        const studentId = event.currentTarget.dataset.studentId;
        closeSchedule();
        const input = document.querySelector(
          `.cpt-end-date[data-student-id="${CSS.escape(
            studentId
          )}"]`
        );
        input?.focus();
        input?.showPicker?.();
      }
    );
    overlay.querySelector(
      ".cpt-schedule-print"
    )?.addEventListener(
      "click",
      () => {
        document.body.classList.add(
          "cpt-printing-student-schedule"
        );
        window.print();
      }
    );
    const handleEscape2 = (event) => {
      if (event.key !== "Escape") {
        return;
      }
      closeSchedule();
      document.removeEventListener(
        "keydown",
        handleEscape2
      );
    };
    document.addEventListener(
      "keydown",
      handleEscape2
    );
    window.addEventListener(
      "afterprint",
      () => {
        document.body.classList.remove(
          "cpt-printing-student-schedule"
        );
      },
      { once: true }
    );
    requestAnimationFrame(() => {
      modal?.querySelector(
        "button, input, [tabindex]"
      )?.focus();
    });
  }
  function openStudentSchedule({
    student,
    endDateValue,
    assignments
  }) {
    const studentName = getStudentName(student);
    if (!endDateValue) {
      createModal({
        title: "End Date Required",
        body: `
        <div
          class="cpt-schedule-message"
        >
          <p>
            Enter an end date for
            <strong>
              ${escapeHtml5(studentName)}
            </strong>
            before generating a weekly schedule.
          </p>
        </div>
      `,
        focusEndDateStudentId: String(student.id)
      });
      return;
    }
    const endDate = parseLocalDate(endDateValue);
    const today = getStartOfToday();
    if (!endDate || endDate <= today) {
      createModal({
        title: "Future End Date Required",
        body: `
        <div
          class="cpt-schedule-message"
        >
          <p>
            The end date for
            <strong>
              ${escapeHtml5(studentName)}
            </strong>
            must be later than today.
          </p>
        </div>
      `,
        focusEndDateStudentId: String(student.id)
      });
      return;
    }
    const missingItems = student.missingSubmissionItems || [];
    if (!missingItems.length) {
      createModal({
        title: "No Work to Schedule",
        body: `
        <div
          class="cpt-schedule-message"
        >
          <p>
            ${escapeHtml5(studentName)}
            has submitted all currently selected
            required items.
          </p>
        </div>
      `
      });
      return;
    }
    const weeks = createScheduleWeeks(
      today,
      endDate
    );
    const weightedItems = addWeightsToMissingItems({
      missingItems,
      assignments
    });
    distributeItemsAcrossWeeks(
      weightedItems,
      weeks
    );
    const summaryParts = [
      `${missingItems.length} required item${missingItems.length === 1 ? "" : "s"} remaining`,
      `${weeks.length} week${weeks.length === 1 ? "" : "s"} remaining`
    ];
    createModal({
      title: `${studentName} \u2014 Weekly Success Plan`,
      showPrintButton: true,
      body: `
      <div
        class="cpt-student-schedule-sheet"
      >
        <header
          class="cpt-schedule-print-header"
        >
          <h1>Weekly Success Plan</h1>

          <div
            class="cpt-schedule-student-name"
          >
            ${escapeHtml5(studentName)}
          </div>

          <div
            class="cpt-schedule-date-range"
          >
            ${escapeHtml5(
        formatDate(today)
      )}
            through
            ${escapeHtml5(
        formatDate(endDate)
      )}
          </div>

          <p>
            ${escapeHtml5(
        summaryParts.join(" \u2022 ")
      )}
          </p>
        </header>

        <div
          class="cpt-schedule-weeks"
        >
          ${weeks.map(renderWeek).join("")}
        </div>

        <footer
          class="cpt-schedule-print-footer"
        >
          <p>
            Complete all learning material for each listed module.
            The checklist shows required items that have not yet
            been submitted.
        </p>

          
        </footer>
      </div>
    `
    });
  }
  function bindStudentScheduleButtons({
    panel,
    students = [],
    endDates = {},
    assignments = []
  } = {}) {
    const studentsById = new Map(
      students.map((student) => [
        String(student.id),
        student
      ])
    );
    panel.querySelectorAll(
      ".cpt-radar-schedule-button[data-student-id]"
    ).forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const studentId = button.dataset.studentId;
          const student = studentsById.get(
            String(studentId)
          );
          if (!student) {
            return;
          }
          openStudentSchedule({
            student,
            endDateValue: endDates[String(studentId)] || "",
            assignments
          });
        }
      );
    });
  }
  var init_studentSchedule = __esm({
    "src/people/studentSchedule.js"() {
    }
  });

  // src/people/peopleStorage.js
  function getEndDateKey(courseId) {
    return `wayfinder_student_radar_end_dates_${courseId}`;
  }
  async function loadEndDates(courseId) {
    const key = getEndDateKey(courseId);
    const result = await chrome.storage.local.get(key);
    return result[key] || {};
  }
  async function saveEndDate(courseId, studentId, endDate) {
    const key = getEndDateKey(courseId);
    const result = await chrome.storage.local.get(key);
    const endDates = result[key] || {};
    if (endDate) {
      endDates[String(studentId)] = endDate;
    } else {
      delete endDates[String(studentId)];
    }
    await chrome.storage.local.set({
      [key]: endDates
    });
  }
  function getRequiredItemsKey(courseId) {
    return `wayfinder_student_radar_required_items_${courseId}`;
  }
  async function loadRequiredItemIds(courseId) {
    const key = getRequiredItemsKey(courseId);
    const result = await chrome.storage.local.get(key);
    return Array.isArray(result[key]) ? result[key].map(String) : null;
  }
  async function saveRequiredItemIds(courseId, assignmentIds) {
    const key = getRequiredItemsKey(courseId);
    const cleanIds = Array.from(
      new Set((assignmentIds || []).map(String))
    );
    await chrome.storage.local.set({
      [key]: cleanIds
    });
  }
  function getRadarUiStateKey(courseId) {
    return `wayfinder_student_radar_ui_${courseId}`;
  }
  async function loadRadarUiState(courseId) {
    const key = getRadarUiStateKey(courseId);
    const result = await chrome.storage.local.get(key);
    return {
      collapsed: Boolean(result[key]?.collapsed)
    };
  }
  async function saveRadarUiState(courseId, uiState) {
    const key = getRadarUiStateKey(courseId);
    await chrome.storage.local.set({
      [key]: {
        collapsed: Boolean(uiState?.collapsed)
      }
    });
  }
  var init_peopleStorage = __esm({
    "src/people/peopleStorage.js"() {
    }
  });

  // src/people/peopleApp.js
  function loadRadarStyles() {
    if (document.getElementById("wayfinder-radar-css")) {
      return;
    }
    const link = document.createElement("link");
    link.id = "wayfinder-radar-css";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("people/radar.css");
    document.head.appendChild(link);
  }
  function getCourseIdFromUrl() {
    const match = window.location.pathname.match(
      /\/courses\/(\d+)\/users/
    );
    return match ? match[1] : null;
  }
  function getDefaultRequiredItemIds(assignments) {
    return assignments.filter((assignment) => {
      const name = String(
        assignment.name || ""
      ).toLowerCase();
      return name.includes("training") || name.includes("assessment");
    }).map((assignment) => String(assignment.id));
  }
  function getStudentName2(student) {
    return student.name || student.sortable_name || "Unknown Student";
  }
  function getDaysSinceLastActivity2(student) {
    const enrollment = student.enrollments?.[0];
    const lastActivity = enrollment?.last_activity_at;
    if (!lastActivity) {
      return Number.POSITIVE_INFINITY;
    }
    const lastActivityTime = new Date(lastActivity).getTime();
    if (Number.isNaN(lastActivityTime)) {
      return Number.POSITIVE_INFINITY;
    }
    const differenceMs = Date.now() - lastActivityTime;
    return Math.max(
      0,
      Math.floor(
        differenceMs / (1e3 * 60 * 60 * 24)
      )
    );
  }
  function formatActivityDetail(daysSinceActivity) {
    if (!Number.isFinite(daysSinceActivity)) {
      return "No activity recorded";
    }
    if (daysSinceActivity === 0) {
      return "Active today";
    }
    if (daysSinceActivity === 1) {
      return "Last activity 1 day ago";
    }
    return `Last activity ${daysSinceActivity} days ago`;
  }
  function parseLocalDate2(dateValue) {
    if (!dateValue) {
      return null;
    }
    const match = String(dateValue).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );
    if (!match) {
      return null;
    }
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, monthIndex, day);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  }
  function getStartOfToday2() {
    const today = /* @__PURE__ */ new Date();
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
  }
  function getDaysUntilEndDate(endDateValue) {
    const endDate = parseLocalDate2(endDateValue);
    if (!endDate) {
      return null;
    }
    const today = getStartOfToday2();
    const differenceMs = endDate.getTime() - today.getTime();
    return Math.round(
      differenceMs / (1e3 * 60 * 60 * 24)
    );
  }
  function formatEndDateDetail(daysUntilEndDate) {
    if (daysUntilEndDate < 0) {
      const overdueDays = Math.abs(daysUntilEndDate);
      return overdueDays === 1 ? "End date overdue by 1 day" : `End date overdue by ${overdueDays} days`;
    }
    if (daysUntilEndDate === 0) {
      return "End date is today";
    }
    if (daysUntilEndDate === 1) {
      return "End date is tomorrow";
    }
    return `End date is in ${daysUntilEndDate} days`;
  }
  function buildRadarSummaryGroups(students, endDates) {
    const groups = {
      onTrack: [],
      watchList: [],
      atRisk: [],
      inactive: [],
      endDateAlert: []
    };
    for (const student of students) {
      const isComplete = student.submittedPercent === 100 && student.gradedPercent === 100;
      if (isComplete) {
        continue;
      }
      const name = getStudentName2(student);
      const daysSinceActivity = getDaysSinceLastActivity2(student);
      const activityEntry = {
        id: String(student.id),
        name,
        detail: formatActivityDetail(daysSinceActivity)
      };
      if (!Number.isFinite(daysSinceActivity) || daysSinceActivity >= 100) {
        groups.inactive.push(activityEntry);
      } else if (daysSinceActivity >= 10) {
        groups.atRisk.push(activityEntry);
      } else if (daysSinceActivity >= 5) {
        groups.watchList.push(activityEntry);
      } else {
        groups.onTrack.push(activityEntry);
      }
      const endDateValue = endDates[String(student.id)];
      const daysUntilEndDate = getDaysUntilEndDate(endDateValue);
      if (daysUntilEndDate !== null && daysUntilEndDate <= 10) {
        groups.endDateAlert.push({
          id: String(student.id),
          name,
          detail: formatEndDateDetail(
            daysUntilEndDate
          )
        });
      }
    }
    return groups;
  }
  function bindStudentFilters(panel) {
    const hideInactiveCheckbox = panel.querySelector(
      "#cpt-hide-inactive"
    );
    const hideCompleteCheckbox = panel.querySelector(
      "#cpt-hide-complete"
    );
    function applyFilters() {
      const hideInactive = hideInactiveCheckbox?.checked ?? true;
      const hideComplete = hideCompleteCheckbox?.checked ?? true;
      const studentRows = panel.querySelectorAll(
        "[data-radar-student-row]"
      );
      for (const row of studentRows) {
        const inactiveDays = Number(
          row.dataset.inactiveDays
        );
        const submittedPercent = Number(
          row.dataset.submittedPercent
        );
        const gradedPercent = Number(
          row.dataset.gradedPercent
        );
        const isInactive = row.dataset.inactiveDays === "Infinity" || Number.isFinite(inactiveDays) && inactiveDays >= 100;
        const isComplete = submittedPercent === 100 && gradedPercent === 100;
        row.hidden = hideInactive && isInactive || hideComplete && isComplete;
      }
    }
    hideInactiveCheckbox?.addEventListener(
      "change",
      applyFilters
    );
    hideCompleteCheckbox?.addEventListener(
      "change",
      applyFilters
    );
    applyFilters();
  }
  function bindEndDateInputs({
    panel,
    courseId
  }) {
    const endDateInputs = panel.querySelectorAll(
      ".cpt-end-date[data-student-id]"
    );
    for (const input of endDateInputs) {
      const originalValue = input.value;
      input.addEventListener("blur", async () => {
        const studentId = input.dataset.studentId;
        const endDate = input.value;
        if (!studentId) {
          return;
        }
        if (endDate === originalValue) {
          return;
        }
        const isValidDate = endDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(endDate);
        if (!isValidDate) {
          return;
        }
        input.disabled = true;
        try {
          await saveEndDate(
            courseId,
            studentId,
            endDate
          );
          panel.remove();
          await initializePeopleView();
        } catch (error) {
          console.error(
            "Wayfinder could not save the student end date:",
            error
          );
          input.disabled = false;
        }
      });
    }
  }
  function bindRequiredItemsPanel({
    panel,
    courseId,
    assignments
  }) {
    const openButton = panel.querySelector(
      "#cpt-radar-required-button"
    );
    const requiredPanel = panel.querySelector(
      ".cpt-radar-required-panel"
    );
    const closeButton = panel.querySelector(
      ".cpt-radar-required-close"
    );
    const saveButton = panel.querySelector(
      ".cpt-radar-required-save"
    );
    const resetButton = panel.querySelector(
      ".cpt-radar-required-reset"
    );
    if (!openButton || !requiredPanel) {
      return;
    }
    async function saveSelection() {
      const checkedIds = Array.from(
        panel.querySelectorAll(
          ".cpt-radar-required-checkbox:checked"
        )
      ).map(
        (checkbox) => String(checkbox.value)
      );
      await saveRequiredItemIds(
        courseId,
        checkedIds
      );
      panel.remove();
      await initializePeopleView();
    }
    openButton.addEventListener(
      "click",
      async () => {
        if (requiredPanel.hidden) {
          requiredPanel.hidden = false;
          return;
        }
        openButton.disabled = true;
        try {
          await saveSelection();
        } catch (error) {
          console.error(
            "Wayfinder could not save required items:",
            error
          );
          openButton.disabled = false;
        }
      }
    );
    closeButton?.addEventListener(
      "click",
      () => {
        requiredPanel.hidden = true;
      }
    );
    saveButton?.addEventListener(
      "click",
      async () => {
        saveButton.disabled = true;
        try {
          await saveSelection();
        } catch (error) {
          console.error(
            "Wayfinder could not save required items:",
            error
          );
          saveButton.disabled = false;
        }
      }
    );
    resetButton?.addEventListener(
      "click",
      async () => {
        resetButton.disabled = true;
        try {
          const defaultIds = getDefaultRequiredItemIds(assignments);
          await saveRequiredItemIds(
            courseId,
            defaultIds
          );
          panel.remove();
          await initializePeopleView();
        } catch (error) {
          console.error(
            "Wayfinder could not reset required items:",
            error
          );
          resetButton.disabled = false;
        }
      }
    );
  }
  function removeRadarUi() {
    document.querySelector("#cpt-progress-tracker")?.remove();
    document.querySelector("#cpt-radar-collapsed-tab")?.remove();
  }
  function createRadarCollapsedTab(courseId) {
    document.querySelector("#cpt-radar-collapsed-tab")?.remove();
    const tab = document.createElement("button");
    tab.id = "cpt-radar-collapsed-tab";
    tab.className = "cpt-radar-collapsed-tab";
    tab.type = "button";
    tab.title = "Open Wayfinder Student Radar";
    tab.setAttribute(
      "aria-label",
      "Open Wayfinder Student Radar"
    );
    tab.innerHTML = `
    <span class="cpt-radar-collapsed-tab-text">
      Student Radar
    </span>

    <span
      class="cpt-radar-collapsed-tab-arrow"
      aria-hidden="true"
    >
      \u2039
    </span>
  `;
    tab.addEventListener("click", async () => {
      tab.disabled = true;
      try {
        await saveRadarUiState(courseId, {
          collapsed: false
        });
        tab.remove();
        await initializePeopleView();
      } catch (error) {
        console.error(
          "Wayfinder could not reopen Student Radar:",
          error
        );
        tab.disabled = false;
      }
    });
    document.body.appendChild(tab);
  }
  function bindRadarThemeMenu({
    panel,
    courseId
  }) {
    const themeButton = panel.querySelector(
      "#cpt-theme-button"
    );
    const themeMenu = panel.querySelector(
      "#cpt-theme-menu"
    );
    if (!themeButton || !themeMenu) {
      return;
    }
    themeButton.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = themeMenu.hidden;
        themeMenu.hidden = !willOpen;
        themeButton.setAttribute(
          "aria-expanded",
          String(willOpen)
        );
      }
    );
    themeMenu.querySelectorAll("[data-theme]").forEach((button) => {
      button.addEventListener(
        "click",
        async () => {
          const themeId = getTheme(
            button.dataset.theme
          ).id;
          applyTheme(themeId);
          themeMenu.hidden = true;
          themeButton.setAttribute(
            "aria-expanded",
            "false"
          );
          const currentUiState = await loadUiState(courseId);
          await saveUiState(courseId, {
            ...currentUiState,
            theme: themeId
          });
        }
      );
    });
    document.addEventListener(
      "click",
      (event) => {
        if (themeMenu.hidden || themeMenu.contains(event.target) || themeButton.contains(event.target)) {
          return;
        }
        themeMenu.hidden = true;
        themeButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    );
  }
  function bindRadarCollapseButton({
    panel,
    courseId
  }) {
    const collapseButton = panel.querySelector(
      "#cpt-radar-collapse"
    );
    collapseButton?.addEventListener(
      "click",
      async () => {
        collapseButton.disabled = true;
        try {
          await saveRadarUiState(courseId, {
            collapsed: true
          });
          panel.remove();
          createRadarCollapsedTab(courseId);
        } catch (error) {
          console.error(
            "Wayfinder could not collapse Student Radar:",
            error
          );
          collapseButton.disabled = false;
        }
      }
    );
  }
  async function initializePeopleView() {
    loadRadarStyles();
    const courseId = getCourseIdFromUrl();
    if (!courseId) {
      return;
    }
    const wayfinderUiState = await loadUiState(courseId);
    const activeTheme = getTheme(wayfinderUiState.theme);
    applyTheme(activeTheme.id);
    removeRadarUi();
    const radarUiState = await loadRadarUiState(courseId);
    if (radarUiState.collapsed) {
      createRadarCollapsedTab(courseId);
      return;
    }
    const panel = document.createElement("div");
    panel.id = "cpt-progress-tracker";
    panel.innerHTML = renderStudentRadar({
      students: [],
      assignments: [],
      selectedAssignmentIds: [],
      endDates: {},
      loading: true,
      error: null
    });
    document.body.appendChild(panel);
    try {
      const students = await getCourseStudents(courseId);
      const assignments = await getRadarAssignments(courseId);
      const endDates = await loadEndDates(courseId);
      const storedRequiredItemIds = await loadRequiredItemIds(courseId);
      const defaultRequiredItemIds = getDefaultRequiredItemIds(assignments);
      const selectedAssignmentIds = storedRequiredItemIds === null ? defaultRequiredItemIds : storedRequiredItemIds;
      const selectedIdSet = new Set(
        selectedAssignmentIds.map(String)
      );
      const selectedAssignments = assignments.filter(
        (assignment) => selectedIdSet.has(String(assignment.id))
      );
      const radarSubmissions = await getRadarSubmissions(
        courseId,
        selectedAssignmentIds
      );
      const submissionsByStudentId = /* @__PURE__ */ new Map();
      for (const submission of radarSubmissions) {
        const studentId = String(
          submission.user_id
        );
        if (!submissionsByStudentId.has(studentId)) {
          submissionsByStudentId.set(
            studentId,
            []
          );
        }
        submissionsByStudentId.get(studentId).push(submission);
      }
      const totalRequiredItems = selectedAssignments.length;
      const studentsWithProgress = students.map(
        (student) => {
          const studentSubmissions = submissionsByStudentId.get(
            String(student.id)
          ) || [];
          const submissionsByAssignmentId = /* @__PURE__ */ new Map();
          for (const submission of studentSubmissions) {
            submissionsByAssignmentId.set(
              String(submission.assignment_id),
              submission
            );
          }
          const missingSubmissionItems = [];
          const ungradedItems = [];
          for (const assignment of selectedAssignments) {
            const submission = submissionsByAssignmentId.get(
              String(assignment.id)
            );
            const hasBeenSubmitted = Boolean(
              submission?.submitted_at
            );
            const hasBeenGraded = submission?.workflow_state === "graded" && submission?.grade !== null && submission?.grade !== void 0;
            if (!hasBeenSubmitted) {
              missingSubmissionItems.push({
                id: assignment.id,
                name: assignment.name,
                moduleName: assignment.moduleName,
                status: "Not submitted"
              });
            }
            if (!hasBeenGraded) {
              ungradedItems.push({
                id: assignment.id,
                name: assignment.name,
                moduleName: assignment.moduleName,
                status: hasBeenSubmitted ? "Submitted, awaiting grade" : "Not submitted"
              });
            }
          }
          const submittedCount = totalRequiredItems - missingSubmissionItems.length;
          const gradedCount = totalRequiredItems - ungradedItems.length;
          return {
            ...student,
            submittedPercent: totalRequiredItems === 0 ? null : Math.round(
              submittedCount / totalRequiredItems * 100
            ),
            gradedPercent: totalRequiredItems === 0 ? null : Math.round(
              gradedCount / totalRequiredItems * 100
            ),
            missingSubmissionItems,
            ungradedItems
          };
        }
      );
      const summaryGroups = buildRadarSummaryGroups(
        studentsWithProgress,
        endDates
      );
      panel.innerHTML = renderStudentRadar({
        students: studentsWithProgress,
        assignments,
        selectedAssignmentIds,
        endDates,
        summaryGroups,
        loading: false,
        error: null
      });
      bindRequiredItemsPanel({
        panel,
        courseId,
        assignments
      });
      bindStudentFilters(panel);
      bindEndDateInputs({
        panel,
        courseId
      });
      bindRadarCollapseButton({
        panel,
        courseId
      });
      bindRadarThemeMenu({
        panel,
        courseId
      });
      bindStudentScheduleButtons({
        panel,
        students: studentsWithProgress,
        endDates,
        assignments: selectedAssignments
      });
      initializeRadarTooltips(panel);
    } catch (error) {
      console.error(
        "Wayfinder Student Radar error:",
        error
      );
      panel.innerHTML = renderStudentRadar({
        students: [],
        assignments: [],
        selectedAssignmentIds: [],
        endDates: {},
        loading: false,
        error: error.message
      });
    }
  }
  var init_peopleApp = __esm({
    "src/people/peopleApp.js"() {
      init_peopleApi();
      init_peopleRenderer();
      init_rules();
      init_themes();
      init_radarTooltips();
      init_studentSchedule();
      init_peopleStorage();
    }
  });

  // src/ui/shell.js
  function removeExistingUI(extensionId, tabId) {
    document.getElementById(extensionId)?.remove();
    document.getElementById(tabId)?.remove();
  }
  function createShell({
    extensionId,
    tabId,
    collapsed,
    createCollapsedTab: createCollapsedTab2,
    bindHeaderButtons
  }) {
    removeExistingUI(extensionId, tabId);
    if (collapsed) {
      createCollapsedTab2();
      return null;
    }
    const wrapper = document.createElement("aside");
    wrapper.id = extensionId;
    wrapper.setAttribute("aria-label", "Canvas module progress tracker");
    wrapper.innerHTML = `
    <div class="cpt-header">
      <div>
        <strong>Module Progress</strong>
        <span>Loading...</span>
      </div>
      <div class="cpt-header-actions">
        <button id="cpt-collapse" type="button" title="Collapse panel">\u2013</button>
        <button id="cpt-refresh" type="button" title="Refresh progress">\u21BB</button>
      </div>
    </div>
    <div class="cpt-loading">Loading Canvas progress...</div>
  `;
    document.body.appendChild(wrapper);
    bindHeaderButtons();
    return wrapper;
  }
  function createCollapsedTab({ tabId, onOpen }) {
    const tab = document.createElement("button");
    tab.id = tabId;
    tab.type = "button";
    tab.innerHTML = `<span>Progress</span><strong>\u203A</strong>`;
    tab.title = "Open Module Progress";
    tab.addEventListener("click", onOpen);
    document.body.appendChild(tab);
  }
  function renderError({ wrapper, error, escapeHtml: escapeHtml6, bindHeaderButtons }) {
    if (!wrapper) return;
    wrapper.innerHTML = `
    <div class="cpt-header">
      <div>
        <strong>Module Progress</strong>
        <span>Error</span>
      </div>
      <div class="cpt-header-actions">
        <button id="cpt-collapse" type="button" title="Collapse panel">\u2013</button>
        <button id="cpt-refresh" type="button" title="Refresh progress">\u21BB</button>
      </div>
    </div>
    <div class="cpt-error">
      <strong>Could not load Canvas API data.</strong>
      <p>${escapeHtml6(error.message)}</p>
      <p>Make sure you are not in Canvas Student View.</p>
    </div>
  `;
    bindHeaderButtons();
  }
  var init_shell = __esm({
    "src/ui/shell.js"() {
    }
  });

  // src/ui/settings.js
  function renderSettingsPanel({
    moduleId,
    data,
    rules,
    requiredKeywords,
    isTextHeaderItem: isTextHeaderItem2,
    isRequiredTitle: isRequiredTitle2,
    cleanText: cleanText2,
    escapeHtml: escapeHtml6
  }) {
    const module = data.modules.find((m) => String(m.id) === String(moduleId));
    if (!module) return "";
    const items = data.moduleItemsByModuleId[module.id] || [];
    const rule = rules[String(module.id)] || null;
    const selectedIds = new Set(
      rule && rule.mode === "custom" ? (rule.requiredItemIds || []).map(String) : items.filter((item) => !isTextHeaderItem2(item) && isRequiredTitle2(item.title, requiredKeywords)).map((item) => String(item.id))
    );
    const itemRows = items.map((item) => {
      const isHeader = isTextHeaderItem2(item);
      const checked = selectedIds.has(String(item.id)) ? "checked" : "";
      const disabled = isHeader ? "disabled" : "";
      const labelSuffix = isHeader ? "Text Header - ignored" : item.type || "Item";
      return `
        <label class="cpt-rule-item ${isHeader ? "cpt-rule-disabled" : ""}">
          <input type="checkbox" class="cpt-rule-checkbox" value="${item.id}" ${checked} ${disabled}>
          <span>
            <strong>${escapeHtml6(cleanText2(item.title || "Untitled item"))}</strong>
            <small>${escapeHtml6(labelSuffix)}</small>
          </span>
        </label>
      `;
    }).join("");
    return `
    <section class="cpt-settings-panel" data-module-id="${module.id}">
      <div class="cpt-settings-head">
        <div>
          <strong>Requirements</strong>
          <span>${escapeHtml6(module.name)}</span>
        </div>
        <button class="cpt-close-settings" type="button">\xD7</button>
      </div>
      <p>Select the items that count toward completion for this module.</p>
      <div class="cpt-rule-list">${itemRows}</div>
      <div class="cpt-settings-actions">
        <button class="cpt-save-rules" type="button" data-module-id="${module.id}">Save Custom Rules</button>
        <button class="cpt-reset-rules" type="button" data-module-id="${module.id}">Use Keyword Rules</button>
      </div>
    </section>
  `;
  }
  var init_settings = __esm({
    "src/ui/settings.js"() {
    }
  });

  // src/progress/engine.js
  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
  function isRequiredTitle(title, requiredKeywords) {
    const lowered = cleanText(title).toLowerCase();
    return requiredKeywords.some((keyword) => lowered.includes(keyword));
  }
  function isTextHeaderItem(item) {
    const type = String(item.type || "").toLowerCase();
    return type === "subheader" || type === "text_header" || type === "contextmoduleheader";
  }
  function getAssignmentIdFromModuleItem(item) {
    if (item.assignment_id) return Number(item.assignment_id);
    if ((item.type === "Assignment" || item.type === "Quiz" || item.type === "ExternalTool") && item.content_id) {
      return Number(item.content_id);
    }
    return null;
  }
  function getRequiredItemsForModule(module, moduleItems, rules, requiredKeywords) {
    const rule = rules[String(module.id)] || null;
    if (rule && rule.mode === "custom") {
      const selectedIds = new Set((rule.requiredItemIds || []).map(String));
      return moduleItems.filter((item) => selectedIds.has(String(item.id)));
    }
    return moduleItems.filter((item) => {
      if (isTextHeaderItem(item)) return false;
      return isRequiredTitle(item.title, requiredKeywords);
    });
  }
  function calculateGradePercent(score, pointsPossible) {
    return Math.round(score / pointsPossible * 100);
  }
  function createStatusResult({
    item,
    title,
    status,
    complete = false,
    percent = null,
    detail = "",
    score = null,
    pointsPossible = null
  }) {
    return {
      id: item.id,
      title,
      type: item.type || "Unknown",
      status,
      complete,
      percent,
      score,
      pointsPossible,
      detail
    };
  }
  function analyzeItem(item, data, passingPercent) {
    const title = cleanText(item.title || "Untitled item");
    const assignmentId = getAssignmentIdFromModuleItem(item);
    if (!assignmentId) {
      return createStatusResult({
        item,
        title,
        status: "info_only",
        complete: false,
        detail: "Shown in tracker, but not counted toward progress."
      });
    }
    const assignment = data.assignmentMap.get(Number(assignmentId));
    const submission = data.submissionMap.get(Number(assignmentId));
    if (!assignment || assignment._cpt_error) {
      return createStatusResult({
        item,
        title,
        status: "error",
        detail: assignment?._cpt_error || "Assignment data unavailable."
      });
    }
    if (!submission || submission._cpt_error || submission._cpt_unavailable) {
      return createStatusResult({
        item,
        title,
        status: "waiting",
        detail: "Submission data unavailable for this view."
      });
    }
    const workflow = String(submission.workflow_state || "").toLowerCase();
    const submittedAt = submission.submitted_at;
    if (!submittedAt || workflow === "unsubmitted") {
      return createStatusResult({
        item,
        title,
        status: "missing",
        detail: "No submission found."
      });
    }
    const score = submission.score === null || submission.score === void 0 ? null : Number(submission.score);
    if (score === null || Number.isNaN(score)) {
      return createStatusResult({
        item,
        title,
        status: "waiting",
        detail: "Submitted, waiting for grade."
      });
    }
    const pointsPossible = Number(assignment.points_possible);
    if (!pointsPossible || Number.isNaN(pointsPossible)) {
      return createStatusResult({
        item,
        title,
        status: "graded_no_points",
        detail: `Score ${score}; points possible unavailable.`
      });
    }
    const percent = calculateGradePercent(score, pointsPossible);
    const complete = percent >= passingPercent;
    return createStatusResult({
      item,
      title,
      status: complete ? "passed" : "below_passing",
      complete,
      percent,
      score,
      pointsPossible,
      detail: `${score}/${pointsPossible} = ${percent}%`
    });
  }
  function analyzeModules(data, rules, requiredKeywords, passingPercent) {
    return data.modules.map((module) => {
      const items = data.moduleItemsByModuleId[module.id] || [];
      const requiredItems = getRequiredItemsForModule(
        module,
        items,
        rules,
        requiredKeywords
      );
      const analyzedItems = requiredItems.map(
        (item) => analyzeItem(item, data, passingPercent)
      );
      const progressItems = analyzedItems.filter((item) => item.status !== "info_only");
      const total = progressItems.length;
      const complete = progressItems.filter((item) => item.complete).length;
      const percent = total === 0 ? 0 : Math.round(complete / total * 100);
      const rule = rules[String(module.id)] || null;
      return {
        id: module.id,
        name: module.name,
        ruleMode: rule?.mode || "keyword",
        total,
        complete,
        percent,
        items: analyzedItems
      };
    });
  }
  var init_engine = __esm({
    "src/progress/engine.js"() {
    }
  });

  // src/api/canvas.js
  async function canvasFetch(path) {
    const response = await fetch(path, {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Canvas API error ${response.status}: ${response.statusText} at ${path}`);
    }
    return response.json();
  }
  async function canvasFetchAll2(path) {
    let url = path;
    let results = [];
    while (url) {
      const response = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        throw new Error(`Canvas API error ${response.status}: ${response.statusText} at ${url}`);
      }
      const data = await response.json();
      results = results.concat(data);
      const link = response.headers.get("Link");
      url = getNextLink(link);
    }
    return results;
  }
  function getNextLink(linkHeader) {
    if (!linkHeader) return null;
    for (const link of linkHeader.split(",")) {
      const parts = link.split(";");
      if (parts.length >= 2 && parts[1].trim() === 'rel="next"') {
        return parts[0].trim().slice(1, -1);
      }
    }
    return null;
  }
  var init_canvas = __esm({
    "src/api/canvas.js"() {
    }
  });

  // src/api/roles.js
  function detectRoleFromPermissions(course) {
    const permissions = course?.permissions || {};
    const enrollmentTypes = (course?.enrollments || []).map(
      (enrollment) => String(enrollment.type || "").toLowerCase()
    );
    const instructorSignals = [
      permissions.manage_assignments,
      permissions.manage_grades,
      permissions.manage_students,
      permissions.update
    ];
    const instructorEnrollment = enrollmentTypes.some(
      (type) => type.includes("teacher") || type.includes("ta") || type.includes("designer")
    );
    return instructorSignals.some(Boolean) || instructorEnrollment ? "instructor" : "student";
  }
  var init_roles = __esm({
    "src/api/roles.js"() {
    }
  });

  // src/ui/panel.js
  function getStatusInfo(item) {
    switch (item.status) {
      case "passed":
        return { icon: "\u2713", label: "Passed", className: "cpt-item-complete" };
      case "below_passing":
        return { icon: "!", label: "Below 80%", className: "cpt-item-warning" };
      case "waiting":
        return { icon: "\u2026", label: "Waiting for grade", className: "cpt-item-waiting" };
      case "missing":
        return { icon: "\u25CB", label: "Missing", className: "cpt-item-incomplete" };
      case "info_only":
        return { icon: "i", label: "Info only", className: "cpt-item-muted" };
      default:
        return { icon: "!", label: "Error", className: "cpt-item-error" };
    }
  }
  function renderItem(item, escapeHtml6) {
    const statusInfo = getStatusInfo(item);
    const gradeText = item.percent === null ? "" : ` <span class="cpt-grade">(${item.percent}%)</span>`;
    return `
    <li class="${statusInfo.className}">
      <span class="cpt-icon">${statusInfo.icon}</span>
      <span>
        <strong>${escapeHtml6(item.title)}</strong>${gradeText}
        <small>${escapeHtml6(statusInfo.label)} \xB7 ${escapeHtml6(item.detail || "")}</small>
      </span>
    </li>
  `;
  }
  function renderModule(module, index, isInstructor, settingsPanel, renderItem2, escapeHtml6) {
    const itemList = module.items.length ? module.items.map((item) => renderItem2(item, escapeHtml6)).join("") : `<li class="cpt-item-muted">No required items found.</li>`;
    const ruleBadge = isInstructor ? `<span class="cpt-rule-badge">${module.ruleMode === "custom" ? "Custom" : "Keyword"}</span>` : "";
    const settingsButton = isInstructor ? `<button class="cpt-settings-btn" type="button" data-module-id="${module.id}" title="Set requirements">\u2699</button>` : "";
    return `
    <details class="cpt-module-row" ${index === 0 ? "open" : ""}>
      <summary>
        ${isInstructor ? `<div class="cpt-module-actions">${ruleBadge}${settingsButton}</div>` : ""}
        <div class="cpt-module-topline">
          <span class="cpt-module-title">${escapeHtml6(module.name)}</span>
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
  function renderTracker({
    wrapper,
    courseId,
    data,
    analyzedModules,
    isInstructor,
    showSettingsForModuleId,
    renderSettingsPanel: renderSettingsPanel2,
    renderItem: renderItem2,
    escapeHtml: escapeHtml6,
    bindEvents,
    debugMode,
    passingPercent,
    theme,
    themeLogo,
    themes
  }) {
    if (!wrapper) return;
    const allAnalyzedItems = analyzedModules.flatMap((m) => m.items);
    const overallTotal = allAnalyzedItems.length;
    const overallComplete = allAnalyzedItems.filter((i) => i.complete).length;
    const overallPercent = overallTotal === 0 ? 0 : Math.round(overallComplete / overallTotal * 100);
    const waitingCount = allAnalyzedItems.filter((i) => i.status === "waiting").length;
    const belowCount = allAnalyzedItems.filter((i) => i.status === "below_passing").length;
    const missingCount = allAnalyzedItems.filter((i) => i.status === "missing").length;
    const customRuleCount = analyzedModules.filter((m) => m.ruleMode === "custom").length;
    const moduleRows = analyzedModules.map((module, index) => {
      const settingsPanel = isInstructor && String(showSettingsForModuleId) === String(module.id) ? renderSettingsPanel2(module.id, data) : "";
      return renderModule(
        module,
        index,
        isInstructor,
        settingsPanel,
        renderItem2,
        escapeHtml6
      );
    }).join("");
    const debugPanel = isInstructor && debugMode ? `
      <details class="cpt-debug">
        <summary>Developer</summary>
        <dl>
          <div><dt>Detected Role</dt><dd>${escapeHtml6(data.role)}</dd></div>
          <div><dt>API Status</dt><dd>Connected</dd></div>
          <div><dt>Modules</dt><dd>${data.modules.length}</dd></div>
          <div><dt>Custom Rule Modules</dt><dd>${customRuleCount}</dd></div>
          <div><dt>Module Items</dt><dd>${Object.values(data.moduleItemsByModuleId).flat().length}</dd></div>
          <div><dt>Required Items</dt><dd>${overallTotal}</dd></div>
          <div><dt>Passed</dt><dd>${overallComplete}</dd></div>
          <div><dt>Waiting</dt><dd>${waitingCount}</dd></div>
          <div><dt>Below 80%</dt><dd>${belowCount}</dd></div>
          <div><dt>Missing</dt><dd>${missingCount}</dd></div>
          <div><dt>Load Time</dt><dd>${data.elapsedMs} ms</dd></div>
        </dl>
      </details>
    ` : "";
    wrapper.innerHTML = `
    <div class="cpt-header">
      <div class="cpt-header-title">
        <img
          class="cpt-header-logo"
          src="${chrome.runtime.getURL(themeLogo)}"
          alt=""
        >
        <div class="cpt-header-copy">
          <h2>Wayfinder</h2>
        </div>
      </div>

      <div class="cpt-header-actions">    

        <button id="cpt-theme-button" type="button" title="Appearance">
          \u2699
        </button>
        <div id="cpt-theme-menu" class="cpt-theme-menu" hidden>
          <button type="button" data-theme="ubtech">UBTech</button>
          <button type="button" data-theme="slate">Slate</button>
          <button type="button" data-theme="forest">Forest</button>
          <button type="button" data-theme="dark">Dark</button>
          <button type="button" data-theme="midnight">Midnight</button>
          <button type="button" data-theme="highcontrast">High Contrast</button>
        </div>
        <button id="cpt-collapse" type="button" title="Collapse panel">\u2013</button>
        <button id="cpt-refresh" type="button" title="Refresh progress">\u21BB</button>
      </div>
    </div>

    <div class="cpt-overall">
      <div class="cpt-module-topline">
        <span class="cpt-module-title">Overall Progress</span>
        <span class="cpt-module-percent">${overallPercent}%</span>
      </div>
      <div class="cpt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overallPercent}">
        <div class="cpt-bar-fill" style="width: ${overallPercent}%"></div>
      </div>
      <div class="cpt-status">${overallComplete}/${overallTotal} Completed</div>
    </div>

    <div class="cpt-summary">

      <div class="cpt-stat-card">
        <div class="cpt-stat-number">${overallComplete}</div>
        <div class="cpt-stat-label">Completed</div>
      </div>

      <div class="cpt-stat-card">
        <div class="cpt-stat-number">${waitingCount}</div>
        <div class="cpt-stat-label">Awaiting Grade</div>
      </div>

      <div class="cpt-stat-card">
        <div class="cpt-stat-number">${missingCount}</div>
        <div class="cpt-stat-label">Missing</div>
      </div>

      <div class="cpt-stat-card">
        <div class="cpt-stat-number">${belowCount}</div>
        <div class="cpt-stat-label">Below 80%</div>
      </div>

    </div>

    <div class="cpt-body">${moduleRows}</div>

    ${debugPanel}

    <div class="cpt-footer">
      Course ${escapeHtml6(courseId)} \xB7 ${escapeHtml6(data.user.name || data.user.login_id || "current user")}
    </div>
  `;
    bindEvents(wrapper);
  }
  var init_panel = __esm({
    "src/ui/panel.js"() {
    }
  });

  // src/app.js
  function initializeApp() {
    "use strict";
    const isPeoplePage = /\/courses\/\d+\/users/.test(window.location.pathname);
    if (isPeoplePage) {
      initializePeopleView();
      return;
    }
    const EXTENSION_ID = "cpt-progress-tracker";
    const TAB_ID = "cpt-progress-tab";
    const PASSING_PERCENT = 80;
    const REQUIRED_KEYWORDS = ["training", "important", "assessment"];
    const DEBUG_MODE = true;
    let appState = {
      courseId: null,
      data: null,
      modules: [],
      rules: {},
      showSettingsForModuleId: null,
      collapsed: false,
      theme: THEMES.ubtech.id,
      role: "student"
    };
    function getCourseIdFromUrl2() {
      const match = window.location.pathname.match(/\/courses\/(\d+)\/modules/);
      return match ? match[1] : null;
    }
    function cleanText2(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }
    function escapeHtml6(value) {
      return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }
    function removeExistingUI2() {
      document.getElementById(EXTENSION_ID)?.remove();
      document.getElementById(TAB_ID)?.remove();
    }
    function renderProgressTracker(wrapper, courseId, data, analyzedModules) {
      renderTracker({
        wrapper,
        courseId,
        data,
        analyzedModules,
        isInstructor: userIsInstructor(),
        showSettingsForModuleId: appState.showSettingsForModuleId,
        renderSettingsPanel: renderSettingsPanel2,
        renderItem,
        escapeHtml: escapeHtml6,
        bindEvents,
        debugMode: DEBUG_MODE,
        passingPercent: PASSING_PERCENT,
        theme: appState.theme,
        themes: THEMES,
        themeLogo: getTheme(appState.theme).logo
      });
    }
    function userIsInstructor() {
      return appState.role === "instructor";
    }
    function getRuleForModule(moduleId) {
      return appState.rules[String(moduleId)] || null;
    }
    function createShell2() {
      return createShell({
        extensionId: EXTENSION_ID,
        tabId: TAB_ID,
        collapsed: appState.collapsed,
        createCollapsedTab: createCollapsedTab2,
        bindHeaderButtons
      });
    }
    function createCollapsedTab2() {
      createCollapsedTab({
        tabId: TAB_ID,
        onOpen: async () => {
          appState.collapsed = false;
          await saveUiState2(appState.courseId, {
            collapsed: appState.collapsed,
            theme: appState.theme
          });
          await reloadDataAndRender();
        }
      });
    }
    function bindHeaderButtons() {
      document.getElementById("cpt-refresh")?.addEventListener("click", init);
      document.getElementById("cpt-collapse")?.addEventListener("click", async () => {
        appState.collapsed = true;
        await saveUiState2(appState.courseId, {
          collapsed: appState.collapsed,
          theme: appState.theme
        });
        removeExistingUI2();
        createCollapsedTab2();
      });
    }
    function renderError2(wrapper, error) {
      renderError({
        wrapper,
        error,
        escapeHtml: escapeHtml6,
        bindHeaderButtons
      });
    }
    async function getCanvasData(courseId) {
      const start = performance.now();
      const [user, course, modules] = await Promise.all([
        canvasFetch("/api/v1/users/self/profile").catch(() => ({ name: "current user" })),
        canvasFetch(`/api/v1/courses/${courseId}?include[]=permissions&include[]=enrollments`).catch(() => ({})),
        canvasFetchAll2(`/api/v1/courses/${courseId}/modules?per_page=100`)
      ]);
      const role = detectRoleFromPermissions(course);
      appState.role = role;
      const moduleItemsByModuleId = {};
      await Promise.all(modules.map(async (module) => {
        moduleItemsByModuleId[module.id] = await canvasFetchAll2(`/api/v1/courses/${courseId}/modules/${module.id}/items?per_page=100`);
        console.log("Wayfinder module item sample:", module.name, moduleItemsByModuleId[module.id]);
      }));
      const requiredItems = modules.flatMap(
        (module) => getRequiredItemsForModule(module, moduleItemsByModuleId[module.id] || [], appState.rules, REQUIRED_KEYWORDS)
      );
      const assignmentIds = Array.from(
        new Set(requiredItems.map(getAssignmentIdFromModuleItem).filter(Boolean))
      );
      const [assignments, submissions] = await Promise.all([
        assignmentIds.length ? Promise.all(assignmentIds.map(
          (id) => canvasFetch(`/api/v1/courses/${courseId}/assignments/${id}`).catch((error) => ({
            id,
            _cpt_error: error.message
          }))
        )) : Promise.resolve([]),
        assignmentIds.length ? Promise.all(assignmentIds.map(
          (id) => canvasFetch(`/api/v1/courses/${courseId}/assignments/${id}/submissions/self`).catch((error) => ({
            assignment_id: id,
            _cpt_error: error.message
          }))
        )) : Promise.resolve([])
      ]);
      return {
        user,
        course,
        role,
        modules,
        moduleItemsByModuleId,
        assignmentIds,
        assignmentMap: new Map(assignments.map((a) => [Number(a.id), a])),
        submissionMap: new Map(submissions.map((s) => [Number(s.assignment_id), s])),
        elapsedMs: Math.round(performance.now() - start)
      };
    }
    function renderSettingsPanel2(moduleId, data) {
      return renderSettingsPanel({
        moduleId,
        data,
        rules: appState.rules,
        requiredKeywords: REQUIRED_KEYWORDS,
        isTextHeaderItem,
        isRequiredTitle,
        cleanText: cleanText2,
        escapeHtml: escapeHtml6
      });
    }
    function bindEvents(wrapper) {
      bindHeaderButtons();
      const themeButton = wrapper.querySelector("#cpt-theme-button");
      const themeMenu = wrapper.querySelector("#cpt-theme-menu");
      themeButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        themeMenu.hidden = !themeMenu.hidden;
      });
      themeMenu?.querySelectorAll("[data-theme]").forEach((button) => {
        button.addEventListener("click", async () => {
          appState.theme = button.dataset.theme;
          applyTheme(appState.theme);
          themeMenu.hidden = true;
          await saveUiState2(appState.courseId, {
            collapsed: appState.collapsed,
            theme: appState.theme
          });
          rerender();
        });
      });
      wrapper.querySelectorAll(".cpt-settings-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          appState.showSettingsForModuleId = button.dataset.moduleId;
          rerender();
        });
      });
      wrapper.querySelector(".cpt-close-settings")?.addEventListener("click", () => {
        appState.showSettingsForModuleId = null;
        rerender();
      });
      wrapper.querySelector(".cpt-save-rules")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const moduleId = button.dataset.moduleId;
        const panel = wrapper.querySelector(`.cpt-settings-panel[data-module-id="${moduleId}"]`);
        const selectedIds = Array.from(panel.querySelectorAll(".cpt-rule-checkbox:checked")).map((checkbox) => checkbox.value);
        appState.rules[String(moduleId)] = {
          mode: "custom",
          requiredItemIds: selectedIds,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await saveRules(appState.courseId, appState.rules);
        appState.showSettingsForModuleId = null;
        await reloadDataAndRender();
      });
      wrapper.querySelector(".cpt-reset-rules")?.addEventListener("click", async (event) => {
        const moduleId = event.currentTarget.dataset.moduleId;
        delete appState.rules[String(moduleId)];
        await saveRules(appState.courseId, appState.rules);
        appState.showSettingsForModuleId = null;
        await reloadDataAndRender();
      });
    }
    function rerender() {
      const wrapper = document.getElementById(EXTENSION_ID);
      appState.modules = analyzeModules(
        appState.data,
        appState.rules,
        REQUIRED_KEYWORDS,
        PASSING_PERCENT
      );
      renderProgressTracker(wrapper, appState.courseId, appState.data, appState.modules);
    }
    async function reloadDataAndRender() {
      const wrapper = createShell2();
      if (!wrapper && appState.collapsed) return;
      appState.data = await getCanvasData(appState.courseId);
      appState.modules = analyzeModules(
        appState.data,
        appState.rules,
        REQUIRED_KEYWORDS,
        PASSING_PERCENT
      );
      renderProgressTracker(wrapper, appState.courseId, appState.data, appState.modules);
    }
    async function init() {
      const courseId = getCourseIdFromUrl2();
      if (!courseId) {
        const wrapper2 = createShell2();
        renderError2(wrapper2, new Error("Could not determine course ID from URL."));
        return;
      }
      appState.courseId = courseId;
      const uiState = await loadUiState(courseId);
      appState.collapsed = Boolean(uiState.collapsed);
      appState.theme = getTheme(uiState.theme).id;
      applyTheme(appState.theme);
      const wrapper = createShell2();
      if (!wrapper && appState.collapsed) return;
      try {
        appState.rules = await loadRules(courseId);
        appState.data = await getCanvasData(courseId);
        appState.modules = analyzeModules(
          appState.data,
          appState.rules,
          REQUIRED_KEYWORDS,
          PASSING_PERCENT
        );
        renderProgressTracker(wrapper, courseId, appState.data, appState.modules);
      } catch (error) {
        renderError2(wrapper, error);
      }
    }
    setTimeout(init, 1e3);
  }
  var init_app = __esm({
    "src/app.js"() {
      init_peopleApp();
      init_shell();
      init_settings();
      init_engine();
      init_canvas();
      init_roles();
      init_rules();
      init_panel();
      init_themes();
    }
  });

  // src/content/content.js
  var require_content = __commonJS({
    "src/content/content.js"() {
      init_app();
      initializeApp();
    }
  });
  require_content();
})();
//# sourceMappingURL=content.js.map
