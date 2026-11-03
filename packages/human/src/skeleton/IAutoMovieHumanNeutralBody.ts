import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * What every piece of the neutral posture reads of a body's bind skeleton.
 *
 * @evidence contracts/common.md#meaningful-documentation States what each reader returns, its frame and unit.
 */
export interface IAutoMovieHumanNeutralBody {
  /** The bind joints by bone, calibration millimetres. */
  byBone: ReadonlyMap<string, AutoMovieHumanJointCentres.IJoint>;

  /**
   * A bone's unit direction at the bind, from its joint toward its end.
   *
   * @param bone The Human joint.
   * @returns The unit vector in the registered frame.
   */
  direction(bone: string): Math3D.Vector;

  /**
   * The vector between two joints at the bind.
   *
   * @param from The first joint.
   * @param to The second joint.
   * @returns `to` less `from`, calibration millimetres.
   */
  between(from: string, to: string): Math3D.Vector;
}
