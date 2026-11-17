/**
 * World point and phase tangent at one fixed physical station.
 *
 * LoftChain, LoftPoint and LoftCapRead phase readers include their actual frame and relief terms. Each successful read returns fresh mutable vectors. At an admitted collapsed tip p is the retained pole and t is zero; this does not admit a physical station derivative. Nonfinite readings throw from the owning reader, as does relief that destroys a collapsed cap.
 *
 * @evidence contracts/development/design.md#principled-representation Both vectors use the chain's world frame, with position in mm and derivative in mm per radian of its declared polar or correspondence phase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Cap, LoftPoint and LoftChain readers publish this same world point/tangent pair without implying a physical-station jet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero tangent at a true pole describes its constant phase value and supplies no invented station jet or regularity certificate.
 * @evidence contracts/development/common.md#meaningful-documentation States world units, fixed station, result ownership, collapsed-tip behavior and numeric failure ownership.
 */
export type IAutoMovieLoftPhaseReading = {
  /** Surface point [x,y,z] in world millimetres, including admitted relief displacement. */
  p: [number, number, number];

  /** Partial derivative of p with respect to phase, mm/radian; its magnitude is retained rather than normalized to a unit tangent. */
  t: [number, number, number];
};
