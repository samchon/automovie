/** Physical-gauge quintic shape interpolation and volume feature isolation.
 * The owning trunk law supplies shared identified values and first jets. This
 * algebra derives intermediate shape and extrema without observing or copying
 * specimen meshes. Every returned curve retains its actual polynomial degree.
 */
export namespace HumanTrunkShapeSpline {
  type Triple = [number, number, number];
  /** Owned piecewise shape polynomial with exact first and second jets. */
  export interface Curve {
    /** Ordered dimensionless longitudinal size-plane addresses. */
    knots: number[];

    /** Four exact local quintic power series, with t in [0,1]. */
    powers: number[][];
  }

  /** Derive shared second jets from the minimum-jerk Euler conditions.
   * Values and first jets are independent observed unknowns. Variation of the
   * shared second jet gives continuity of the third derivative at each interior
   * plane and zero third derivative at both ends. The resulting five-variable
   * linear system is solved once per channel with partial pivoting. This is a
   * piecewise quintic, not a cubic refit of original Recovery coefficients.
   */
  export function build(knots: number[], values: number[], slopes: number[]): Curve {
    const count: number = knots.length;
    const powers: (seconds: number[]) => number[][] = (seconds: number[]): number[][] =>
      knots.slice(1).map((_knot: number, i: number): number[] => {
        const h: number = knots[i + 1]! - knots[i]!;
        const delta: number = values[i + 1]! - values[i]!;
        const a: number = slopes[i]! * h;
        const b: number = slopes[i + 1]! * h;
        const c: number = seconds[i]! * h * h;
        const d: number = seconds[i + 1]! * h * h;
        return [values[i]!, a, c / 2,
          10 * delta - 6 * a - 4 * b - 1.5 * c + 0.5 * d,
          -15 * delta + 8 * a + 7 * b + 1.5 * c - d,
          6 * delta - 3 * a - 3 * b - 0.5 * c + 0.5 * d];
      });
    const third: (coefficients: number[][], i: number, end: boolean) => number =
      (coefficients: number[][], i: number, end: boolean): number => {
        const p: number[] = coefficients[i]!;
        return (6 * p[3]! + (end ? 24 * p[4]! + 60 * p[5]! : 0)) /
          Math.pow(knots[i + 1]! - knots[i]!, 3);
      };
    const conditions: (coefficients: number[][]) => number[] = (coefficients: number[][]): number[] => [
      third(coefficients, 0, false),
      ...knots.slice(1, -1).map((_knot: number, i: number): number =>
        third(coefficients, i, true) - third(coefficients, i + 1, false)),
      third(coefficients, count - 2, true),
    ];
    const zero: number[] = new Array<number>(count).fill(0);
    const base: number[] = conditions(powers(zero));
    const columns: number[][] = zero.map((_unused: number, column: number): number[] =>
      conditions(powers(zero.map((_value: number, row: number): number => row === column ? 1 : 0)))
        .map((value: number, row: number): number => value - base[row]!));
    const matrix: number[][] = base.map((value: number, row: number): number[] => [
      ...columns.map((column: number[]): number => column[row]!), -value,
    ]);
    for (let column: number = 0; column < count; column++) {
      let pivot: number = column;
      for (let row: number = column + 1; row < count; row++)
        if (Math.abs(matrix[row]![column]!) > Math.abs(matrix[pivot]![column]!)) pivot = row;
      if (!(Math.abs(matrix[pivot]![column]!) > 0))
        throw new Error("The trunk minimum-jerk system has no unique finite solution");
      [matrix[column], matrix[pivot]] = [matrix[pivot]!, matrix[column]!];
      const divisor: number = matrix[column]![column]!;
      for (let item: number = column; item <= count; item++) matrix[column]![item] = matrix[column]![item]! / divisor;
      for (let row: number = 0; row < count; row++) {
        if (row === column) continue;
        const factor: number = matrix[row]![column]!;
        for (let item: number = column; item <= count; item++)
          matrix[row]![item] = matrix[row]![item]! - factor * matrix[column]![item]!;
      }
    }
    const seconds: number[] = matrix.map((row: number[]): number => row[count]!);
    if (!seconds.every(Number.isFinite)) throw new Error("The trunk minimum-jerk solve returned a nonfinite second jet");
    return { knots, powers: powers(seconds) };
  }

  /** Evaluate the retained quintic and its exact first two physical-gauge jets. */
  export function sample(curve: Curve, coordinate: number): Triple {
    let i: number = 0;
    while (i < curve.knots.length - 2 && coordinate > curve.knots[i + 1]!) i++;
    const h: number = curve.knots[i + 1]! - curve.knots[i]!;
    const t: number = (coordinate - curve.knots[i]!) / h;
    const p: number[] = curve.powers[i]!;
    let value: number = p[5]!;
    let first: number = 0;
    let second: number = 0;
    for (let degree: number = 4; degree >= 0; degree--) {
      second = second * t + 2 * first;
      first = first * t + value;
      value = value * t + p[degree]!;
    }
    return [value, first / h, second / (h * h)];
  }


  /** Isolated stationary area curve from the same retained analytic polynomial. */
  export interface AreaFeature {
    /** Size-plane interval containing the stationary point. */
    interval: number;

    /** Local interval t, dimensionless in (0,1). */
    coordinate: number;

    /** Area decreases then increases at a minimum; the opposite is a maximum. */
    kind: "minimum" | "maximum";

    /** Final binary64 sign bracket in local interval t; not an interval-arithmetic proof. */
    bounds: [number, number];
  }

  /** Isolate volume features without changing the shape or fitting more layers.
   * R=Q*S has degree eight. Fourier orthogonality gives the exact section area
   * pi*(R0^2+sum(Rk^2)/2), of degree sixteen. Its degree-fifteen derivative is
   * recursively partitioned at its own derivative roots into monotone intervals.
   * Strict sign changes are bisected to floating-point resolution. Tangential
   * zeros that do not reverse the area derivative are not volume extrema.
   * Results qualify the retained binary64 polynomial, not source anatomy or
   * coefficient-rounding uncertainty. For bounded degree D, root partitioning
   * uses O(80*D^3) work and O(D^2) transient storage per size interval.
   */
  export function areaExtrema(sizePowers: number[][], radial: Curve[]): AreaFeature[] {
    const output: AreaFeature[] = [];
    for (let interval: number = 0; interval < sizePowers.length; interval++) {
      const area: number[] = new Array<number>(17).fill(0);
      for (let channel: number = 0; channel < radial.length; channel++) {
        const radius: number[] = multiply(sizePowers[interval]!, radial[channel]!.powers[interval]!);
        const squared: number[] = multiply(radius, radius);
        for (let power: number = 0; power < squared.length; power++)
          area[power] = area[power]! + Math.PI * squared[power]! * (channel === 0 ? 1 : 0.5);
      }
      const slope: number[] = derivative(area);
      for (const bounds of roots(slope, 0, 1)) {
        if (!(bounds[0] > 0 && bounds[1] < 1)) continue;
        output.push({ interval, coordinate: (bounds[0] + bounds[1]) / 2,
          kind: bounds[2] === 1 ? "minimum" : "maximum", bounds: [bounds[0], bounds[1]] });
      }
    }
    return output;
  }

  /** Multiply complete power series without degree reduction. */
  function multiply(left: number[], right: number[]): number[] {
    const output: number[] = new Array<number>(left.length + right.length - 1).fill(0);
    for (let i: number = 0; i < left.length; i++)
      for (let j: number = 0; j < right.length; j++) output[i + j] = output[i + j]! + left[i]! * right[j]!;
    return output;
  }

  /** Keep the derivative's actual polynomial degree, including an exact zero constant. */
  function derivative(polynomial: number[]): number[] {
    const output: number[] = polynomial.slice(1).map((value: number, i: number): number => value * (i + 1));
    while (output.length > 1 && output.at(-1) === 0) output.pop();
    return output;
  }

  /** Horner evaluation in the local dimensionless interval. */
  function evaluate(polynomial: number[], coordinate: number): number {
    let value: number = 0;
    for (let i: number = polynomial.length - 1; i >= 0; i--) value = value * coordinate + polynomial[i]!;
    return value;
  }

  /** Recursively isolate strict sign-changing real roots between derivative roots.
   * Exact stationary-root evaluations enter the partition but are not silently
   * accepted as extrema. At most eighty safeguarded bisections refine a strict
   * sign bracket; an exact rounded zero retains that address and the original
   * crossing direction. A zero-width bound states binary64 evaluation only.
   * This finite binary64 algorithm does not certify shallow multiple roots.
   */
  function roots(polynomial: number[], start: number, end: number): [number, number, 1 | -1][] {
    if (polynomial.length <= 1) return [];
    const critical: [number, number, 1 | -1][] = roots(derivative(polynomial), start, end);
    const addresses: number[] = [start, ...critical.map((bound: [number, number, 1 | -1]): number => (bound[0] + bound[1]) / 2), end];
    const output: [number, number, 1 | -1][] = [];
    for (let i: number = 0; i < addresses.length - 1; i++) {
      let left: number = addresses[i]!;
      let right: number = addresses[i + 1]!;
      let leftValue: number = evaluate(polynomial, left);
      const rightValue: number = evaluate(polynomial, right);
      if (!((leftValue < 0 && rightValue > 0) || (leftValue > 0 && rightValue < 0))) continue;
      const direction: 1 | -1 = leftValue < 0 ? 1 : -1;
      for (let step: number = 0; step < 80; step++) {
        const middle: number = (left + right) / 2;
        if (middle === left || middle === right) break;
        const value: number = evaluate(polynomial, middle);
        if (value === 0) { left = middle; right = middle; break; }
        if ((leftValue < 0 && value > 0) || (leftValue > 0 && value < 0)) right = middle;
        else { left = middle; leftValue = value; }
      }
      output.push([left, right, direction]);
    }
    return output;
  }
}
