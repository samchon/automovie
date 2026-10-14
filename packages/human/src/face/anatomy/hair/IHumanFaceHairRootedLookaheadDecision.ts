import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What `anticipateHumanFaceHairRootedStem` decided at one rooted-stem station.
 *
 * `plan` is `"clear"` when the stem's default continuation reached no surface within the look-ahead, `"deferred"` when it reached one but keeping the heading for this chord still left an admissible turn, and `"turned"` when the station had to begin turning now. `blocking` is the outward normal of the first surface the continuation reached, or null for `"clear"`.
 *
 * @evidence contracts/common.md#principled-implementation Direction, clear/deferred/turned plan and nullable blocking normal record which continuation case the preview selected.
 * @evidence contracts/common.md#clear-and-simple-design The decision separates reporting from real interval admission and is reused in refusal diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A clear preview is not proof of a complete curve's separation; real chord admission remains with the integrator.
 * @evidence contracts/common.md#meaningful-documentation blocking is null only when no previewed blocker was found, while direction is the selected station heading.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The preview producer chooses ray traversal; this decision type allocates or executes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The actual last decision is passed to diagnostics rather than recomputed by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains its decision and vectors; no budget or mesh resource is owned by the type.
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
