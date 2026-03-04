import "dotenv/config";

export default {
  expo: {
    name: "FitNova",
    slug: "fitnova",
    version: "1.0.1",

    android: {
      package: "com.lsoni680.fitnova",
      versionCode: 4, // 🔥 increase version

      permissions: [
        "READ_MEDIA_IMAGES",
        "CAMERA"
      ],

      googleServicesFile: "./google-services.json"  // 🔥 ADD THIS
    },

    extra: {
      USDA_API_KEY: process.env.USDA_API_KEY,
      NUTRITION_API_ID: process.env.NUTRITION_API_ID,
      NUTRITION_API_KEY: process.env.NUTRITION_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,

      eas: {
        projectId: "2debb4aa-b41e-48da-a186-f37019900642",
      },
    },
  },
};