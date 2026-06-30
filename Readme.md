# Canvas Progress Bar

A Chrome extension that adds a visual module progress tracker to Canvas.

## Current features

- Floating Canvas module progress panel
- Canvas API-based score checking
- 80% passing threshold
- Required item detection using keywords
- Instructor custom requirement rules
- Text headers ignored
- Student/instructor UI separation attempt
- Collapsible sidebar tab
- Local Chrome storage for rules and UI state

## Install for development

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select this project folder.

## Current Canvas match

```text
https://ubtech.instructure.com/courses/*/modules*
```

## Notes

Custom instructor rules are currently saved locally in Chrome storage. A future version should store course rules somewhere shared so students receive instructor-defined requirements.
