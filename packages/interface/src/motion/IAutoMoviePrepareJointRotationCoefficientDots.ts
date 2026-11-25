import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";

/**
 * Contracts of `prepareJointRotationCoefficientDots`: a two-axis joint's
 * coefficient readers.
 */
export namespace IAutoMoviePrepareJointRotationCoefficientDots {
  /**
   * One fixed coefficient's four-term dot reader, with its existing
   * finite-input premise.
   */
  export type IDot = (target: IAutoMovieQuaternion) => number;
  /** Fixed-rig readers; query inputs are borrowed only until return. */
  export interface IReader {
    /** Original four coefficient-dot callables for this fixed null/numeric mode. */
    (reference: IAutoMovieJointPose): readonly IDot[];
    /**
     * Propose degree swivels of q=cosine_cos(psi/2)+sine_sin(psi/2), or
     * decline.
     */
    swivels(
      reference: IAutoMovieJointPose,
      cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion,
    ): readonly number[] | "all" | null;
  }
}
