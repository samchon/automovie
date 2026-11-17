/** Clinical axis targets in degrees used to construct a recoil pose.
 *
 * @evidence contracts/development/design.md#principled-representation Optional degree-valued clinical axes let impactRecoil distinguish absent/zero axes from requested nonzero targets; they are targets to clamp, not a general rest-neutral additive rotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One sparse axis record carries the intent consumed by a named bone chain; joint constraints remain with the skeleton.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture-specific recoil is encoded; impulseToRecoilPush currently produces magnitude-based flexion only, so physical impact direction is not represented.
 * @evidence contracts/development/common.md#meaningful-documentation Axis units, absent-axis meaning and target semantics are documented for callers composing flinch poses.
 */
export interface IAutoMovieRecoilPush {
  /** Flexion target in degrees; absent or zero authors no flexion response. */
  flexion?: number;

  /** Abduction target in degrees; absent or zero authors no abduction response. */
  abduction?: number;

  /** Twist target in degrees; absent or zero authors no twist response. */
  twist?: number;
}
