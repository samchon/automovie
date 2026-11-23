import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieJointPose } from "./IAutoMovieJointPose";

/**
 * An independently prepared rigid tree in its owner's closed bone vocabulary.
 *
 * @template Bone The rig's semantic bone names.
 * @evidence contracts/development/common.md#meaningful-documentation States prepared vocabulary, degree coordinates and independently owned current-frame output.
 * @evidence contracts/development/design.md#principled-representation A parent-first vocabulary and one current-joint rigid FK query describe the admitted tree.
 * @evidence contracts/development/design.md#minimal-and-owned-surface No prepared mutable frames, anatomy table, species registry or completed pose cache escapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every read recomputes actual joint rotations and enforces its declared boxes; unknown anatomy stays unknown.
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
   * @throws {RangeError} For unknown names, invalid angles, non-rigid root, a declared degree-box violation or a derived world frame that finite binary64 rigid data cannot represent.
   */
  read(
    joints?: ReadonlyMap<
      Bone,
      Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
    >,
    root?: IAutoMovieTransform,
  ): ReadonlyMap<Bone, IAutoMovieTransform>;
}
