import type { DynamicExecutor } from "@nestia/e2e";

/**
 * Runner acceptance preserves the executor's original record and reports timing failure independently of its assertion error; the record remains shared and mutable by its owner.
 */
export interface IScenarioExecutionAssessment {
  /** Original executor record, retained by reference without clearing its assertion error. */
  execution: Pick<
    DynamicExecutor.IExecution,
    "name" | "error" | "started_at" | "completed_at"
  >;

  /** Parsed completion minus start in milliseconds, or null for invalid or reversed timestamps. */
  elapsedMs: number | null;

  /** Printable elapsed duration, or the literal invalid-timing label. */
  timingLabel: string;

  /** Independent invalid-clock or at-least-500-ms failure, or null when timing meets the strict budget. */
  timingFailure: string | null;

  /** True only when the original assertion error and the timing failure are both null. */
  passed: boolean;
}
