const environment = process.env.NEXT_PUBLIC_APP_ENV;

export const buildInfo = {
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
  commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "local",
  environment:
    environment === "production" || environment === "staging"
      ? environment
      : "development",
  builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
} as const;

export function shortCommit(commit: string) {
  return commit === "local" ? "local" : commit.slice(0, 7);
}
