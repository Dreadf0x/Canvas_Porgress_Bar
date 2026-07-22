const DAY_MS = 1000 * 60 * 60 * 24;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStudentName(student) {
  return (
    student?.name ||
    student?.sortable_name ||
    "Unknown Student"
  );
}

function getStartOfToday() {
  const now = new Date();

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

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function addDays(date, numberOfDays) {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);
  return result;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

/*
 * Supports module names such as:
 *
 * Module 7: Wireless Networks (10H)
 * Networking Fundamentals - 15 Hours
 * Security Basics 8 hrs
 */
function parseModuleHours(moduleName) {
  const match = String(moduleName || "").match(
    /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);

  return Number.isFinite(hours) && hours > 0
    ? hours
    : null;
}

function createScheduleWeeks(startDate, endDate) {
  const weeks = [];
  let weekStart = new Date(startDate);

  while (weekStart <= endDate) {
    const dayOfWeek = weekStart.getDay();

    /*
     * The first week starts today and ends Sunday.
     * Following weeks run Monday through Sunday.
     */
    const daysUntilSunday =
      dayOfWeek === 0
        ? 0
        : 7 - dayOfWeek;

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
      unknownHourItems: 0
    });

    weekStart = addDays(weekEnd, 1);
  }

  return weeks;
}

function buildModuleStats(assignments = []) {
  const stats = new Map();

  for (const assignment of assignments) {
    const moduleName =
      assignment.moduleName || "Other Required Items";

    if (!stats.has(moduleName)) {
      stats.set(moduleName, {
        moduleName,
        totalRequiredItems: 0,
        moduleHours: parseModuleHours(moduleName)
      });
    }

    stats.get(moduleName).totalRequiredItems += 1;
  }

  return stats;
}

function addWeightsToMissingItems({
  missingItems,
  assignments
}) {
  const moduleStats =
    buildModuleStats(assignments);

  return missingItems.map((item) => {
    const moduleName =
      item.moduleName || "Other Required Items";

    const stats = moduleStats.get(moduleName);

    const moduleHours =
      stats?.moduleHours ?? parseModuleHours(moduleName);

    const totalRequiredItems =
      stats?.totalRequiredItems || 1;

    const estimatedHours =
      moduleHours !== null
        ? moduleHours / totalRequiredItems
        : null;

    return {
      ...item,
      moduleName,
      estimatedHours,
      scheduleWeight:
        estimatedHours !== null
          ? estimatedHours
          : 1
    };
  });
}

function distributeItemsAcrossWeeks(
  weightedItems,
  weeks
) {
  if (!weeks.length) {
    return weeks;
  }

  const totalWeight = weightedItems.reduce(
    (sum, item) => sum + item.scheduleWeight,
    0
  );

  const targetWeight =
    totalWeight / weeks.length;

  let weekIndex = 0;
  let currentWeight = 0;

  weightedItems.forEach((item, itemIndex) => {
    const currentWeek = weeks[weekIndex];

    const remainingItems =
      weightedItems.length - itemIndex;

    const remainingWeeks =
      weeks.length - weekIndex;

    const canMoveForward =
      weekIndex < weeks.length - 1;

    const shouldMoveForward =
      canMoveForward &&
      currentWeek.items.length > 0 &&
      currentWeight + item.scheduleWeight >
        targetWeight &&
      remainingItems >= remainingWeeks;

    if (shouldMoveForward) {
      weekIndex += 1;
      currentWeight = 0;
    }

    const destinationWeek = weeks[weekIndex];

    destinationWeek.items.push(item);
    currentWeight += item.scheduleWeight;

    if (item.estimatedHours !== null) {
      destinationWeek.estimatedHours +=
        item.estimatedHours;
    } else {
      destinationWeek.unknownHourItems += 1;
    }
  });

  return weeks;
}

function formatWeeklyWorkload(week) {
  const parts = [];

  if (week.estimatedHours > 0) {
    const roundedHours =
      Math.round(week.estimatedHours * 10) / 10;

    parts.push(
      `approximately ${roundedHours} hour${
        roundedHours === 1 ? "" : "s"
      }`
    );
  }

  if (week.unknownHourItems > 0) {
    parts.push(
      `${week.unknownHourItems} item${
        week.unknownHourItems === 1 ? "" : "s"
      } without module-hour estimates`
    );
  }

  return parts.length
    ? parts.join(" plus ")
    : "No scheduled work";
}

function groupWeekItemsByModule(items) {
  const groups = [];

  for (const item of items) {
    const lastGroup = groups.at(-1);

    if (
      lastGroup &&
      lastGroup.moduleName === item.moduleName
    ) {
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
  const moduleGroups =
    groupWeekItemsByModule(week.items);

  const moduleHtml = moduleGroups.length
    ? moduleGroups
        .map(
          (group) => `
            <section class="cpt-schedule-module">
              <h4>
                ${escapeHtml(group.moduleName)}
              </h4>

              <ul class="cpt-schedule-task-list">
                ${group.items
                  .map(
                    (item) => `
                      <li>
                        <span
                          class="cpt-schedule-checkbox"
                          aria-hidden="true"
                        ></span>

                        <span>
                          ${escapeHtml(
                            item.name ||
                            "Unnamed required item"
                          )}
                        </span>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </section>
          `
        )
        .join("")
    : `
      <p class="cpt-schedule-empty-week">
        Catch-up, review, and completion week.
      </p>
    `;

  return `
    <article class="cpt-schedule-week">
      <div class="cpt-schedule-week-header">
        <div>
          <h3>Week ${index + 1}</h3>

          <span>
            ${escapeHtml(
              formatShortDate(week.startDate)
            )}
            –
            ${escapeHtml(
              formatShortDate(week.endDate)
            )}
          </span>
        </div>

        <strong>
          ${escapeHtml(
            formatWeeklyWorkload(week)
          )}
        </strong>
      </div>

      ${moduleHtml}
    </article>
  `;
}

function removeExistingSchedule() {
  document
    .querySelector(".cpt-student-schedule-overlay")
    ?.remove();
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

  overlay.className =
    "cpt-student-schedule-overlay";

  overlay.innerHTML = `
    <section
      class="cpt-student-schedule-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cpt-schedule-dialog-title"
    >
      <header class="cpt-schedule-modal-header">
        <h2 id="cpt-schedule-dialog-title">
          ${escapeHtml(title)}
        </h2>

        <button
          type="button"
          class="cpt-schedule-close"
          aria-label="Close schedule"
          title="Close"
        >
          ×
        </button>
      </header>

      <div class="cpt-schedule-modal-body">
        ${body}
      </div>

      <footer class="cpt-schedule-modal-actions">
        ${
          focusEndDateStudentId
            ? `
              <button
                type="button"
                class="cpt-schedule-set-date"
                data-student-id="${escapeHtml(
                  focusEndDateStudentId
                )}"
              >
                Set End Date
              </button>
            `
            : ""
        }

        ${
          showPrintButton
            ? `
              <button
                type="button"
                class="cpt-schedule-print"
              >
                Print Schedule
              </button>
            `
            : ""
        }

        <button
          type="button"
          class="cpt-schedule-cancel"
        >
          Close
        </button>
      </footer>
    </section>
  `;

  document.body.appendChild(overlay);

  const modal = overlay.querySelector(
    ".cpt-student-schedule-modal"
  );

  overlay
    .querySelector(".cpt-schedule-close")
    ?.addEventListener("click", closeSchedule);

  overlay
    .querySelector(".cpt-schedule-cancel")
    ?.addEventListener("click", closeSchedule);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeSchedule();
    }
  });

  overlay
    .querySelector(".cpt-schedule-set-date")
    ?.addEventListener("click", (event) => {
      const studentId =
        event.currentTarget.dataset.studentId;

      closeSchedule();

      const input = document.querySelector(
        `.cpt-end-date[data-student-id="${CSS.escape(
          studentId
        )}"]`
      );

      input?.focus();
      input?.showPicker?.();
    });

  overlay
    .querySelector(".cpt-schedule-print")
    ?.addEventListener("click", () => {
      document.body.classList.add(
        "cpt-printing-student-schedule"
      );

      window.print();
    });

  const handleEscape = (event) => {
    if (event.key === "Escape") {
      closeSchedule();
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    }
  };

  document.addEventListener(
    "keydown",
    handleEscape
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
    modal
      ?.querySelector(
        "button, input, [tabindex]"
      )
      ?.focus();
  });
}

function openStudentSchedule({
  student,
  endDateValue,
  assignments
}) {
  const studentName =
    getStudentName(student);

  if (!endDateValue) {
    createModal({
      title: "End Date Required",
      body: `
        <div class="cpt-schedule-message">
          <p>
            Enter an end date for
            <strong>${escapeHtml(studentName)}</strong>
            before generating a weekly schedule.
          </p>
        </div>
      `,
      focusEndDateStudentId: String(student.id)
    });

    return;
  }

  const endDate =
    parseLocalDate(endDateValue);

  const today =
    getStartOfToday();

  if (!endDate || endDate <= today) {
    createModal({
      title: "Future End Date Required",
      body: `
        <div class="cpt-schedule-message">
          <p>
            The end date for
            <strong>${escapeHtml(studentName)}</strong>
            must be later than today.
          </p>
        </div>
      `,
      focusEndDateStudentId: String(student.id)
    });

    return;
  }

  const missingItems =
    student.missingSubmissionItems || [];

  /*
   * Only unsubmitted required items are scheduled.
   * Submitted items are excluded even if they are ungraded.
   */
  if (!missingItems.length) {
    createModal({
      title: "No Work to Schedule",
      body: `
        <div class="cpt-schedule-message">
          <p>
            ${escapeHtml(studentName)} has submitted
            all currently selected required items.
          </p>
        </div>
      `
    });

    return;
  }

  const weeks =
    createScheduleWeeks(today, endDate);

  const weightedItems =
    addWeightsToMissingItems({
      missingItems,
      assignments
    });

  distributeItemsAcrossWeeks(
    weightedItems,
    weeks
  );

  const totalKnownHours =
    weightedItems.reduce(
      (sum, item) =>
        sum + (item.estimatedHours || 0),
      0
    );

  const unknownHourItems =
    weightedItems.filter(
      (item) => item.estimatedHours === null
    ).length;

  const summaryParts = [
    `${missingItems.length} unsubmitted required item${
      missingItems.length === 1 ? "" : "s"
    }`,
    `${weeks.length} week${
      weeks.length === 1 ? "" : "s"
    }`
  ];

  if (totalKnownHours > 0) {
    summaryParts.push(
      `approximately ${
        Math.round(totalKnownHours * 10) / 10
      } estimated hours`
    );
  }

  if (unknownHourItems > 0) {
    summaryParts.push(
      `${unknownHourItems} item${
        unknownHourItems === 1 ? "" : "s"
      } without module-hour estimates`
    );
  }

  createModal({
    title: `${studentName} — Weekly Success Plan`,
    showPrintButton: true,
    body: `
      <div class="cpt-student-schedule-sheet">
        <header class="cpt-schedule-print-header">
          <h1>Weekly Success Plan</h1>

          <div class="cpt-schedule-student-name">
            ${escapeHtml(studentName)}
          </div>

          <div class="cpt-schedule-date-range">
            ${escapeHtml(formatDate(today))}
            through
            ${escapeHtml(formatDate(endDate))}
          </div>

          <p>
            ${escapeHtml(
              summaryParts.join(" • ")
            )}
          </p>
        </header>

        <div class="cpt-schedule-weeks">
          ${weeks
            .map(renderWeek)
            .join("")}
        </div>

        <footer class="cpt-schedule-print-footer">
          <p>
            This plan includes only required items that
            have not yet been submitted.
          </p>

          <p>
            Workload estimates are based on module hours
            shown in Canvas and are approximate.
          </p>
        </footer>
      </div>
    `
  });
}

export function bindStudentScheduleButtons({
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

  panel
    .querySelectorAll(
      ".cpt-radar-schedule-button[data-student-id]"
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        const studentId =
          button.dataset.studentId;

        const student =
          studentsById.get(String(studentId));

        if (!student) {
          return;
        }

        openStudentSchedule({
          student,
          endDateValue:
            endDates[String(studentId)] || "",
          assignments
        });
      });
    });
}