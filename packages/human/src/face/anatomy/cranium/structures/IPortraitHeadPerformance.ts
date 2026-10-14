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
   * @evidence contracts/common.md#principled-implementation The current jaw-continuation owner restores only its actual constrained source residents and preserves compatible residual displacement from other components.
   * @evidence contracts/common.md#clear-and-simple-design Restoration operates on a copied construction cage; posing newly appended vertices remains the separate pose callback's responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The producer receives an input copy, and preparation refuses non-finite returned XYZ rather than mutating original performed vertices or fabricating a replacement reference host.
   * @evidence contracts/common.md#meaningful-documentation The member states reference-construction purpose, resident ordinal ownership, copied input and original performed-identity preservation.
   * @evidence contracts/performance.md#efficient-algorithms The current jaw callback uses one resident-map lookup and constant three-coordinate kinematics per vertex; preparation scans the actual cage population once for this restoration phase.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller's continuation closure shares one admitted observed/current jaw field and resident map; another input geometry or pose requires its corresponding closure.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The formation owner retains the callback and its captured jaw/resident source for the build lifetime; each returned three-coordinate point is consumed without acquiring a live resource.
   */
  reference: (point: number[], vertex: number) => number[];

  /**
   * Pose one new reference vertex in millimetres; do not mutate the input.
   * Preparation calls this only for the appended continuation population.
   *
   * @evidence contracts/common.md#principled-implementation The current continuation callback applies its admitted observed-relative jaw field to the same newly reference-formed cranial/cervical point while retaining its fixed posterior/lower-neck boundary.
   * @evidence contracts/common.md#clear-and-simple-design The callback transforms one point; preparation owns selecting only appended vertices and common refinement/normals remain downstream.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing component vertices are not posed a second time; finite XYZ admission preserves named refusal instead of replacing an invalid continuation point.
   * @evidence contracts/common.md#meaningful-documentation The member specifies new-vertex population, head millimetres and read-only input ownership.
   * @evidence contracts/performance.md#efficient-algorithms The actual jaw callback performs constant-size polar/trigonometric and rational-field work per appended point, with total cost linear in the continuation population.
   * @evidence contracts/performance.md#reuse-equivalent-work All appended points share the same immutable jaw-field closure rather than refitting reference anchors for each point.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the continuation closure lifetime; point arrays are returned to preparation and the callback starts no task, cache population or handle.
   */
  pose: (point: number[]) => number[];
}
