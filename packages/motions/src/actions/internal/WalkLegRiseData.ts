export namespace WalkLegRiseData {
  /*
   * The width, degrees, a kept room's pitch is bracketed to: under a hundred
   * nanometres of any point of a foot, the resolution thirty halvings of the
   * widest bracket gave.
   */
  export const RESOLVED: number = 1e-7;

  /*
   * The step, degrees, in which the rise walks the room down from the asked pitch
   * to find its first low: half a degree, under which the room of a leg near
   * straight has no second low.
   */
  export const SCAN: number = 0.5;

  /*
   * The steepest heel rise of a planted foot, degrees toes-down (provisional):
   * past it the foot would stand on its toe tips.
   */
  export const STEEPEST: number = 75;

  /*
   * The halvings that take the widest bracket, `STEEPEST` degrees, under
   * `RESOLVED`: ⌈log₂(75 / 1e-7)⌉ = 30. The Illinois steps are allowed twice as
   * many, since a stale end is halved at least every second step (Dowell and
   * Jarratt 1971), and the bisection that follows closes whatever a kink left in
   * as many again.
   */
  export const HALVINGS: number = Math.ceil(Math.log2(STEEPEST / RESOLVED));
}
