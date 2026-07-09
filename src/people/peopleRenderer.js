import { renderRadarSummaryCard } from "./components/radarSummaryCard.js";
import { renderStudentRadarTable } from "./components/studentRadarTable.js";

export function renderStudentRadar({
  students = [],
  endDates = {},
  loading = false,
  error = null
} = {}) {
  return `
    <div class="cpt-student-radar">

      <div class="cpt-overall">
        <div class="cpt-module-topline">
          <span class="cpt-module-title">Student Radar</span>
        </div>
      </div>

      <div class="cpt-summary cpt-radar-summary">
        ${renderRadarSummaryCard("On Track", 0)}
        ${renderRadarSummaryCard("Watch List", 0)}
        ${renderRadarSummaryCard("At Risk", 0)}
        ${renderRadarSummaryCard("Inactive", 0)}
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