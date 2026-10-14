import type { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Existing invalid-source diagnostic selected when the unit's explicit validity state is false.
 */
export const SOURCE_FAILURE: IAutoMovieDiagnostic = {
  code: "source-execution-failed",
  category: "error",
  phase: "source",
  target: "shot:opening",
  path: "src/shots/opening.ts",
  message: "Source export opening threw while building its shot program.",
};
