/** The record of `IAtB`'s site. */
type IAtB = { seconds: number; yaw: number };

/** The record of `IAtA`'s site. */
type IAtA = { seconds: number; yaw: number };

/** The record of `IAtLast`'s site. */
type IAtLast = { seconds: number; yaw: number };

/** The record of `IAtFirst`'s site. */
type IAtFirst = { seconds: number; yaw: number };

/** The record of `IWalkTurnKnotsItem`'s site. */
type IWalkTurnKnotsItem = { seconds: number; yaw: number };
/**
 * The pelvis's heading through a stepping gait, a curve through the headings
 * its footfalls give it: at each heel strike the pelvis faces midway between
 * the two feet it stands on, so neither hip turns further than the other.
 *
 * Between the knots the heading follows a monotone piecewise cubic (Fritsch and
 * Butland 1984): continuous with its rate, never overshooting a knot, and
 * constant wherever the knots are, so a straight walk keeps its heading.
 */
export class WalkTurn {
  /** The heading's rate at each knot, degrees per second. */
  private readonly rates: number[];

  /**
   * @param knots The headings in degrees at ascending seconds, unwrapped so
   *   neighbours never differ by a full turn; at least one.
   */
  public constructor(private readonly knots: readonly IWalkTurnKnotsItem[]) {
    const slope: (i: number) => number = (i: number): number =>
      (knots[i + 1]!.yaw - knots[i]!.yaw) /
      Math.max(1e-9, knots[i + 1]!.seconds - knots[i]!.seconds);
    this.rates = knots.map((_: unknown, i: number): number => {
      // The heading rests at both ends, and at any knot where it reverses.
      if (i === 0 || i === knots.length - 1) return 0;
      const before: number = slope(i - 1);
      const after: number = slope(i);
      if (before * after <= 0) return 0;

      // The weighted harmonic mean of the two slopes keeps each span monotone.
      const left: number = knots[i]!.seconds - knots[i - 1]!.seconds;
      const right: number = knots[i + 1]!.seconds - knots[i]!.seconds;
      const a: number = 2 * right + left;
      const b: number = right + 2 * left;
      return (a + b) / (a / before + b / after);
    });
  }

  /**
   * The heading at an instant, held at the first and last knots outside them.
   *
   * @param seconds The instant.
   * @returns Degrees.
   */
  public at(seconds: number): number {
    const first: IAtFirst = this.knots[0]!;
    const last: IAtLast = this.knots.at(-1)!;
    if (seconds <= first.seconds) return first.yaw;
    if (seconds >= last.seconds) return last.yaw;
    let i: number = 0;
    let high: number = this.knots.length - 2;
    while (i < high) {
      const middle: number = (i + high) >>> 1;
      if (this.knots[middle + 1]!.seconds < seconds) i = middle + 1;
      else high = middle;
    }
    const a: IAtA = this.knots[i]!;
    const b: IAtB = this.knots[i + 1]!;
    const h: number = b.seconds - a.seconds;
    if (h < 1e-9) return b.yaw;
    const u: number = (seconds - a.seconds) / h;
    const square: number = u ** 2;
    const cube: number = u ** 3;

    // The cubic Hermite basis over the span.
    return (
      (2 * cube - 3 * square + 1) * a.yaw +
      (cube - 2 * square + u) * h * this.rates[i]! +
      (-2 * cube + 3 * square) * b.yaw +
      (cube - square) * h * this.rates[i + 1]!
    );
  }
}
