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
 * @evidence contracts/common.md#principled-implementation Carries the measured station state a refusal needs to show why the stem could not continue.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports state; it changes no geometry.
 * @evidence contracts/common.md#meaningful-documentation States frames, units and the root's null members.
 * @evidence contracts/modeling.md#spatial-conventions Positions and clearances are head-frame metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused stem emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
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
