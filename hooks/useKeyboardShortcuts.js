"use client";

import { useEffect, useCallback } from "react";

/**
 * Registers keyboard shortcuts globally.
 * shortcuts: array of { key, ctrl, alt, shift, meta, action, description, group }
 * enabled: boolean — pass false to pause shortcuts (e.g. when a modal is open)
 */
export function useKeyboardShortcuts(shortcuts = [], enabled = true) {
  const handler = useCallback(
    (e) => {
      console.log("KEY:", e.key);
      console.log("Code:", e.code);
      if (!enabled) return;

      // Don't fire shortcuts when typing in inputs/textareas/selects
      const tag = e.target.tagName.toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        e.target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key === shortcut.key || e.code === shortcut.key;
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const altMatch = !!shortcut.alt === e.altKey;
        const shiftMatch = !!shortcut.shift === e.shiftKey;

        if (!keyMatch || !ctrlMatch || !altMatch || !shiftMatch) continue;

        // Allow shortcuts with modifiers even inside inputs (e.g. Ctrl+S to save)
        // Block bare F-keys and letter shortcuts inside inputs
        if (isEditable && !shortcut.ctrl && !shortcut.alt && !shortcut.meta) {
          if (e.key.length === 1 || e.key.startsWith("F")) continue;
        }

        e.preventDefault();
        shortcut.action(e);
        return;
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    console.log("Keyboard Mounted");

    window.addEventListener("keydown", handler);
    return () => {
      console.log("Keyboard Unmounted");
      window.removeEventListener("keydown", handler);
    };
  }, [handler]);
}
