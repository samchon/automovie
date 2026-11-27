/*
 * The knots of a movement curve and the holds at them. A knot is a point the
 * curve passes, with its own dwell: a knot with a dwell is reached at rest,
 * held for that many seconds as an explicit interval of the curve, and left
 * from rest, so the movement splits there into pieces, each a rest-to-rest
 * movement in the sense of Flash and Hogan (1985, J. Neurosci. 5(7):1688), with
 * its interior knots passed without stopping.
 */
export namespace HumanKnot {
  /*
   * One knot.
   */
  export interface IKnot {
    /*
     * The point, each coordinate in the curve's own units.
     */
    position: readonly number[];

    /*
     * The hold at the knot, seconds, zero for a knot passed without stopping.
     */
    dwell: number;
  }

  /*
   * A movement between two holds: the knots from `first` to `last`, at rest at
   * both, with no hold inside.
   */
  export interface IPiece {
    /*
     * The index of the piece's first knot.
     */
    first: number;

    /*
     * The index of its last knot, greater than `first`.
     */
    last: number;
  }

  /*
   * The pieces a curve's holds split it into: every interior knot with a dwell
   * ends one piece and starts the next. The first and the last knot's dwells
   * are holds before and after the movement and split nothing.
   * Parameter knots: The curve's knots, in order.
   * Returns: Its pieces in order; none for fewer than two knots.
   */
  export function pieces(knots: readonly IKnot[]): IPiece[] {
    const out: IPiece[] = [];
    let first: number = 0;
    for (let k: number = 1; k < knots.length; ++k)
      if (k === knots.length - 1 || knots[k]!.dwell > 0) {
        out.push({ first, last: k });
        first = k;
      }
    return out;
  }
}
