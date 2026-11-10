/**
 * The pelvis's heading through a stepping gait, a curve through the headings
 * its footfalls give it: at each heel strike the pelvis faces midway between
 * the two feet it stands on, so neither hip turns further than the other.
 *
 * Between the knots the heading follows a monotone piecewise cubic (Fritsch
 * and Butland 1984): continuous with its rate, never overshooting a knot, and
 * constant wherever the knots are, so a straight walk keeps its heading.
 */
export class WalkTurn {
  /** The heading's rate at each knot, degrees per second. */
  private readonly rates: number[];

  /**
   * @param knots The headings in degrees at ascending seconds, unwrapped so
   *   neighbours never differ by a full turn; at least one.
   */
  public constructor(
    private readonly knots: readonly { seconds: number; yaw: number }[],
  ) {
    const slope = (i: number): number =>
      (knots[i + 1]!.yaw - knots[i]!.yaw) /
      Math.max(1e-9, knots[i + 1]!.seconds - knots[i]!.seconds);
    this.rates = knots.map((_, i: number): number => {
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
    const first: { seconds: number; yaw: number } = this.knots[0]!;
    const last: { seconds: number; yaw: number } = this.knots.at(-1)!;
    if (seconds <= first.seconds) return first.yaw;
    if (seconds >= last.seconds) return last.yaw;
    let i: number = 0;
    while (this.knots[i + 1]!.seconds < seconds) i++;
    const a: { seconds: number; yaw: number } = this.knots[i]!;
    const b: { seconds: number; yaw: number } = this.knots[i + 1]!;
    const h: number = b.seconds - a.seconds;
    if (h < 1e-9) return b.yaw;
    const u: number = (seconds - a.seconds) / h;

    // The cubic Hermite basis over the span.
    return (
      (2 * u ** 3 - 3 * u ** 2 + 1) * a.yaw +
      (u ** 3 - 2 * u ** 2 + u) * h * this.rates[i]! +
      (-2 * u ** 3 + 3 * u ** 2) * b.yaw +
      (u ** 3 - u ** 2) * h * this.rates[i + 1]!
    );
  }
}
