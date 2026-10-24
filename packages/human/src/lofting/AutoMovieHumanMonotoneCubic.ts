/**
 * Monotone piecewise cubic Hermite interpolation through knots (Fritsch
 * and Carlson 1980, "Monotone piecewise cubic interpolation").
 *
 * Interior slopes are the harmonic mean of the neighbouring secants when
 * those agree in sign and zero otherwise, which keeps each piece between
 * its knot values, so the curve never overshoots a knot. End slopes are
 * zero and the value is held constant beyond the end knots: the curve is
 * C1 everywhere, including where it meets the held ends. Knots closer
 * than `merge` in abscissa are one knot (the first is kept), so two
 * landmarks found at one place cannot make a zero-width piece.
 */
export namespace AutoMovieHumanMonotoneCubic {
  /**
   * Value at x.
   *
   * @param knots `[x, y]` pairs in any order, at least one.
   * @param x Abscissa.
   * @param merge Least abscissa spacing kept between knots; 0 keeps all.
   * @returns The interpolated value.
   */
  export function interpolate(
    knots: readonly (readonly [number, number])[],
    x: number,
    merge: number = 0,
  ): number {
    const k: (readonly [number, number])[] = [...knots]
      .sort(
        (a: readonly [number, number], b: readonly [number, number]): number =>
          a[0] - b[0],
      )
      .filter(
        (
          p: readonly [number, number],
          i: number,
          all: (readonly [number, number])[],
        ): boolean => i === 0 || p[0] - all[i - 1]![0] > merge,
      );
    const n: number = k.length;
    if (n === 1 || x <= k[0]![0]) return k[0]![1];
    if (x >= k[n - 1]![0]) return k[n - 1]![1];

    let i: number = 0;
    while (k[i + 1]![0] < x) ++i;
    const secant: (j: number) => number = (j: number): number =>
      (k[j + 1]![1] - k[j]![1]) / (k[j + 1]![0] - k[j]![0]);
    const slope: (j: number) => number = (j: number): number => {
      if (j === 0 || j === n - 1) return 0;
      const a: number = secant(j - 1);
      const b: number = secant(j);
      return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
    };

    const [x0, y0] = k[i]!;
    const [x1, y1] = k[i + 1]!;
    const h: number = x1 - x0;
    const t: number = (x - x0) / h;
    const t2: number = t * t;
    const t3: number = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * y0 +
      (t3 - 2 * t2 + t) * h * slope(i) +
      (-2 * t3 + 3 * t2) * y1 +
      (t3 - t2) * h * slope(i + 1)
    );
  }
}
