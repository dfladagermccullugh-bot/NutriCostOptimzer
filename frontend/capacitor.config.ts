import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wraps the same Vite/React web build into native iOS + Android shells.
// One codebase → web + mobile (see design.md / UI-UX.md for the shared system).
//
// Local mobile dev with live reload (edit React once, see it on web + device simultaneously):
//   1. Terminal A:  npm run dev:host          # Vite dev server on your LAN
//   2. Set CAP_SERVER_URL to the printed Network URL, e.g.:
//        export CAP_SERVER_URL=http://192.168.1.50:5173
//   3. Terminal B:  npm run cap:ios   (or cap:android)
//   Unset CAP_SERVER_URL (and `cap sync`) before building a production/native release.
const config: CapacitorConfig = {
  appId: "com.nutricostoptimizer.app",
  appName: "NutriCostOptimizer",
  webDir: "dist",
  server: process.env.CAP_SERVER_URL
    ? { url: process.env.CAP_SERVER_URL, cleartext: true }
    : undefined,
};

export default config;
