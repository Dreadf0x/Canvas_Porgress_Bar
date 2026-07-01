export function isRequiredTitle(title, requiredKeywords) {
  const lowered = String(title || "").replace(/\s+/g, " ").trim().toLowerCase();
  return requiredKeywords.some((keyword) => lowered.includes(keyword));
}
export function isTextHeaderItem(item) {
    const type = String(item.type || "").toLowerCase();
    return (
        type === "subheader" ||
        type === "text_header" ||
        type === "contextmoduleheader"
    );
}// Progress engine will move here during refactor.

export function getAssignmentIdFromModuleItem(item) {
  if (item.assignment_id) return Number(item.assignment_id);

  if (
    (item.type === "Assignment" ||
      item.type === "Quiz" ||
      item.type === "ExternalTool") &&
    item.content_id
  ) {
    return Number(item.content_id);
  }

  return null;
}

export function getRequiredItemsForModule(module, moduleItems, rules, requiredKeywords) {
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