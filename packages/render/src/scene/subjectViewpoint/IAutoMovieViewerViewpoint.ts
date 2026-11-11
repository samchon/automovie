/**
 * Named inspection direction: azimuth from +Z toward +X, elevation above the world horizontal, and a positive multiplier on sphere-fit distance.
 *
 * @evidence contracts/development/design.md#principled-representation Angles are subject-relative directions while distance uses the subject box half-diagonal with the framing floor; at least factor one is needed to claim whole-sphere fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A compact direction record separates planning identity from world-space pose calculation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An id names a planned direction and is not proof of rendering; finite angles, valid bounds/lens and positive distance remain caller premises.
 * @evidence contracts/development/common.md#meaningful-documentation Documents axes, angle units, sphere distance and planning-versus-observation identity.
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
