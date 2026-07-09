export function detectRoleFromPermissions(course) {
  const permissions = course?.permissions || {};
  const enrollmentTypes = (course?.enrollments || []).map((enrollment) =>
    String(enrollment.type || "").toLowerCase()
  );

  const instructorSignals = [
    permissions.manage_assignments,
    permissions.manage_grades,
    permissions.manage_students,
    permissions.update
  ];

  const instructorEnrollment = enrollmentTypes.some((type) =>
    type.includes("teacher") ||
    type.includes("ta") ||
    type.includes("designer")
  );

  return instructorSignals.some(Boolean) || instructorEnrollment
    ? "instructor"
    : "student";
}