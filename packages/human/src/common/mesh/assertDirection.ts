import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Refuse a triangle whose oriented area normal has turned away from its source.
 *
 * `before` and `after` are the face's area vectors (see `triangleAreaVector`)
 * before and after a transformation. Both are normalized here and their dot
 * product must be above zero: a mirror, a collapse through zero or a rounding
 * that flips the winding fails it, and the error names the `stage` and the
 * triangle's corner offset `face`. Both vectors must be nonzero, which the
 * callers establish by classifying redundant (zero-area) triangles first.
 * Shared by `placeMeshPreservingFaces` after a linear placement and by
 * `float32MeshBuffers` after Float32 rounding.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Nonzero before/after area vectors are normalized and their dot must be positive; callers classify redundant faces first and supply finite areas. Opposed/collapsed nonredundant faces refuse.
 * @evidence contracts/common.md#clear-and-simple-design One orientation predicate serves placement, local-frame translation and Float32 conversion while their owners decide reference classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absolute area epsilon, subject identity or renderer result exempts a face; stage/ordinal identifies the real refusal.
 * @evidence contracts/common.md#meaningful-documentation The comment states vector roles/units, nonredundancy premise and failure naming.
 * @evidence contracts/performance.md#efficient-algorithms Two three-component norms and a dot require constant work/storage per face.
 * @evidence contracts/performance.md#reuse-equivalent-work Conversion owners reuse this predicate and each vector length is computed once rather than maintaining separate orientation thresholds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar intermediates are local; a thrown Error transfers to its catcher with no retained buffer, handle or task.
 */
export function assertDirection(
  before: IAutoMovieVector3,
  after: IAutoMovieVector3,
  face: number,
  stage: string,
): void {
  const beforeLength: number = Math.hypot(before.x, before.y, before.z);
  const afterLength: number = Math.hypot(after.x, after.y, after.z);
  const agreement: number =
    (before.x / beforeLength) * (after.x / afterLength) +
    (before.y / beforeLength) * (after.y / afterLength) +
    (before.z / beforeLength) * (after.z / afterLength);
  if (!(agreement > 0))
    throw new Error(
      `Model ${stage} must preserve nonredundant triangle ${face}.`,
    );
}
