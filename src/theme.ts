export const theme = {
  colors: {
    primary: "#FA586A", // Apple Music red
    primaryDark: "#E51D40",
    primaryLight: "#FF8A9A",
    background: "#111111",
    backgroundGradient: "linear-gradient(135deg, #111111, #2A2A2A)",
    backgroundLight: "#222222",
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)",
    textTertiary: "rgba(255, 255, 255, 0.6)",
    statusBar: "rgba(0, 0, 0, 0.8)",
    navigationBar: "rgba(17, 17, 17, 0.95)",
  },
  shadows: {
    light: "0 2px 8px rgba(0, 0, 0, 0.15)",
    medium: "0 4px 20px rgba(0, 0, 0, 0.25)",
    heavy: "0 10px 30px rgba(0, 0, 0, 0.4)",
  },
  borderRadius: {
    small: "4px",
    medium: "8px",
    large: "16px",
  },
  transitions: {
    fast: "0.15s ease",
    normal: "0.25s ease",
    slow: "0.4s ease",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  breakpoints: {
    small: "320px",
    medium: "375px",
    large: "425px",
    tablet: "768px",
  },
  safeArea: {
    top: "env(safe-area-inset-top, 0px)",
    right: "env(safe-area-inset-right, 0px)",
    bottom: "env(safe-area-inset-bottom, 0px)",
    left: "env(safe-area-inset-left, 0px)",
  },
};
