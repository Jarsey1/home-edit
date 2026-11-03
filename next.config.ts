import type { NextConfig } from "next";

const packageVersion = process.env.npm_package_version ?? "0.1.0";
const buildCommit =
  process.env.NEXT_PUBLIC_BUILD_COMMIT ??
  process.env.WORKERS_CI_COMMIT_SHA ??
  process.env.CF_PAGES_COMMIT_SHA ??
  "local";
const buildEnvironment =
  process.env.NEXT_PUBLIC_APP_ENV ??
  (process.env.WORKERS_CI_BRANCH === "main" ? "production" : "development");
const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageVersion,
    NEXT_PUBLIC_BUILD_COMMIT: buildCommit,
    NEXT_PUBLIC_APP_ENV: buildEnvironment,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // Allow the dev server to be opened from a phone on the same Wi-Fi.
  allowedDevOrigins: ["192.168.1.134", "*.local"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
