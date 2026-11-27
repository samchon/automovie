import { IAutoMovieDiagnostic } from "@automovie/interface";

/** Create one compile error for a named shot field and expectation. */
export function engineDiagnostic(
  id: string,
  field: string,
  expectation: string,
): IAutoMovieDiagnostic {
  return {
    code: "engine-validation-failed",
    category: "error",
    phase: "compile",
    target: `shot:${id}`,
    path: null,
    message: `${field} ${expectation}. Correct the owning shot source before running the builder.`,
  };
}
