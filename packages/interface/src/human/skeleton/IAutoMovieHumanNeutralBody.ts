import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanJointCentres } from "./IAutoMovieHumanJointCentres";

/**
 * What every piece of the neutral posture reads of a body's bind skeleton.
 *
 * States what each reader returns, its frame and unit.
 */
export interface IAutoMovieHumanNeutralBody {
  /** The bind joints by bone, calibration millimetres. */
  byBone: ReadonlyMap<string, IAutoMovieHumanJointCentres.IJoint>;

  /**
   * A bone's unit direction at the bind, from its joint toward its end. The
   * bone must exist in byBone and have a nonzero segment; the reader does not
   * admit arbitrary names or degenerate segments.
   *
   * @param bone The Human joint.
   * @returns The unit vector in the registered frame.
   */
  direction(bone: string): AutoMovieVector3Tuple;

  /**
   * The vector between two joints at the bind. Both names must exist in byBone;
   * this internal reader does not resolve missing joints.
   *
   * @param from The first joint.
   * @param to The second joint.
   * @returns `to` less `from`, calibration millimetres.
   */
  between(from: string, to: string): AutoMovieVector3Tuple;
}
