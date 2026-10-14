import type {
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Wrap authored joint records and an optional whole-body root for the supplied skeleton identity. Null root retains absence; joint/root data are borrowed and must not be mutated through another sharing clip.
 *
 * @evidence contracts/common.md#principled-implementation The motion pose schema separates skeleton identity, optional root transform and named joint angles without deriving a second geometry representation.
 * @evidence contracts/common.md#clear-and-simple-design A single wrapper keeps pose assembly explicit while sampling, rig compatibility and rendering stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplying a skeleton name does not validate bone compatibility or anatomy, and absent root is not replaced with guessed motion.
 * @evidence contracts/common.md#meaningful-documentation The comment defines null-root meaning and borrowing/mutation limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant-size wrapper creation borrows the supplied joint array/root rather than traversing or copying its population.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared authored pose vocabulary can borrow the same joint/root records; output wrappers remain independent and callers preserve their read-only sharing premise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the wrapper and supplied records' lifetime; this constructor retains no cross-call state or external resource.
 *
 * @author Samchon
 */
export function createStickmanMotionPose(
  skeleton: string,
  joints: IAutoMovieJointPose[],
  root: IAutoMovieTransform | null = null,
): IAutoMoviePose {
  return { skeleton, root, joints };
}
