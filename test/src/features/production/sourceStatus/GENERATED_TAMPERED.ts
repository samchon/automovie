import type { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Existing tamper diagnostic selected when generated text differs from the fixture's compiled payload rule.
 */
export const GENERATED_TAMPERED: IAutoMovieDiagnostic = {
  code: "generated-tampered",
  category: "error",
  phase: "compile",
  target: "shots/opening.json",
  path: "generated/harbor/shots/opening.json",
  message: "Generated digest differs from the builder-derived digest.",
};
