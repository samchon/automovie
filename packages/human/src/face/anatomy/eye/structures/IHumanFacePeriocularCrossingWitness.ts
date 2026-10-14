/**
 * An existing transverse crossing tied to the emitted and host incidence.
 * Ordinals retain the instrument's first witness per first triangle; they
 * are not a complete-pair count or a clinical interpretation.
 *
 *
 * @evidence contracts/common.md#principled-implementation An emitted triangle pair retains actual source parents and the inspected corner identities.
 * @evidence contracts/common.md#clear-and-simple-design The mapping owner preserves the existing engine instrument's first transverse witness per first triangle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Witness population is not a complete pair count or clinical interpretation.
 * @evidence contracts/common.md#meaningful-documentation The prose and fields identify instrument scope and both emitted/native parents.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularCrossingWitness is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularCrossingWitness declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularCrossingWitness acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularCrossingWitness {
  /** First emitted sheet triangle ordinal. */
  triangle: number;

  /** Second emitted sheet triangle ordinal. */
  other: number;

  /** Actual source-host triangle of the first emitted triangle. */
  sourceTriangle: number;

  /** Actual source-host triangle of the second emitted triangle. */
  otherSourceTriangle: number;

  /** First emitted triangle's vertex identities. */
  corners: number[];

  /** Second emitted triangle's vertex identities. */
  otherCorners: number[];
}
