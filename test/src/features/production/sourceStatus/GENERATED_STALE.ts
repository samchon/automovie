import type { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Existing stale-output diagnostic selected when recorded compiled source differs from current source.
 */
export const GENERATED_STALE: IAutoMovieDiagnostic = {
  code: "generated-stale",
  category: "error",
  phase: "compile",
  target: "generated-manifest",
  path: "automovie/productions/harbor/generated-manifest.json",
  message: "Generated input differs from current source.",
};
