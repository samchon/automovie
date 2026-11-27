/*
 * The timing and trunk flexion of getting down onto a seat and up from it, as
 * functions of the seat's height ratio `r`, its height over the body's
 * popliteal height (`seated.ratio`). The sit reads them for its descent, the
 * rise for its ascent, so both move on one law: stand-to-sit is the rise
 * reversed under eccentric control (Kralj, Jaeger and Munih 1990).
 */
export namespace seatedCourse {
  /*
   * The seconds a sit takes to come down onto a seat, and a rise to stand up
   * from it, before the manner's tempo: `2 (1 + 0.6 (1 - r))`. A lower seat
   * takes longer (Janssen, Bussmann and Stam 2002, Phys Ther 82:866), and
   * sit-to-stand takes about 1.5 to 2.5 s in healthy adults.
   * Parameter ratio: The seat's height over the popliteal height.
   * Returns: Seconds.
   */
  export function descent(ratio: number): number {
    return 2 * (1 + 0.6 * (1 - ratio));
  }

  /*
   * The peak trunk flexion a sit or a rise reaches, degrees: `35 + 50 (1 - r)`.
   * A lower seat needs more trunk flexion (Janssen, Bussmann and Stam 2002).
   * Parameter ratio: The seat's height over the popliteal height.
   * Returns: Degrees of forward trunk flexion.
   */
  export function flexion(ratio: number): number {
    return 35 + 50 * (1 - ratio);
  }
}
