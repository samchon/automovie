import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";

/**
 * One rooted-stem station as a stem refusal reports it.
 *
 * Positions and clearances are current head-frame metres; directions are unit vectors. `chord` is the direction of the chord that arrived at the station (null at the root). The look-ahead decision is the one the station's own inputs produce; it is null at the root, whose first chord keeps the root owner's tangent.
 *
 * @evidence contracts/common.md#principled-implementation Measured clearance, resident triangle, outward normal and arriving chord describe one reported station.
 * @evidence contracts/common.md#clear-and-simple-design The record attaches optional preview information without changing the walk's accepted geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null lookahead is root-specific or unavailable diagnostic replay, not evidence of a clear continuation.
 * @evidence contracts/common.md#meaningful-documentation Coordinates and signed clearance are head metres; chord and normals are unit directions and chord is null at the root.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Contact sampling and diagnostic replay are performed by the refusal producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The producer reuses its final decision and reconstructs previous stations from current snapshot readers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reported vectors belong to the diagnostic caller; this schema retains no query index or running walk.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemStation {
  /** Station position. */
  point: IAutoMovieVector3;

  /** Signed free distance of the station from the collider. */
  clearance: number;

  /** Original collider triangle nearest the station. */
  triangle: number;

  /** Unit outward skin normal at the station. */
  normal: IAutoMovieVector3;

  /** Direction of the chord that arrived here, or null at the root. */
  chord: IAutoMovieVector3 | null;

  /** The station's look-ahead decision, or null at the root. */
  lookahead: IHumanFaceHairRootedLookaheadDecision | null;
}
