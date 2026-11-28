/**
 * Local section value and the first two phase partials at fixed physical
 * station. Each vector uses the section's u/v chart before frame, lift and
 * relief. Legacy sections use their periodic correspondence phase; native
 * sections use polar phase. Both angles are in radians.
 */
export type IAutoMovieLoftSectionPhase = {
  /** Position [u, v] in section-chart millimetres. */
  p: [number, number];

  /** First phase partial of [u, v], in millimetres per radian. */
  t: [number, number];

  /**
   * Second phase partial of [u, v], in millimetres per squared radian. A native
   * G1 join can supply a sided value.
   */
  tt: [number, number];
};
