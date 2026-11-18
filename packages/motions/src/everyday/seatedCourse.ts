/**
 * The timing and trunk flexion of getting down onto a seat and up from it,
 * as functions of the seat's height ratio `r`, its height over the body's
 * popliteal height (`seated.ratio`). The sit reads them for its descent, the
 * rise for its ascent, so both move on one law: stand-to-sit is the rise
 * reversed under eccentric control (Kralj, Jaeger and Munih 1990).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is timed, the ratio it reads and who reads it.
 * @evidence contracts/development/design.md#principled-representation Two pure functions of a dimensionless ratio, returning seconds and degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two quantities the sit and the rise share, and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body or seat is special-cased; the ratio carries the seat.
 */
export namespace seatedCourse {
  /**
   * The seconds a sit takes to come down onto a seat, and a rise to stand up
   * from it, before the manner's tempo: `2 (1 + 0.6 (1 - r))`. A lower seat
   * takes longer (Janssen, Bussmann and Stam 2002, Phys Ther 82:866), and
   * sit-to-stand takes about 1.5 to 2.5 s in healthy adults.
   *
   * @param ratio The seat's height over the popliteal height.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law and its sources.
   * @evidence contracts/development/implementation.md#principled-implementation A line in the seat's height ratio through the measured band, longer for a lower seat.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression, the one owner the sit and the rise read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One law for both directions; no case is special.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function descent(ratio: number): number {
    return 2 * (1 + 0.6 * (1 - ratio));
  }

  /**
   * The peak trunk flexion a sit or a rise reaches, degrees: `35 + 50 (1 - r)`.
   * A lower seat needs more trunk flexion (Janssen, Bussmann and Stam 2002).
   *
   * @param ratio The seat's height over the popliteal height.
   * @returns Degrees of forward trunk flexion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law and its source.
   * @evidence contracts/development/implementation.md#principled-implementation A line in the seat's height ratio, more flexion for a lower seat.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression, the one owner the sit and the rise read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One law for both directions; no case is special.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function flexion(ratio: number): number {
    return 35 + 50 * (1 - ratio);
  }
}
