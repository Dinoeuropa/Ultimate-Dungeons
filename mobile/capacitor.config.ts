import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dinoeuropa.ultimatedungeons",
  appName: "Ultimate Dungeons",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0612",
    },
  },
};

export default config;
