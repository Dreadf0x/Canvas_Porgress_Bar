export const THEMES = {
  default: "default",
  ubtech: "ubtech"
};

export function applyTheme(themeName = THEMES.default) {
  document.documentElement.dataset.cptTheme = themeName;
}