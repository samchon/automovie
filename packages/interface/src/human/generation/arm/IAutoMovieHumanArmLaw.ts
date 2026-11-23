import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * The arm's sections for one side, in the left frame: a one-parameter family
 * of planes from the hand's branch (low parameter) through the heel, the
 * forearm and the upper arm to the level shoulder ring (high parameter). The
 * hand's solve reads its wrist, crease and girth; the chain reads its layers,
 * planes and points.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The arm's sections for one side, in the left frame: a one-parameter family of planes from the hand's branch (low parameter) through the heel, the forearm and the upper arm to the level shoulder ring (high parameter).
 * @evidence contracts/development/design.md#principled-representation `wrist`: Hand origin, mm. `elbow`: Elbow centre, mm. `crease`: Centre of the section at the wrist crease, mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmConstruction.remember, AutoMovieHumanArmLaw.of. Read by AutoMovieHumanArmConstruction.remember, AutoMovieHumanArmLayers.of. Also types AutoMovieHumanArmConstruction.BUILT, AutoMovieHumanArmConstruction.laws.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `wrist`, `elbow`, `crease`, `layers`; callers supply the complete record.
 */
export interface IAutoMovieHumanArmLaw {
  /** Hand origin, mm. */
  wrist: AutoMovieVector3Tuple;

  /** Elbow centre, mm. */
  elbow: AutoMovieVector3Tuple;

  /** Centre of the section at the wrist crease, mm. */
  crease: AutoMovieVector3Tuple;

  /** Layer parameters from the bottom. */
  layers: number[];

  /**
   * Normal of the section plane at a parameter, toward the shoulder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Normal of the section plane at a parameter, toward the shoulder.
   */
  normal(q: number): AutoMovieVector3Tuple;

  /**
   * A point the section plane passes through.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A point the section plane passes through.
   */
  anchor(q: number): AutoMovieVector3Tuple;

  /**
   * Point of the section at a parameter and phase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Point of the section at a parameter and phase.
   */
  point(q: number, t: number): AutoMovieVector3Tuple;

  /**
   * Hull perimeter of the forearm's tube cut by a plane through a point, mm;
   * the plane's normal faces the shoulder, as the tube's sections do.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Hull perimeter of the forearm's tube cut by a plane through a point, mm; the plane's normal faces the shoulder, as the tube's sections do.
   */
  girth(point: AutoMovieVector3Tuple, normal: AutoMovieVector3Tuple): number;
}
