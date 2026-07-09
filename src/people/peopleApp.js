import { loadEndDates } from "./peopleStorage.js";


function loadRadarStyles() {
  if (document.getElementById("wayfinder-radar-css")) return;

  const link = document.createElement("link");
  link.id = "wayfinder-radar-css";
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("people/radar.css");

  document.head.appendChild(link);
}


import { getCourseStudents } from "./peopleApi.js";
import { renderStudentRadar } from "./peopleRenderer.js";

function getCourseIdFromUrl() {
  const match = window.location.pathname.match(/\/courses\/(\d+)\/users/);
  return match ? match[1] : null;
}

export async function initializePeopleView() {
    
    loadRadarStyles();
  
    console.log("Wayfinder Student Radar");

  const courseId = getCourseIdFromUrl();

  const panel = document.createElement("div");
  panel.id = "cpt-progress-tracker";

  panel.innerHTML = renderStudentRadar({
    students: [],
    loading: true
  });

  document.body.appendChild(panel);

  try {
    const students = await getCourseStudents(courseId);
    const endDates = await loadEndDates(courseId);

    panel.innerHTML = renderStudentRadar({
        students,
        endDates,
        loading: false
    });
  } catch (error) {
    panel.innerHTML = renderStudentRadar({
      students: [],
      loading: false,
      error: error.message
    });
  }
}