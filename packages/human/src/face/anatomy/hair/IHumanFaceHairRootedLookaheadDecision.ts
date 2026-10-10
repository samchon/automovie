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
