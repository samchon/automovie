/**
 * Local section point and phase partials at fixed physical station.
 *
 * AutoMovieLoftSectionLegacy reads the periodic spline's correspondence phase in radians; AutoMovieLoftSection also returns this shape for native polar and mixed fields. The [u,v] components are local to the section plane before frame, lift or relief placement. Producers return fresh mutable finite vectors and reject nonfinite requested readings. Phase-only admission supplies no physical station derivative or nonzero-speed guarantee.
 *
 * @evidence contracts/development/design.md#principled-representation Three local pairs carry position and first/second partials of one generating function under its radian phase, rather than arc-length curvature.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Legacy, native and mixed station readers exchange this one local phase reading; the source chooses correspondence while every derivative uses its radian clock.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The structure excludes unavailable station partials; a native G1 join may retain a sided second phase partial rather than global C2 continuity.
 * @evidence contracts/development/common.md#meaningful-documentation Defines local coordinate order, radian units, fresh output ownership and the limits of phase-only admission.
 */
export type IAutoMovieLoftSectionPhase = {
  /** Local [u,v] point in millimetres. */
  p: [number, number];

  /** First phase partial in millimetres per radian. */
  t: [number, number];

  /** Second phase partial in millimetres per squared radian; native G1 joins can have a sided value. */
  tt: [number, number];
};
