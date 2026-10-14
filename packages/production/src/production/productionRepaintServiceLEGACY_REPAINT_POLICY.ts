import { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";

/**
 * The original absent-configuration compatibility policy permits one attempt, one-hour timeout/elapsed budgets, Number.MAX_SAFE_INTEGER cost units and no backoff/retry classes. The coordinator clones this fixed module-owned record before validation/use, sharing defaults without sharing mutable request state or claiming real provider settlement bounds. Construction is fixed-size, the record remains for the module lifetime and per-call clones release with their request; these defaults are the existing compatibility contract rather than a fixture workaround.
 */
export const productionRepaintServiceLEGACY_REPAINT_POLICY: IAutoMovieRepaintExecutionPolicy = {
  maximumAttempts: 1,
  attemptTimeoutMs: 3_600_000,
  maximumElapsedMs: 3_600_000,
  maximumCostUnits: Number.MAX_SAFE_INTEGER,
  backoffMs: [],
  retryableFailures: [],
};
