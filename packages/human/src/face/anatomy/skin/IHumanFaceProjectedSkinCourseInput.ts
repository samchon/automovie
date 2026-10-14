/**
 * Immutable native triangle sheet and ordered free guide in head-frame metres. The guide is an internal anatomical registration result, not a personal sculpting input. Width does not participate in its geometric representation.
 *
 * @evidence contracts/common.md#principled-implementation Current positions/incidence and an ordered free guide qualify native closest-feature course compilation.
 * @evidence contracts/common.md#clear-and-simple-design The anatomical producer owns guide registration while the compiler owns feature intervals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Relief width is not a feature-population control and finite immutable host/guide input remains a compilation premise.
 * @evidence contracts/common.md#meaningful-documentation Coordinates are head metres and guide order defines progression.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Native feature envelope/continuation work executes in compileHumanFaceProjectedSkinCourse.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One supplied host geometry serves all guide segments without rebuilding skin.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resource; synchronous compilation borrows arrays and returns separately owned physical spans.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourseInput {
  /** Flat triples owned by the immutable skin host. */
  positions: readonly number[];

  /** Actual resident triangle winding, flat triples. */
  indices: readonly number[];

  /** Ordered finite three-dimensional guide points, in the same frame. */
  guide: readonly (readonly number[])[];
}
