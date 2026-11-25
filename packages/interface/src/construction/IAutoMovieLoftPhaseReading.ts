/**
 * World point and phase tangent at one fixed physical station.
 *
 * LoftChain, LoftPoint and LoftCapRead phase readers include their actual frame
 * and relief terms. Each successful read returns fresh mutable vectors. At an
 * admitted collapsed tip p is the retained pole and t is zero; this does not
 * admit a physical station derivative. Nonfinite readings throw from the owning
 * reader, as does relief that destroys a collapsed cap.
 */
export type IAutoMovieLoftPhaseReading = {
  /**
   * Surface point [x,y,z] in world millimetres, including admitted relief
   * displacement.
   */
  p: [number, number, number];

  /**
   * Partial derivative of p with respect to phase, mm/radian; its magnitude is
   * retained rather than normalized to a unit tangent.
   */
  t: [number, number, number];
};
