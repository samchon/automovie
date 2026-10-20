import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
} from "@automovie/interface";

import { simulateSoftBody } from "./simulateSoftBody";
import { softBodyStepAt } from "./softBodyStepAt";

/** Sample the static cloth trajectory at a shot second by snapping to its fixed-clock step. Nonfinite time throws; negative finite time samples rest. This public sampling API currently has no production/viewer caller.
 *
 * @evidence contracts/common.md#principled-implementation The canonical time-to-step rule feeds the static absolute replay, including its budget refusal and named-state semantics; valid positive clock spacing is a domain-admission premise.
 * @evidence contracts/common.md#clear-and-simple-design Time quantization stays separate from integration so lowering can inspect a requested step before choosing an analysis status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A nonfinite second is refused, not clamped into a plausible frame; no incremental playback cursor changes a repeated seek.
 * @evidence contracts/common.md#meaningful-documentation States quantization, negative-time behavior, failures and unwired runtime reach.
 * @evidence contracts/performance.md#efficient-algorithms Quantization is constant work, followed by the static solver's O(P*K*(I+C)) replay and O(P) state storage at requested step K.
 * @evidence contracts/performance.md#reuse-equivalent-work The quantizer and replay owners are shared; same-step requests still replay because no equivalence-safe persistent trajectory cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh solver result transfers to the caller; this sampler retains no domain, prior frame or animation task.
 */
export const sampleSoftBody: (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
  state?: string | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  const step: number | null = softBodyStepAt(domain, time);
  if (step === null)
    throw new Error(
      `soft body "${domain.id}" cannot be sampled at a non-finite time`,
    );
  return simulateSoftBody(domain, step, state);
};
