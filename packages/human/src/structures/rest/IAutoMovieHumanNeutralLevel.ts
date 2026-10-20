import { IAutoMovieHumanNeutralEnvelope } from "./IAutoMovieHumanNeutralEnvelope";

/** A horizontal geometric plane and its independent enclosing dimensions.
 */
export interface IAutoMovieHumanNeutralLevel extends IAutoMovieHumanNeutralEnvelope {
  /** Breadth offset is relative to the pelvis datum's lateral coordinate;
   * anterior offset is relative to its anterior coordinate. These are the
   * section extent midpoint, not the area centroid or a clinical landmark.
   */
  breadthOffsetMm: number;

  /** Anterior extent-midpoint displacement from the pelvis datum, mm. */
  anteriorOffsetMm: number;

  /** Physical plane height in the unchanged root datum, mm. */
  heightMm: number;
}
