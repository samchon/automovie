import { IAutoMovieCameraClearanceFinding } from "./IAutoMovieCameraClearanceFinding";

/**
 * Reproducible physical-clearance result for one realized camera take.
 *
 * The report binds the ordered base-clock-plus-key sample plan used for evaluation and the verdict that plan produced. A stale report is never a clear report, even when its old geometry happened to contain no contact, and only a clear report may be published, so the geometry a stored verdict was measured from is always the one that was current at its gate.
 *
 * The compared revision identities remain evaluation inputs rather than report fields, separating freshness admission from stable compiled report bytes.
 *
 * @evidence contracts/common.md#principled-implementation The evaluator compares geometry revision, validates ordered samples and tests carried interval bounds. Conservative coverage relies on linear translation, the assumed rotation interpolation and endpoint obstacle boxes enclosing intermediate geometry; its small-angle normalized-lerp slack and binary64 limits remain unresolved rather than proving arbitrary continuous motion.
 * @evidence contracts/common.md#clear-and-simple-design Sample plan and contacts expose the evaluated bounds while revision identities remain evaluation inputs, preserving stable compiled bytes across publication.
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

  /** Verdict for the evaluated sampled bounds and interval premises: clear, blocked or stale; no unrestricted continuous-mesh collision certificate. */
  status: "clear" | "blocked" | "stale";

  /** Stable interval-ordered contacts; empty for clear and stale reports. */
  findings: IAutoMovieCameraClearanceFinding[];
}
