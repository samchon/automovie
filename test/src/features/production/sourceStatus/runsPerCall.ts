import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import { createSourceStatusWorld } from "./createSourceStatusWorld";

/** Actual observations returned by successive supplied status calls. */
type SourceStatusCallObservations = {
  /** Per-call evaluation-count increments. */
  runs: number[];

  /** Actual answers returned by successive status invocations. */
  answers: IAutoMovieBuildProjectOutput[];
};

/**
 * Observe evaluation work for successive status calls.
 *
 * @evidence contracts/testing.md#behavioral-verification Records the evaluation count immediately before each status invocation, stores the actual returned answer and appends the exact count difference after that call; thrown status values propagate.
 * @evidence contracts/testing.md#independent-expectations The owning unit writes literal expected run-count sequences and answer populations; elapsed time or a second retention algorithm is never used to derive the expectation.
 * @evidence contracts/testing.md#distinguishing-cases Zero requested calls produce empty arrays; repeated success, repeated refusal and changed-input calls remain observations supplied by retention/refusal/race units.
 * @evidence contracts/testing.md#execution-ownership The helper borrows the world and status function, creates two returned arrays and invokes no independent host or builder; the caller owns any state/capability effects of status.
 */
export const runsPerCall: (world: ReturnType<typeof createSourceStatusWorld>, status: () => IAutoMovieBuildProjectOutput, calls: number) => SourceStatusCallObservations = (world: ReturnType<typeof createSourceStatusWorld>, status: () => IAutoMovieBuildProjectOutput, calls: number): SourceStatusCallObservations => {
  const runs: number[] = [];
  const answers: IAutoMovieBuildProjectOutput[] = [];
  for (let call: number = 0; call < calls; ++call) {
    const before: number = world.counts.evaluations;
    answers.push(status());
    runs.push(world.counts.evaluations - before);
  }
  return { runs, answers };
};
