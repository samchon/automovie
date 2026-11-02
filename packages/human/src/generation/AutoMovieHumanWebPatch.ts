/**
 * Quintic boundary interpolation in normalized curve coordinates.
 * Units belong to the caller; a millimetre derivative must be multiplied by
 * its parameter run. The same operator closes every web column and shared lip.
 */
export namespace AutoMovieHumanWebPatch {
  /** A point or derivative in the owner's common Cartesian frame. */
  export type Vec3 = [number, number, number];

  /** Position and first two derivatives with respect to one unit parameter. */
  export interface IJet {
    /** Boundary position. */
    value: Vec3;
    /** First parameter derivative. */
    first: Vec3;
    /** Second parameter derivative. */
    second: Vec3;
  }

  /** Quintic Hermite position between two compatible endpoint jets. */
  export function curve(from: IJet, to: IJet, t: number): Vec3 {
    return derivative(from, to, t, 0);
  }

  /** Position, tangent or curvature of the same quintic, without differencing. */
  export function derivative(
    from: IJet,
    to: IJet,
    t: number,
    order: 0 | 1 | 2,
  ): Vec3 {
    const weights: number[] = basis(t, order);
    const values: Vec3[] = [
      from.value,
      from.first,
      from.second,
      to.value,
      to.first,
      to.second,
    ];
    const result: Vec3 = [0, 0, 0];
    for (let i: number = 0; i < values.length; i++)
      for (let k: number = 0; k < 3; k++)
        result[k]! += weights[i]! * values[i]![k]!;
    return result;
  }

  /**
   * Replace a reference curve's endpoint jets while preserving its interior
   * shape. A linear endpoint residual closes positions but changes both joins'
   * tangents; subtracting the complete Hermite residual preserves all six data.
   */
  export function constrain(
    reference: (t: number) => Vec3,
    original: [IJet, IJet],
    desired: [IJet, IJet],
  ): (t: number) => Vec3 {
    const difference: [IJet, IJet] = [
      subtract(desired[0], original[0]),
      subtract(desired[1], original[1]),
    ];
    return (t: number): Vec3 => {
      const p: Vec3 = reference(t);
      const correction: Vec3 = curve(difference[0], difference[1], t);
      return [p[0] + correction[0], p[1] + correction[1], p[2] + correction[2]];
    };
  }

  /** Difference of corresponding position, tangent and curvature data. */
  function subtract(a: IJet, b: IJet): IJet {
    const sub: (x: Vec3, y: Vec3) => Vec3 = (x: Vec3, y: Vec3): Vec3 => [
      x[0] - y[0],
      x[1] - y[1],
      x[2] - y[2],
    ];
    return {
      value: sub(a.value, b.value),
      first: sub(a.first, b.first),
      second: sub(a.second, b.second),
    };
  }

  /** Unit-interval quintic Hermite basis and its first two derivatives. */
  function basis(t: number, order: 0 | 1 | 2): number[] {
    if (order === 1)
      return [
        -30 * t ** 2 + 60 * t ** 3 - 30 * t ** 4,
        1 - 18 * t ** 2 + 32 * t ** 3 - 15 * t ** 4,
        t - 4.5 * t ** 2 + 6 * t ** 3 - 2.5 * t ** 4,
        30 * t ** 2 - 60 * t ** 3 + 30 * t ** 4,
        -12 * t ** 2 + 28 * t ** 3 - 15 * t ** 4,
        1.5 * t ** 2 - 4 * t ** 3 + 2.5 * t ** 4,
      ];
    if (order === 2)
      return [
        -60 * t + 180 * t ** 2 - 120 * t ** 3,
        -36 * t + 96 * t ** 2 - 60 * t ** 3,
        1 - 9 * t + 18 * t ** 2 - 10 * t ** 3,
        60 * t - 180 * t ** 2 + 120 * t ** 3,
        -24 * t + 84 * t ** 2 - 60 * t ** 3,
        3 * t - 12 * t ** 2 + 10 * t ** 3,
      ];
    return [
      1 - 10 * t ** 3 + 15 * t ** 4 - 6 * t ** 5,
      t - 6 * t ** 3 + 8 * t ** 4 - 3 * t ** 5,
      (t ** 2 - 3 * t ** 3 + 3 * t ** 4 - t ** 5) / 2,
      10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5,
      -4 * t ** 3 + 7 * t ** 4 - 3 * t ** 5,
      (t ** 3 - 2 * t ** 4 + t ** 5) / 2,
    ];
  }
}
