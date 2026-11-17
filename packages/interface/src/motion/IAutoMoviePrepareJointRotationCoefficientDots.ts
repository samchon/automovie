import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieJointPose } from "../pose/IAutoMovieJointPose";

/**
 * Contracts of `prepareJointRotationCoefficientDots`: a two-axis joint's coefficient readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the dot readers and the swivel proposal with its decline.
 * @evidence contracts/development/design.md#principled-representation Four quaternion dot callables per reference joint and the swivels they propose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The joint rotation projector's swivel proposer reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Proposals only; angle ranges, clamps and goals are still checked by their owners.
 */
export namespace IAutoMoviePrepareJointRotationCoefficientDots {
  /** One fixed coefficient's four-term dot reader, with its existing finite-input premise. */
  export type IDot = (target: IAutoMovieQuaternion) => number;
  /** Fixed-rig readers; query inputs are borrowed only until return. */
  export interface IReader {
    /** Original four coefficient-dot callables for this fixed null/numeric mode. */
    (reference: IAutoMovieJointPose): readonly IDot[];
    /** Propose degree swivels of q=cosine*cos(psi/2)+sine*sin(psi/2), or decline. */
    swivels(reference: IAutoMovieJointPose, cosine: IAutoMovieQuaternion,
      sine: IAutoMovieQuaternion): readonly number[] | "all" | null;
  }
}
