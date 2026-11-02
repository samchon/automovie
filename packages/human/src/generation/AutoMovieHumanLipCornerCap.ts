import { AutoMovieHumanPolynomialRoots as Polynomial } from "./AutoMovieHumanPolynomialRoots";

/** Physical C2 lip-corner caps with a curvature-constrained shortest join. */
export namespace AutoMovieHumanLipCornerCap {
  /** Physical profile and its derivatives with respect to lateral millimetres. */
  export interface IJet {
    /** Lip amplitude at the physical lateral position, millimetres. */
    value: number;
    /** Amplitude slope per lateral millimetre; reflection reverses its sign. */
    first: number;
    /** Amplitude second derivative, inverse millimetres. */
    second: number;
  }

  /** Successful cap whose unmodified interior and endpoint jets agree. */
  export interface ICap {
    /** Half-width preserved from the existing lip profile, millimetres. */
    width: number;
    /** Existing midline fullness and requested minimum radius, millimetres. */
    lead: number;
    /** Physical lateral join to the unchanged interior. */
    join: number;
    /** Physical cap extent from its join to the unchanged corner. */
    length: number;
    /** Quintic cap coefficients in normalized cap parameter. */
    coefficients: number[];
    /** Positive factored coefficients avoid endpoint cancellation. */
    factors: [number, number, number];
    /** Maximum physical curvature measured at all stationary candidates. */
    maximumCurvature: number;
    /** Witness location in normalized cap coordinates. */
    witness: number;
    /** Certified numerical enclosure of the shortest cap extent, millimetres. */
    minimumBracket: [number, number];
    /** Number of whole join intervals excluded by a curvature lower bound. */
    excludedIntervals: number;
  }

  /** Explicit unsupported geometry; the requested radius is never reduced. */
  export interface IFailure {
    /** Invalid inputs, impossible radius, or an unresolved shortest-join proof. */
    failure: "invalid-dimensions" | "infeasible-radius" | "minimum-unresolved";
    /** Observed reason the requested cap could not be certified unchanged. */
    detail: string;
  }

  /** Numerical interval used for whole-domain exclusion certificates. */
  type Interval = [number, number];

  /** Evaluate the original singular physical profile and its actual jets. */
  export function original(width: number, lead: number, z: number): IJet {
    const u: number = z / width;
    const b: number = 1 - u * u;
    if (b <= 0) return { value: 0, first: z === width ? -Infinity : z === -width ? Infinity : 0, second: Math.abs(z) === width ? -Infinity : 0 };
    return {
      value: lead * b ** 0.8,
      first: -1.6 * lead * u * b ** -0.2 / width,
      second: lead * (-1.6 * b ** -0.2 - 0.64 * u * u * b ** -1.2) / (width * width),
    };
  }

  /** Quintic matching original join jets and corner value/first/second zero. */
  function factors(q: number): [number, number, number] {
    const b: number = q * (2 - q);
    const a: number = b ** 0.8;
    const r1: number = -1.6 * (1 - q) / (2 - q);
    const r2: number = -1.6 * q / (2 - q) - 0.64 * ((1 - q) / (2 - q)) ** 2;
    const c: number = a * (6 + 3 * r1 + r2 / 2);
    return [a, a * (3 + r1), c];
  }

  /** All physical curvature extrema, obtained from a degree-ten polynomial. */
  function maximum(q: number, ratio: number): {
    /** Maximum physical curvature multiplied by the existing lead radius. */
    curvature: number;
    /** Normalized cap parameter at the observed maximum-curvature candidate. */
    witness: number;
    /** Quintic coefficients before multiplication by physical lead. */
    coefficients: number[];
  } {
    const p: number[] = Polynomial.multiply([1, -3, 3, -1], factors(q));
    const d1: number[] = Polynomial.derivative(p);
    const d2: number[] = Polynomial.derivative(d1);
    const d3: number[] = Polynomial.derivative(d2);
    const k: number = ratio / q;
    const stationary: number[] = Polynomial.add(
      Polynomial.multiply(d3, Polynomial.add([1], Polynomial.multiply(d1, d1), k * k)),
      Polynomial.multiply(d1, Polynomial.multiply(d2, d2)), -3 * k * k,
    );
    const candidates: number[] = [0, 1, ...Polynomial.between(stationary, 0, 1)];
    let curvature: number = -Infinity;
    let witness: number = 0;
    for (const s of candidates) {
      const value: number = k * k * Math.abs(Polynomial.value(d2, s)) / (1 + (k * Polynomial.value(d1, s)) ** 2) ** 1.5;
      if (value > curvature) { curvature = value; witness = s; }
    }
    return { curvature, witness, coefficients: p };
  }

  /** Inflate numerical interval operations against accumulated roundoff. */
  function pad(lo: number, hi: number): Interval {
    const error: number = 64 * Number.EPSILON * Math.max(Number.MIN_VALUE, Math.abs(lo), Math.abs(hi));
    return [lo - error, hi + error];
  }

  /** Interval addition. */
  function add(a: Interval, b: Interval): Interval { return pad(a[0] + b[0], a[1] + b[1]); }

  /** Interval multiplication. */
  function multiply(a: Interval, b: Interval): Interval {
    const v: number[] = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
    return pad(Math.min(...v), Math.max(...v));
  }

  /** Interval scalar multiplication. */
  function scale(a: Interval, b: number): Interval { return multiply(a, [b, b]); }

  /** Minimum absolute value throughout an interval. */
  function minAbs(a: Interval): number { return a[0] <= 0 && a[1] >= 0 ? 0 : Math.min(Math.abs(a[0]), Math.abs(a[1])); }

  /**
   * Curvature lower bound for every join in q at a fixed physical-curve witness
   * s. A bound above one excludes the whole interval, independently of whether
   * the maximum-curvature function happens to be monotone in join length.
   */
  function lowerBound(q: Interval, ratio: number, s: number): number {
    const a: Interval = pad((q[0] * (2 - q[0])) ** 0.8, (q[1] * (2 - q[1])) ** 0.8);
    const r1 = (v: number): number => -1.6 * (1 - v) / (2 - v);
    const r2 = (v: number): number => -1.6 * v / (2 - v) - 0.64 * ((1 - v) / (2 - v)) ** 2;
    const v: Interval = multiply(a, pad(r1(q[0]), r1(q[1])));
    const acceleration: Interval = multiply(a, pad(r2(q[1]), r2(q[0])));
    const c: Interval = multiply(a, add([6, 6], add(scale(pad(r1(q[0]), r1(q[1])), 3), scale(pad(r2(q[1]), r2(q[0])), 0.5))));
    const first: Interval = scale(add(v, add(scale(add(acceleration, scale(v, 2)), s), scale(c, -5 * s * s))), (1 - s) ** 2);
    const second: Interval = scale(add(acceleration, add(scale(add(scale(acceleration, -3), add(scale(v, -6), scale(c, -10))), s), scale(c, 20 * s * s))), 1 - s);
    const kLow: number = ratio / q[1];
    const kHigh: number = ratio / q[0];
    const firstMaximum: number = Math.max(Math.abs(first[0]), Math.abs(first[1]));
    return kLow * kLow * minAbs(second) / (1 + (kHigh * firstMaximum) ** 2) ** 1.5;
  }

  /** Lower bound that excludes all joins arbitrarily close to the old corner. */
  function singularLower(q: number, ratio: number): number {
    const b: number = 2 * q;
    return 0.64 * ratio * ratio * b ** -0.6 / (b ** 0.4 + 2.56 * ratio * ratio) ** 1.5;
  }

  /**
   * Solve the globally shortest feasible cap within floating-point enclosure.
   * Whole intervals are rejected by curvature witnesses, so a shorter feasible
   * island cannot be skipped through an assumed monotonicity or a sample grid.
   * Shape constraints follow algebraically: P=(1-s)^3(a+bs+cs²) has positive
   * a,b,c, and P'=(1-s)²(v+(acceleration+2v)s-5cs²) has nonpositive coefficients.
   * The join parameter is numerical search output, never a fitted width share.
   */
  export function solve(width: number, lead: number): ICap | IFailure {
    if (!(Number.isFinite(width) && Number.isFinite(lead) && width > 0 && lead > 0)) return { failure: "invalid-dimensions", detail: "Width and fullness must be positive physical millimetres." };
    const ratio: number = lead / width;
    if (1.6 * ratio * ratio > 1) return { failure: "infeasible-radius", detail: "The preserved midline curvature already exceeds the requested inverse fullness radius." };

    let low: number = Number.MIN_VALUE;
    let high: number = 1;
    for (let i: number = 0; i < 80; i++) {
      const mid: number = (low + high) / 2;
      if (singularLower(mid, ratio) > 1) low = mid;
      else high = mid;
    }
    const cutoff: number = low;
    const tolerance: number = Number.EPSILON ** 0.75;
    const queue: Interval[] = [[cutoff, 1]];
    let best: number = Infinity;
    let bestCurve: ReturnType<typeof maximum> | undefined;
    const full: ReturnType<typeof maximum> = maximum(1, ratio);
    if (full.curvature <= 1) { best = 1; bestCurve = full; }
    let excluded: number = 1;
    let iterations: number = 0;
    let unresolvedLower: number = Infinity;
    while (queue.length > 0 && iterations++ < 200000) {
      const range: Interval = queue.pop()!;
      if (range[0] >= best - tolerance) continue;
      const end: number = Math.min(range[1], best);
      const middle: number = (range[0] + end) / 2;
      const curve: ReturnType<typeof maximum> = maximum(middle, ratio);
      if (curve.curvature <= 1) { best = middle; bestCurve = curve; }
      if (lowerBound([range[0], end], ratio, curve.witness) > 1) { excluded++; continue; }
      if (end - range[0] <= tolerance) {
        unresolvedLower = Math.min(unresolvedLower, range[0]);
        continue;
      }
      queue.push([middle, end], [range[0], middle]);
    }
    const minimumLower: number = Math.max(cutoff, Math.min(unresolvedLower, best - tolerance));
    if (queue.length > 0 || (Number.isFinite(unresolvedLower) && (!Number.isFinite(best) || best - minimumLower > Math.sqrt(Number.EPSILON)))) return { failure: "minimum-unresolved", detail: `Global interval proof did not resolve the requested shortest cap after ${iterations} intervals; no radius or monotonicity limit was relaxed.` };
    if (bestCurve === undefined || !Number.isFinite(best)) return { failure: "infeasible-radius", detail: `Every join interval was excluded by the physical curvature bound (${excluded} exclusions).` };
    return { width, lead, join: width * (1 - best), length: width * best, coefficients: bestCurve.coefficients.map((v: number): number => lead * v), factors: factors(best).map((v: number): number => lead * v) as [number, number, number], maximumCurvature: bestCurve.curvature / lead, witness: bestCurve.witness, minimumBracket: [width * minimumLower, width * best], excludedIntervals: excluded };
  }

  /** Observe the composed profile; the unchanged interior is called directly. */
  export function at(cap: ICap, z: number): IJet {
    const x: number = Math.abs(z);
    if (x >= cap.width) return { value: 0, first: 0, second: 0 };
    if (x <= cap.join) return original(cap.width, cap.lead, z);
    const s: number = (x - cap.join) / cap.length;
    const [a, b, c] = cap.factors;
    const remaining: number = 1 - s;
    return {
      value: remaining ** 3 * (a + s * (b + s * c)),
      first: (z < 0 ? -1 : 1) * remaining ** 2 * ((b - 3 * a) + s * ((2 * c - 4 * b) - 5 * c * s)) / cap.length,
      second: remaining * ((2 * c - 6 * b + 6 * a) + s * ((12 * b - 16 * c) + 20 * c * s)) / (cap.length * cap.length),
    };
  }
}
