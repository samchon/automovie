/**
 * Named inspection direction: azimuth from +Z toward +X, elevation above the world horizontal, and a positive multiplier on sphere-fit distance.
 *
 * @evidence contracts/common.md#principled-implementation Angles are subject-relative directions while distance uses the subject box half-diagonal with the framing floor; at least factor one is needed to claim whole-sphere fit.
 * @evidence contracts/common.md#clear-and-simple-design A compact direction record separates planning identity from world-space pose calculation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An id names a planned direction and is not proof of rendering; finite angles, valid bounds/lens and positive distance remain caller premises.
 * @evidence contracts/common.md#meaningful-documentation Documents axes, angle units, sphere distance and planning-versus-observation identity.
 * @evidence contracts/performance.md#efficient-algorithms The record chooses no traversal; framing consumes its fixed-size numbers and generation scales with plan size.
 * @evidence contracts/performance.md#reuse-equivalent-work Directions can be reused across subjects, but world poses depend on each current box, lens and multiplier.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This scalar/text record owns no native resources; plan and capture consumers control reference lifetime.
 */
export interface IAutoMovieViewerViewpoint {
  /**
   * Deterministic identity of this viewpoint within its plan.
   *
   * Derived from the angles, so the same plan yields the same identities and a coverage record can say which of them were actually rendered.
   */
  id: string;

  /**
   * Compass angle around the subject's world-up axis, in degrees, measured from `+Z` toward `+X`.
   */
  azimuthDeg: number;

  /**
   * Angle above the subject's horizontal plane, in degrees.
   */
  elevationDeg: number;

  /**
   * Multiplier on the floored circumsphere-fit distance; values above one add distance. Finite input and clip conventions still govern whether the complete subject is actually visible.
   */
  distanceFactor: number;
}
