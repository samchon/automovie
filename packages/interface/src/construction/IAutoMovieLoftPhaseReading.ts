/**
 * World-space point and phase derivative at one fixed physical station. The
 * reader applies the actual frame and any admitted relief and returns fresh
 * vectors. At a collapsed tip, the point is the retained pole and the phase
 * derivative is zero. Physical-station derivatives use a separate contract.
 */
export type IAutoMovieLoftPhaseReading = {
  /**
   * Surface point [x, y, z] in world millimetres, after frame placement and
   * admitted relief.
   */
  p: [number, number, number];

  /**
   * Partial derivative of the world point with respect to phase, in millimetres
   * per radian. Its magnitude belongs to the derivative.
   */
  t: [number, number, number];
};
