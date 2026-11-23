/**
 * Local section point and phase partials at fixed physical station.
 *
 * AutoMovieLoftSectionLegacy reads the periodic spline's correspondence phase
 * in radians; AutoMovieLoftSection also returns this shape for native polar and
 * mixed fields. The [u,v] components are local to the section plane before
 * frame, lift or relief placement. Producers return fresh mutable finite
 * vectors and reject nonfinite requested readings. Phase-only admission
 * supplies no physical station derivative or nonzero-speed guarantee.
 */
export type IAutoMovieLoftSectionPhase = {
  /** Local [u,v] point in millimetres. */
  p: [number, number];

  /** First phase partial in millimetres per radian. */
  t: [number, number];

  /**
   * Second phase partial in millimetres per squared radian; native G1 joins can
   * have a sided value.
   */
  tt: [number, number];
};
