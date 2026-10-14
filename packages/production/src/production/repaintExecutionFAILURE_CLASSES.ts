import { repaintExecutionRETRYABLE_FAILURE_CLASSES } from "./repaintExecutionRETRYABLE_FAILURE_CLASSES";
import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/**
 * One module-owned Set combines the five existing retryable causes with invalid-output, cancelled, input-stale and budget-exhausted for typed-error disclosure admission. The nine-entry vocabulary is built once, shared across attempts and never mutated by maintained callers; membership alone does not decide retry eligibility. Its fixed strings remain module-local data for the module lifetime, with no resource cleanup or result cache required.
 */
export const repaintExecutionFAILURE_CLASSES: ReadonlySet<AutoMovieRepaintFailureClass> = new Set([
  ...repaintExecutionRETRYABLE_FAILURE_CLASSES,
  "invalid-output",
  "cancelled",
  "input-stale",
  "budget-exhausted",
]);
