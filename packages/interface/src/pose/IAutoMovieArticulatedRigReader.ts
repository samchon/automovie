import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";

/**
 * An independently prepared rigid tree in its owner's closed bone vocabulary.
 *
 * @template Bone The rig's semantic bone names.
 */
export interface IAutoMovieArticulatedRigReader<Bone extends string> {
  /** Parent-first semantic bone names, frozen independently of the input. */
  readonly bones: readonly Bone[];

  /**
   * Compute fresh world rigid transforms; absent joints are neutral.
   *
   * @param joints Bone-local degree coordinates; null axes mean neutral.
   * @param root Optional finite rigid model-space placement with unit scale.
   * @returns A fresh map of independently owned world transforms.
   * @throws {RangeError} For unknown names, invalid angles, non-rigid root, a
   *   declared degree-box violation or a derived world frame that finite
   *   binary64 rigid data cannot represent.
   */
  read(
    joints?: ReadonlyMap<
      Bone,
      Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
    >,
    root?: IAutoMovieTransform,
  ): ReadonlyMap<Bone, IAutoMovieTransform>;
}
