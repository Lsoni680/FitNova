// constants/AppTheme.js
export default {
  colors: {
    // 🌊 Aqua Premium Core
    primary: "#009CA0",        // Main Aqua
    primaryDark: "#007F82",    // Deep Aqua
    primaryLight: "#00D4D8",   // Light Aqua / Highlight

    // Secondary / Supporting Colors
    accent: "#34D5C3",         // Minty Aqua
    bg: "#F4FDFD",             // Soft Ice White Background
    card: "#FFFFFF",           // Crisp White Cards
    border: "#E2F3F3",         // Aqua-Tinted Soft Border
    progressBg: "#E5F7F7",     // Light Aqua Progress Background

    // Text System
    text: "#003B3C",           // Deep Teal Text (premium, readable)
    subtext: "#5D7F7F",        // Soft Grey-Teal Subtext
    danger: "#EF4444",

    // Macro Bar Colors
    mint: "#10B981",
    sky: "#38BDF8",
    pink: "#EC4899",
    sand: "#F59E0B",
  },

  // 🌈 Premium Aqua Header Gradient
  gradient: {
    header: ["#009CA0", "#00D4D8"], 
  },

  // Rounded Corners
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 22,
  },

  // Soft Luxury Shadows
  shadow: {
    soft: {
      shadowColor: "#003B3C",
      shadowOpacity: 0.07,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    card: {
      shadowColor: "#007F82",
      shadowOpacity: 0.10,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },

  // Text Styles
  text: {
    h1: {
      fontSize: 26,
      fontWeight: "800",
      color: "#003B3C",
    },
    h2: {
      fontSize: 20,
      fontWeight: "700",
      color: "#003B3C",
    },
    p: {
      fontSize: 14,
      color: "#5D7F7F",
    },
    small: {
      fontSize: 12,
      color: "#5D7F7F",
    },
  },

  // Button Template
  button: (bgColor) => ({
    backgroundColor: bgColor,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  }),
};
