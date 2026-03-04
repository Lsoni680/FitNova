// constants/Colors.js
// Unified color system for both light and dark modes
// Works seamlessly with AppTheme.js

const Colors = {
  light: {
    primary: "#43A047",      // Green tone (main brand color)
    accent: "#42A5F5",       // Blue accent
    background: "#F9FAFB",   // App background
    card: "#FFFFFF",         // Card background
    text: "#173B2E",         // Default text color
    subtext: "#6B7280",      // Muted/subtle text
    border: "#E5E7EB",       // Divider / input borders
    danger: "#E53935",       // Error / critical color
    success: "#2E7D32",      // Success / confirmation
    warning: "#FFB300",      // Warnings / alerts
  },

  dark: {
    primary: "#66BB6A",      // Green tone (main brand color)
    accent: "#64B5F6",       // Blue accent
    background: "#121212",   // App background
    card: "#1E1E1E",         // Card background
    text: "#E0E0E0",         // Default text color
    subtext: "#BDBDBD",      // Muted/subtle text
    border: "#333333",       // Divider / input borders
    danger: "#EF5350",       // Error / critical color
    success: "#81C784",      // Success / confirmation
    warning: "#FFCA28",      // Warnings / alerts
  },
};

export default Colors;
