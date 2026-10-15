/**
 * Scalar helpers the head's distance field is built from.
 *
 * @author Samchon
 */
export namespace AutoMovieHumanHeadMath {
  /**
   * Signed distance along a radius from a superellipse-family value.
   *
   * For an implicit shape `s(p) = 1` homogeneous of degree `n` about its centre, the boundary point on the ray through `p` lies at `r · s^(-1/n)`, so this is the exact distance along that ray, negative inside.
   *
   * @param r Distance of the point from the shape's centre
   * @param s Implicit value at the point
   * @param n Degree of homogeneity
   * @returns Signed radial distance
   */
  export function radial(r: number, s: number, n: number): number {
    return s <= 0 ? -1e3 : r * (1 - Math.pow(s, -1 / n));
  }

  /**
   * Polynomial smooth minimum of two distances, the smooth union of their shapes (Quilez, "smooth minimum", 2013).
   *
   * @param a First distance
   * @param b Second distance
   * @param k Blend width, the same unit
   * @returns The blended minimum
   */
  export function smoothMin(a: number, b: number, k: number): number {
    const h: number = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - (h * h * k) / 4;
  }

  /**
   * Hermite smooth step from 0 at `a` to 1 at `b`.
   *
   * @param a Start
   * @param b End
   * @param x Abscissa
   * @returns The step value
   */
  export function smoothStep(a: number, b: number, x: number): number {
    const t: number = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  /**
   * The monotone piecewise cubic through knots (Fritsch and Carlson 1980, SIAM J Numer Anal 17(2):238-246), held flat outside them.
   *
   * @param knots Abscissa and value pairs, in any order
   * @returns The curve as a function
   */
  export function curve(knots: Array<[number, number]>): (x: number) => number {
    const k: Array<[number, number]> = [...knots].sort(
      (a: [number, number], b: [number, number]): number => a[0] - b[0],
    );
    const slopes: number[] = [];
    for (let i: number = 0; i + 1 < k.length; ++i)
      slopes.push(
        (k[i + 1]![1] - k[i]![1]) / Math.max(1e-9, k[i + 1]![0] - k[i]![0]),
      );
    const tangents: number[] = k.map(
      (_: [number, number], i: number): number => {
        if (i === 0) return slopes[0]!;
        if (i === k.length - 1) return slopes[slopes.length - 1]!;
        const a: number = slopes[i - 1]!;
        const b: number = slopes[i]!;
        return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
      },
    );
    return (x: number): number => {
      if (x <= k[0]![0]) return k[0]![1];
      if (x >= k[k.length - 1]![0]) return k[k.length - 1]![1];
      let i: number = 0;
      while (x > k[i + 1]![0]) ++i;
      const h: number = Math.max(1e-9, k[i + 1]![0] - k[i]![0]);
      const t: number = (x - k[i]![0]) / h;
      const t2: number = t * t;
      const t3: number = t2 * t;
      return (
        (2 * t3 - 3 * t2 + 1) * k[i]![1] +
        (t3 - 2 * t2 + t) * h * tangents[i]! +
        (-2 * t3 + 3 * t2) * k[i + 1]![1] +
        (t3 - t2) * h * tangents[i + 1]!
      );
    };
  }

  /**
   * Half the perimeter of a superellipse, the two quadrants on one side of its first axis.
   *
   * @param a Semi-axis across
   * @param b Semi-axis along
   * @param n Exponent
   * @returns Half perimeter, by 256 chords a quadrant
   */
  export function halfPerimeter(a: number, b: number, n: number): number {
    const steps: number = 256;
    let sum: number = 0;
    let prev: [number, number] = [a, 0];
    for (let i: number = 1; i <= steps; ++i) {
      const theta: number = ((Math.PI / 2) * i) / steps;
      const point: [number, number] = [
        a * Math.pow(Math.cos(theta), 2 / n),
        b * Math.pow(Math.sin(theta), 2 / n),
      ];
      sum += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
      prev = point;
    }
    return 2 * sum;
  }

  /**
   * Root of a monotone function by bisection, clamped to the bracket when the root lies outside it.
   *
   * @param f The function
   * @param lo Lower end of the bracket
   * @param hi Upper end of the bracket
   * @returns The root, or the bracket end nearer to it
   */
  export function solve(
    f: (x: number) => number,
    lo: number,
    hi: number,
  ): number {
    let a: number = lo;
    let b: number = hi;
    const fa: number = f(a);
    const fb: number = f(b);
    if (fa * fb > 0) return Math.abs(fa) < Math.abs(fb) ? a : b;
    for (let i: number = 0; i < 60; ++i) {
      const m: number = (a + b) / 2;
      if (f(m) * fa > 0) a = m;
      else b = m;
    }
    return (a + b) / 2;
  }
}
