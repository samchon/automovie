/**
 * A squared distance to a fixed target as a joint turns, `A + B cos t + C sin
 * t` of its turn `t` from the centre of its range (a point on a circle about
 * the joint's axis, its distance squared to a fixed point), recovered from the
 * range's two ends and its middle, `t = −half, 0, half`.
 *
 * @param low The value at the range's low end.
 * @param middle The value at its middle.
 * @param high The value at its high end.
 * @param half The range's half width, radians, under a half turn.
 * @returns The harmonic's three coefficients.
 */
export function fixedSeatHarmonic(
  low: number,
  middle: number,
  high: number,
  half: number,
): fixedSeatHarmonic.IHarmonic {
  const cosine: number = Math.cos(half);
  const constant: number = ((low + high) / 2 - middle * cosine) / (1 - cosine);
  return {
    constant,
    cosine: middle - constant,
    sine: (high - low) / (2 * Math.sin(half)),
  };
}

/** The harmonic's coefficients and the least of two. */
export namespace fixedSeatHarmonic {
  /** `A + B cos t + C sin t`. */
  export interface IHarmonic {
    /** `A`. */
    constant: number;
    /** `B`. */
    cosine: number;
    /** `C`. */
    sine: number;
  }

  /**
   * The turn within `[−half, half]` where the greater of two harmonics is
   * least: at an end, at either harmonic's own extremum or where the two cross,
   * whichever reads least, the incoming turn kept on a tie.
   *
   * @param left The first harmonic.
   * @param right The second.
   * @param half The range's half width, radians.
   * @param incoming The turn the search arrives with, radians.
   * @returns The turn, radians.
   */
  export function best(
    left: IHarmonic,
    right: IHarmonic,
    half: number,
    incoming: number,
  ): number {
    const candidates: number[] = [incoming, -half, half];
    for (const f of [left, right])
      candidates.push(Math.atan2(-f.sine, -f.cosine));
    const a: number = left.constant - right.constant;
    const b: number = left.cosine - right.cosine;
    const c: number = left.sine - right.sine;
    const radius: number = Math.hypot(b, c);
    if (radius > 0 && Math.abs(a) <= radius) {
      const phase: number = Math.atan2(c, b);
      const separation: number = Math.acos(-a / radius);
      for (const angle of [phase - separation, phase + separation])
        candidates.push(Math.atan2(Math.sin(angle), Math.cos(angle)));
    }
    let chosen: number = incoming;
    let least: number = Infinity;
    for (const angle of candidates) {
      if (angle < -half || angle > half) continue;
      const x: number = Math.cos(angle);
      const y: number = Math.sin(angle);
      const score: number = Math.max(
        left.constant + left.cosine * x + left.sine * y,
        right.constant + right.cosine * x + right.sine * y,
      );
      if (score < least) {
        least = score;
        chosen = angle;
      }
    }
    return chosen;
  }
}
