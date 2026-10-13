import { IAutoMovieCameraClearanceFinding } from "./IAutoMovieCameraClearanceFinding";

/**
 * Reproducible physical-clearance result for one realized camera take.
 *
 * The report binds the ordered base-clock-plus-key sample plan used for evaluation and the verdict that plan produced. A stale report is never a clear report, even when its old geometry happened to contain no contact, and only a clear report may be published, so the geometry a stored verdict was measured from is always the one that was current at its gate.
 *
 * The two revision numbers an evaluation compares are its inputs rather than its result, so they stay on the runtime the caller supplies. A report that recorded them would make a compiled take's bytes a function of the project revision counter: publishing the take moves that counter, the next derivation records the moved value, and regeneration never converges.
 *
 * @evidence contracts/common.md#principled-implementation The evaluator compares current geometry revision, validates ordered base-clock and causal samples and tests carried interval bounds, reporting clear, blocked or stale with reproducible sample times.
 * @evidence contracts/common.md#clear-and-simple-design Sample plan and contacts expose the physical result while revision counters remain evaluation inputs, preserving stable compiled bytes across publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale results contain no invented clear contacts and cannot publish; sample-based conservative envelopes do not claim exact continuous deforming-mesh collision detection.
 * @evidence contracts/common.md#meaningful-documentation Defines sample clock, exact ordered instants, interval count, current/stale states and interval-ordered findings.
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceReport {
  /** Scene camera identity evaluated. */
  camera: string;

  /** Endpoint-inclusive inspection samples per second. */
  sampleRate: number;

  /** Exact ordered fixed-clock and causal sample instants evaluated. */
  sampleTimes: number[];

  /** Exact number of adjacent carried sample intervals evaluated. */
  intervals: number;

  /** Whether current geometry was clear, blocked, or stale. */
  status: "clear" | "blocked" | "stale";

  /** Stable interval-ordered contacts; empty for clear and stale reports. */
  findings: IAutoMovieCameraClearanceFinding[];
}
