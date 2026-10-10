import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";

/**
 * One rooted-stem station as a stem refusal reports it.
 *
 * Positions and clearances are current head-frame metres; directions are unit
 * vectors. `chord` is the direction of the chord that arrived at the station
 * (null at the root). The look-ahead decision is the one the station's own
 * inputs produce; it is null at the root, whose first chord keeps the root
 * owner's tangent.
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
