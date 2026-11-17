


/**
 * Original-cap world point and tangent at one fixed physical station.
 *
 * AutoMovieLoftCapRead.phase includes the actual axis and relief phase terms. Each successful call returns fresh mutable vectors. At an admitted collapsed tip p is the retained pole and t is zero; this does not admit a physical station derivative. Nonfinite readings and relief that destroys the collapsed tip throw from the cap reader.
 *
 * @evidence contracts/development/design.md#principled-representation Both vectors use the chain's world frame, with position in mm and derivative in mm per radian of the original polar phase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The cap reader supplies the point/tangent pair also consumed by LoftPoint and LoftChain phase samplers; their duplicate pair declarations remain consolidation candidates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero tangent at a true pole describes its constant phase value and supplies no invented station jet or regularity certificate.
 * @evidence contracts/development/common.md#meaningful-documentation States world units, fixed station, result ownership, collapsed-tip behavior and numeric failure ownership.
 */
export type IAutoMovieLoftPhaseReading = {
  /** Surface point [x,y,z] in world millimetres, including admitted relief displacement. */
  p: [number, number, number];

  /** Partial derivative of p with respect to phase, mm/radian; its magnitude is retained rather than normalized to a unit tangent. */
  t: [number, number, number];
};
