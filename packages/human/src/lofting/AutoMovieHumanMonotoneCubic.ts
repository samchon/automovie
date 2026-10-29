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
  /** Actual value and derivative of a scalar source/target coordinate map. */
  export interface ICoordinateValue {
    /** Target coordinate, or source coordinate from inverse(). */
    value: number;
    /** Derivative of that same function at the argument. */
    derivative: number;
  }

  /** An increasing coordinate map and the actual inverse of its same pieces. */
  export interface ICoordinate {
    /** True only when construction is the exact identity coordinate. */
    identity: boolean;
    (x: number): ICoordinateValue;
    /** Exact linear tails and numerical inversion of the same cubic interior. */
    inverse: (y: number) => ICoordinateValue;
  }

  /**
   * Convex combination of positive maps with weights independent of the
   * mapped coordinate. The inverse brackets between the component
   * inverses, then inverts this same weighted function, never swapped knots.
   */
  export function blend(
    maps: readonly ICoordinate[],
    weights: readonly number[],
  ): ICoordinate | undefined {
    if (
      maps.length === 0 || maps.length !== weights.length ||
      !weights.every((w: number): boolean => Number.isFinite(w) && w >= 0)
    ) return undefined;
    const total: number = weights.reduce(
      (sum: number, w: number): number => sum + w, 0,
    );
    if (!(Number.isFinite(total) && total > 0)) return undefined;
    const active: { map: ICoordinate; weight: number }[] = maps.flatMap(
      (map: ICoordinate, i: number): { map: ICoordinate; weight: number }[] =>
        weights[i] === 0 ? [] : [{ map, weight: weights[i]! / total }],
    );
    if (active.every(
      (part: { map: ICoordinate; weight: number }): boolean => part.map.identity,
    )) return coordinate([[0, 0], [1, 1]])!;
    const at: (x: number) => ICoordinateValue = (x: number): ICoordinateValue =>
      active.reduce(
        (sum: ICoordinateValue, part: { map: ICoordinate; weight: number }):
          ICoordinateValue => {
          const value: ICoordinateValue = part.map(x);
          return {
            value: sum.value + part.weight * value.value,
            derivative: sum.derivative + part.weight * value.derivative,
          };
        },
        { value: 0, derivative: 0 },
      );
    const inverse: (y: number) => ICoordinateValue =
      (y: number): ICoordinateValue => {
        if (!Number.isFinite(y)) return { value: NaN, derivative: NaN };
        const ends: number[] = active.map(
          (part: { map: ICoordinate; weight: number }): number =>
            part.map.inverse(y).value,
        );
        if (!ends.every(Number.isFinite)) return { value: NaN, derivative: NaN };
        let lo: number = Math.min(...ends);
        let hi: number = Math.max(...ends);
        while (true) {
          const mid: number = lo / 2 + hi / 2;
          if (mid === lo || mid === hi) break;
          const value: number = at(mid).value;
          if (!Number.isFinite(value)) return { value: NaN, derivative: NaN };
          if (value === y) { lo = mid; hi = mid; break; }
          if (value < y) lo = mid;
          else hi = mid;
        }
        const value: number = lo / 2 + hi / 2;
        const derivative: number = 1 / at(value).derivative;
        return Number.isFinite(value) && Number.isFinite(derivative) && derivative > 0
          ? { value, derivative } : { value: NaN, derivative: NaN };
      };
    return Object.assign(at, { inverse, identity: false });
  }

  /**
   * C1 absolute-coordinate transport through strictly ordered finite knots.
   * Positive secants and harmonic slopes preserve positive interior rates.
   * End secants and linear tails avoid interpolate()'s held-end rank loss.
   * This is a 1-D chart condition, not a 3-D/global injectivity guarantee.
   */
  export function coordinate(
    knots: readonly (readonly [number, number])[],
  ): ICoordinate | undefined {
    if (
      knots.length < 2 ||
      !knots.every(
        (p: readonly [number, number], i: number): boolean =>
          Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
          (i === 0 || (
            p[0] > knots[i - 1]![0] && p[1] > knots[i - 1]![1]
          )),
      )
    ) return undefined;
    if (knots.every(
      (p: readonly [number, number]): boolean => p[0] === p[1],
    )) {
      const identity: (x: number) => ICoordinateValue =
        (x: number): ICoordinateValue => ({ value: x, derivative: 1 });
      return Object.assign(identity, { inverse: identity, identity: true });
    }
    const secants: number[] = knots.slice(1).map(
      (p: readonly [number, number], i: number): number =>
        (p[1] - knots[i]![1]) / (p[0] - knots[i]![0]),
    );
    if (!secants.every(
      (v: number): boolean => Number.isFinite(v) && v > 0,
    )) return undefined;
    const slopes: number[] = knots.map(
      (_: readonly [number, number], i: number): number => {
        if (i === 0) return secants[0]!;
        if (i === knots.length - 1) return secants[secants.length - 1]!;
        const low: number = Math.min(secants[i - 1]!, secants[i]!);
        const high: number = Math.max(secants[i - 1]!, secants[i]!);
        return low / ((1 + low / high) / 2);
      },
    );
    const at: (x: number) => ICoordinateValue =
      (x: number): ICoordinateValue => {
        const last: number = knots.length - 1;
        if (x <= knots[0]![0])
          return {
            value: knots[0]![1] + slopes[0]! * (x - knots[0]![0]),
            derivative: slopes[0]!,
          };
        if (x >= knots[last]![0])
          return {
            value: knots[last]![1] + slopes[last]! * (x - knots[last]![0]),
            derivative: slopes[last]!,
          };
        let i: number = 0;
        while (knots[i + 1]![0] < x) i++;
        const a: readonly [number, number] = knots[i]!;
        const b: readonly [number, number] = knots[i + 1]!;
        const h: number = b[0] - a[0];
        const t: number = (x - a[0]) / h;
        const m0: number = slopes[i]!;
        const m1: number = slopes[i + 1]!;
        return {
          value: (2 * t ** 3 - 3 * t ** 2 + 1) * a[1] +
            (t ** 3 - 2 * t ** 2 + t) * h * m0 +
            (-2 * t ** 3 + 3 * t ** 2) * b[1] +
            (t ** 3 - t ** 2) * h * m1,
          derivative: (6 * t ** 2 - 6 * t) * (a[1] - b[1]) / h +
            (3 * t ** 2 - 4 * t + 1) * m0 + (3 * t ** 2 - 2 * t) * m1,
        };
      };
    const inverse: (y: number) => ICoordinateValue =
      (y: number): ICoordinateValue => {
        const last: number = knots.length - 1;
        if (y <= knots[0]![1])
          return {
            value: knots[0]![0] + (y - knots[0]![1]) / slopes[0]!,
            derivative: 1 / slopes[0]!,
          };
        if (y >= knots[last]![1])
          return {
            value: knots[last]![0] + (y - knots[last]![1]) / slopes[last]!,
            derivative: 1 / slopes[last]!,
          };
        let i: number = 0;
        while (knots[i + 1]![1] < y) i++;
        let lo: number = knots[i]![0];
        let hi: number = knots[i + 1]![0];
        while (true) {
          const mid: number = lo / 2 + hi / 2;
          if (mid === lo || mid === hi) break;
          const value: number = at(mid).value;
          if (value === y) { lo = mid; hi = mid; break; }
          if (value < y) lo = mid;
          else hi = mid;
        }
        const value: number = lo / 2 + hi / 2;
        return { value, derivative: 1 / at(value).derivative };
      };
    return Object.assign(at, { inverse, identity: false });
  }
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
