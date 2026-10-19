// BlockNote's built-in "dark" theme ships its own (brownish) palette, not ours — override with
// the app's actual tokens from globals.css so the doc panel matches the rest of the UI exactly.
export const outpostDarkTheme = {
  colors: {
    editor: { text: "#f4f4f5", background: "#0c0d12" },
    menu: { text: "#f4f4f5", background: "#16171e" },
    tooltip: { text: "#f4f4f5", background: "#16171e" },
    hovered: { text: "#ffffff", background: "#22242e" },
    selected: { text: "#ffffff", background: "#2c2f3c" },
    disabled: { text: "#71717a", background: "#1c1d25" },
    shadow: "0 12px 32px -8px rgba(0, 0, 0, 0.7)",
    border: "rgba(255, 255, 255, 0.08)",
    sideMenu: "#a1a1aa",
    highlights: {},
  },
  borderRadius: 8,
  fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
};
