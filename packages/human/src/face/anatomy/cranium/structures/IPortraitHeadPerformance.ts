/**
 * Reference formation and performance of newly appended head tissue. Existing
 * facial/component vertices keep their performed positions and shared IDs.
 * Only continuation vertices are posed before common refinement and normals.
 *
 *
 * @evidence contracts/common.md#principled-implementation Reference restoration forms a copied existing cage for continuation construction; only newly appended cranial/cervical vertices are posed into the original cage, whose existing component vertices keep performed identities.
 * @evidence contracts/common.md#clear-and-simple-design Two callbacks separate constructing in reference coordinates from posing the new continuation before shared refinement/normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callbacks must not mutate input; preparePortraitHead passes copies and refuses non-finite XYZ rather than accepting malformed continuation.
 * @evidence contracts/common.md#meaningful-documentation The description states preserved component IDs and new-vertex timing; callback comments state restoration/pose ownership and millimetres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitHeadPerformance is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitHeadPerformance declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitHeadPerformance starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
 * @author Samchon
 */
export interface IPortraitHeadPerformance {
  /**
   * Restore reference coordinates for construction; do not mutate the input.
   * The copied existing cage supplies each resident vertex ordinal. The
   * original cage retains its performed coordinates and identities.
   *
   * @evidence contracts/common.md#principled-implementation Preparation supplies a copied resident point and its cage ordinal so the caller can restore its own reference frame without changing the performed cage.
   * @evidence contracts/common.md#clear-and-simple-design Restoration operates on a copied construction cage; posing newly appended vertices remains the separate pose callback's responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The producer receives an input copy, and preparation refuses non-finite returned XYZ rather than mutating original performed vertices or fabricating a replacement reference host.
   * @evidence contracts/common.md#meaningful-documentation The member states reference-construction purpose, resident ordinal ownership, copied input and original performed-identity preservation.
   * @evidence contracts/performance.md#efficient-algorithms Preparation invokes this callback once per existing cage vertex and copies three coordinates; callback cost is supplied by the caller and is not bounded by this signature.
   * @evidence contracts/performance.md#reuse-equivalent-work The same callback serves all resident vertices of this assembly; the caller owns any reusable reference data and its invalidation when source geometry or performance changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The formation retains this callback for its own lifetime; captured data and resources remain the caller's responsibility and this signature imposes no retention bound.
   */
  reference: (point: number[], vertex: number) => number[];

  /**
   * Pose one new reference vertex in millimetres; do not mutate the input.
   * Preparation calls this only for the appended continuation population.
   *
   * @evidence contracts/common.md#principled-implementation Preparation supplies a copied newly constructed reference point so the caller can perform continuation tissue in the same frame as the existing cage.
   * @evidence contracts/common.md#clear-and-simple-design The callback transforms one point; preparation owns selecting only appended vertices and common refinement/normals remain downstream.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing component vertices are not posed a second time; finite XYZ admission preserves named refusal instead of replacing an invalid continuation point.
   * @evidence contracts/common.md#meaningful-documentation The member specifies new-vertex population, head millimetres and read-only input ownership.
   * @evidence contracts/performance.md#efficient-algorithms Preparation invokes this callback once per appended continuation vertex and copies three coordinates; the caller determines the transformation's per-point cost.
   * @evidence contracts/performance.md#reuse-equivalent-work All appended points use the same callback; reusable transformation data and equivalence across builds belong to the caller rather than this function type.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The formation retains this callback for its lifetime and preparation copies each returned point; arbitrary captured state has no bound enforced by this signature.
   */
  pose: (point: number[]) => number[];
}
