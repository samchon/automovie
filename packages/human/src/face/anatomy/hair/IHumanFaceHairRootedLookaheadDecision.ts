import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What `anticipateHumanFaceHairRootedStem` decided at one rooted-stem station.
 *
 * `plan` is `"clear"` when the stem's default continuation reached no surface
 * within the look-ahead, `"deferred"` when it reached one but keeping the
 * heading for this chord still left an admissible turn, and `"turned"` when
 * the station had to begin turning now. `blocking` is the outward normal of
 * the first surface the continuation reached, or null for `"clear"`.
 *
 * @evidence contracts/common.md#principled-implementation Returns the chosen direction with the evidence that chose it, so a refusal can state which look-ahead case applied.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace a bare direction return.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record states the decision; it changes no geometry.
 * @evidence contracts/common.md#meaningful-documentation States each plan value and when blocking is null.
 * @evidence contracts/modeling.md#spatial-conventions Directions are unit head-frame vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedLookaheadDecision {
  /** Direction the station takes. */
  direction: IAutoMovieVector3;

  /** Which look-ahead case applied. */
  plan: "clear" | "deferred" | "turned";

  /** Outward normal of the first surface the continuation reached, or null. */
  blocking: IAutoMovieVector3 | null;
}
