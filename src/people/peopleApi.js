export async function canvasFetchJson(path) {
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

export async function getCourseStudents(courseId) {
  return canvasFetchJson(
    `/api/v1/courses/${courseId}/users?enrollment_type[]=student&include[]=enrollments&per_page=100`
  );
}