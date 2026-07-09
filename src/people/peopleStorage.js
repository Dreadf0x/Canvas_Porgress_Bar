function getEndDateKey(courseId) {
  return `wayfinder_student_radar_end_dates_${courseId}`;
}

export async function loadEndDates(courseId) {
  const key = getEndDateKey(courseId);
  const result = await chrome.storage.local.get(key);
  return result[key] || {};
}

export async function saveEndDate(courseId, studentId, endDate) {
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