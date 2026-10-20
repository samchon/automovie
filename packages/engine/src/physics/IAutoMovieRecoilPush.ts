/** Clinical axis targets in degrees used to construct a recoil pose.
 *
 * @evidence contracts/common.md#principled-implementation Optional degree-valued clinical axes let impactRecoil distinguish absent/zero axes from requested nonzero targets; they are targets to clamp, not a general rest-neutral additive rotation.
 * @evidence contracts/common.md#clear-and-simple-design One sparse axis record carries the intent consumed by a named bone chain; joint constraints remain with the skeleton.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture-specific recoil is encoded; impulseToRecoilPush currently produces magnitude-based flexion only, so physical impact direction is not represented.
 * @evidence contracts/common.md#meaningful-documentation Axis units, absent-axis meaning and target semantics are documented for callers composing flinch poses.
 * @evidence contracts/performance.md#efficient-algorithms At most three scalars are stored; chain traversal and constraint projection are owned by impactRecoil.
 * @evidence contracts/performance.md#reuse-equivalent-work The producer returns a new intent record; callers may supply one record to multiple recoil evaluations but this type defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The intent retains no bone list or resource; its scalar storage lasts only as long as the caller retains it.
 */
export interface IAutoMovieRecoilPush {
  /** Flexion target in degrees; absent or zero authors no flexion response. */
  flexion?: number;

  /** Abduction target in degrees; absent or zero authors no abduction response. */
  abduction?: number;

  /** Twist target in degrees; absent or zero authors no twist response. */
  twist?: number;
}
