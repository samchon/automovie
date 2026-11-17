import type {
  IAutoMovieJointPose,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * An independently prepared rigid tree in its owner's closed bone vocabulary.
 *
 * @template Bone The rig's semantic bone names.
 * @evidence contracts/development/common.md#meaningful-documentation States prepared vocabulary, degree coordinates and independently owned current-frame output.
 * @evidence contracts/development/design.md#principled-representation A parent-first vocabulary and one current-joint rigid FK query describe the admitted tree.
 * @evidence contracts/development/design.md#minimal-and-owned-surface No prepared mutable frames, anatomy table, species registry or completed pose cache escapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every read recomputes actual joint rotations and enforces its declared boxes; unknown anatomy stays unknown.
 */
export interface IArticulatedRigReader<Bone extends string> {
  /** Parent-first semantic bone names, frozen independently of the input. */
  readonly bones: readonly Bone[];

  /**
   * Compute fresh world rigid transforms; absent joints are neutral.
   *
   * @param joints Bone-local degree coordinates; null axes mean neutral.
   * @param root Optional finite rigid model-space placement with unit scale.
   * @returns A fresh map of independently owned world transforms.
   * @throws {RangeError} For unknown names, invalid angles, non-rigid root or a declared degree-box violation.
   * @evidence contracts/development/common.md#meaningful-documentation States angle units, null meaning, root domain, independent output and refusal cases.
   * @evidence contracts/development/implementation.md#principled-implementation Parent-first rigid FK composes each admitted neutral transform with the actual basis-defined joint quaternion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate current names/angles and compose one world transform per prepared bone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle clamp, species case, dummy humanoid slot, stale completed pose or unknown anatomical default is used.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+J) work and O(B) fresh output for B bones and J supplied joints; graph order is already prepared.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only admitted immutable graph/basis/rest metadata, recomputing each actual current pose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Output transforms belong to the returned map; no input map, query result, process or external handle is retained by the reader.
   */
  read(
    joints?: ReadonlyMap<
      Bone,
      Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
    >,
    root?: IAutoMovieTransform,
  ): ReadonlyMap<Bone, IAutoMovieTransform>;
}
