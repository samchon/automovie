import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Smooth envelope of the hair mass: a radial function over directions from
 * the head chart's centre, smooth everywhere on the sphere, whose surface
 * hair lies over and whose normals shade it.
 *
 * Data: on a grid of 64 azimuths and 32 elevations, the draped radius of
 * the head (see {@link drape}) where the chart measures head skin above the
 * menton; below that skin in each azimuth, the vertical column the hair
 * hangs as, `rho / cos(beta)` with `rho` the horizontal distance of the
 * lowest draped point in that azimuth, down to 75 degrees below the
 * horizon. Directions without either hold no data.
 *
 * Representation: a sum of {@link CENTRES} spherical Gaussians
 * `exp(kappa (d . c_k - 1))` about Fibonacci lattice directions (Gonzalez
 * 2010), `kappa` the inverse square of the lattice spacing, so the
 * envelope has no seam or pole and its gradient is analytic. The weights
 * are an upper expectile fit (asymmetric least squares, Newey and Powell
 * 1987; Eilers 2005): each round weighs the data the surface falls short
 * of by {@link EXPECTILE} and the rest by its complement, so the surface
 * runs over the draped head instead of through it, without a clamp. The
 * grid is weighted by its cells' solid angle, with a small ridge for
 * directions without data.
 *
 * Normals: the star surface `P(d) = f(d) d` has the outward normal
 * `d - grad f / f`, with the tangential gradient of `f` on the sphere.
 */
export namespace AutoMovieHumanHairEnvelope {
  /** Fitted envelope. */
  export interface IEnvelope {
    /** Unit centre directions, three numbers each. */
    centres: Float64Array;

    /** Weight per centre, millimetres. */
    weights: Float64Array;

    /** Concentration of every Gaussian. */
    kappa: number;
  }

  /**
   * Fit the envelope of one head chart.
   *
   * @param field Head chart
   * @returns The envelope
   */
  export function create(field: AutoMovieHumanHeadField.IField): IEnvelope {
    const K: number = CENTRES;
    const golden: number = Math.PI * (3 - Math.sqrt(5));
    const centres: Float64Array = new Float64Array(3 * K);
    for (let k: number = 0; k < K; ++k) {
      const y: number = 1 - (2 * (k + 0.5)) / K;
      const r: number = Math.sqrt(1 - y * y);
      centres.set([r * Math.cos(k * golden), y, r * Math.sin(k * golden)], 3 * k);
    }
    const kappa: number = K / (4 * Math.PI);

    // Data directions, values and solid-angle weights.
    const menton: number = field.top - field.height;
    const NA: number = 64;
    const NB: number = 32;
    const directions: number[] = [];
    const values: number[] = [];
    const areas: number[] = [];
    for (let i: number = 0; i < NA; ++i) {
      const alpha: number = ((i + 0.5) / NA) * 2 * Math.PI;
      // From the top down: draped head skin, then the hanging column below
      // the lowest draped point.
      let rho: number | null = null;
      for (let j: number = NB - 1; j >= 0; --j) {
        const beta: number = ((j + 0.5) / NB) * Math.PI - Math.PI / 2;
        const d: [number, number, number] = AutoMovieHumanHeadField.direction(
          alpha,
          beta,
        );
        const skin: number = AutoMovieHumanHeadField.radius(field, d);
        const head: boolean =
          AutoMovieHumanHeadField.covered(field, d) &&
          field.centre[1] + d[1] * skin > menton;
        let value: number | null = null;
        if (head && rho === null) {
          value = drape(field, d);
          if (beta < 0 && j > 0) {
            const below: number = ((j - 0.5) / NB) * Math.PI - Math.PI / 2;
            const next: [number, number, number] =
              AutoMovieHumanHeadField.direction(alpha, below);
            const r: number = AutoMovieHumanHeadField.radius(field, next);
            if (
              !AutoMovieHumanHeadField.covered(field, next) ||
              field.centre[1] + next[1] * r <= menton
            )
              rho = value * Math.cos(beta);
          }
        } else if (rho !== null && beta > -LOWEST) value = rho / Math.cos(beta);
        if (value === null) continue;
        directions.push(...d);
        values.push(value);
        areas.push(Math.cos(beta));
      }
    }

    // Kernel rows, kept sparse by the Gaussians' reach.
    const M: number = values.length;
    const reach: number = 1 - 9.2 / kappa;
    const rows: { k: number[]; v: number[] }[] = [];
    for (let m: number = 0; m < M; ++m) {
      const k: number[] = [];
      const v: number[] = [];
      for (let c: number = 0; c < K; ++c) {
        const dot: number =
          directions[3 * m]! * centres[3 * c]! +
          directions[3 * m + 1]! * centres[3 * c + 1]! +
          directions[3 * m + 2]! * centres[3 * c + 2]!;
        if (dot < reach) continue;
        k.push(c);
        v.push(Math.exp(kappa * (dot - 1)));
      }
      rows.push({ k, v });
    }

    let weights: Float64Array = new Float64Array(K);
    const residualWeights: Float64Array = new Float64Array(M).fill(0.5);
    for (let round: number = 0; round < ROUNDS; ++round) {
      const A: Float64Array = new Float64Array(K * K);
      const b: Float64Array = new Float64Array(K);
      let trace: number = 0;
      rows.forEach((row: { k: number[]; v: number[] }, m: number): void => {
        const w: number = areas[m]! * residualWeights[m]!;
        for (let a: number = 0; a < row.k.length; ++a) {
          b[row.k[a]!]! += w * row.v[a]! * values[m]!;
          for (let c: number = 0; c < row.k.length; ++c)
            A[row.k[a]! * K + row.k[c]!]! += w * row.v[a]! * row.v[c]!;
        }
      });
      for (let k: number = 0; k < K; ++k) trace += A[k * K + k]!;
      for (let k: number = 0; k < K; ++k) A[k * K + k]! += (RIDGE * trace) / K;
      weights = cholesky(A, b, K);
      rows.forEach((row: { k: number[]; v: number[] }, m: number): void => {
        let f: number = 0;
        for (let a: number = 0; a < row.k.length; ++a)
          f += weights[row.k[a]!]! * row.v[a]!;
        residualWeights[m] = f < values[m]! ? EXPECTILE : 1 - EXPECTILE;
      });
    }
    return { centres, weights, kappa };
  }

  /**
   * Envelope radius along a direction.
   *
   * @param envelope Envelope
   * @param u Direction; need not be unit
   * @returns Radius in millimetres
   */
  export function radius(
    envelope: IEnvelope,
    u: [number, number, number],
  ): number {
    return evaluate(envelope, unit(u))[0];
  }

  /**
   * Outward unit normal of the envelope at the direction of a point, which
   * is also the normal of every scaled copy `lambda P(d)` there.
   *
   * @param envelope Envelope
   * @param p Point, head-local millimetres
   * @returns Unit normal
   */
  export function normal(
    envelope: IEnvelope,
    p: [number, number, number],
  ): [number, number, number] {
    const d: [number, number, number] = unit(p);
    const [f, g] = evaluate(envelope, d);
    if (!(f > 1e-9)) return d;
    return unit([d[0] - g[0] / f, d[1] - g[1] / f, d[2] - g[2] / f]);
  }

  /**
   * Radius of the head as hair drapes over it along a direction: the largest
   * of the skin radius there and, for skin above the menton within 0.3
   * radian, its radius less its arc distance, as if the hair fell from every
   * bump at 45 degrees to the surface. Over the auricle, which stands about
   * 25 mm off the side of the head, hair passes over the ear on a slope and
   * returns to the head about 25 mm beyond it. Sampled on six rings of eight
   * directions, 0.05 radian apart.
   *
   * @param field Head chart
   * @param d Unit direction
   * @returns Draped radius, millimetres
   */
  export function drape(
    field: AutoMovieHumanHeadField.IField,
    d: [number, number, number],
  ): number {
    let best: number = AutoMovieHumanHeadField.radius(field, d);
    const a: [number, number, number] =
      Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const e1: [number, number, number] = unit(cross(a, d));
    const e2: [number, number, number] = cross(d, e1);
    for (let ring: number = 1; ring <= 6; ++ring) {
      const theta: number = 0.05 * ring;
      for (let k: number = 0; k < 8; ++k) {
        const phi: number = ((k + 0.5 * (ring % 2)) / 8) * 2 * Math.PI;
        const s: number = Math.sin(theta);
        const q: [number, number, number] = [
          d[0] * Math.cos(theta) + s * (e1[0] * Math.cos(phi) + e2[0] * Math.sin(phi)),
          d[1] * Math.cos(theta) + s * (e1[1] * Math.cos(phi) + e2[1] * Math.sin(phi)),
          d[2] * Math.cos(theta) + s * (e1[2] * Math.cos(phi) + e2[2] * Math.sin(phi)),
        ];
        const r: number = AutoMovieHumanHeadField.radius(field, q);
        // Only head skin above the menton drapes the hair; below it the
        // chart also measures the neck and shoulders the head chains loft.
        if (field.centre[1] + q[1] * r > field.top - field.height)
          best = Math.max(best, r * (1 - theta));
      }
    }
    return best;
  }
}

/** Gaussian centres on the sphere; their spacing is about 0.2 radian, 19 mm on a 95 mm scalp. */
const CENTRES: number = 300;

/** Fitting rounds of the expectile weights. */
const ROUNDS: number = 6;

/** Expectile of the fit, the weight of data the surface falls short of. */
const EXPECTILE: number = 0.97;

/** Ridge on the normal equations, as a share of their mean diagonal. */
const RIDGE: number = 1e-3;

/** Lowest elevation of the hanging column's data, radians below the horizon. */
const LOWEST: number = (75 * Math.PI) / 180;

/**
 * Value and tangential gradient at a unit direction.
 *
 * @param envelope Envelope
 * @param d Unit direction
 * @returns Radius and its gradient on the sphere
 */
function evaluate(
  envelope: AutoMovieHumanHairEnvelope.IEnvelope,
  d: [number, number, number],
): [number, [number, number, number]] {
  const { centres, weights, kappa } = envelope;
  let f: number = 0;
  const g: [number, number, number] = [0, 0, 0];
  for (let k: number = 0; k < weights.length; ++k) {
    const cx: number = centres[3 * k]!;
    const cy: number = centres[3 * k + 1]!;
    const cz: number = centres[3 * k + 2]!;
    const dot: number = d[0] * cx + d[1] * cy + d[2] * cz;
    const e: number = weights[k]! * Math.exp(kappa * (dot - 1));
    f += e;
    g[0] += kappa * e * (cx - dot * d[0]);
    g[1] += kappa * e * (cy - dot * d[1]);
    g[2] += kappa * e * (cz - dot * d[2]);
  }
  return [f, g];
}

/**
 * Solve a symmetric positive definite system by Cholesky factorisation.
 *
 * @param A Matrix, row-major, overwritten
 * @param b Right-hand side
 * @param n Size
 * @returns Solution
 */
function cholesky(A: Float64Array, b: Float64Array, n: number): Float64Array {
  for (let j: number = 0; j < n; ++j) {
    let s: number = A[j * n + j]!;
    for (let k: number = 0; k < j; ++k) s -= A[j * n + k]! ** 2;
    const diagonal: number = Math.sqrt(Math.max(s, 1e-300));
    A[j * n + j] = diagonal;
    for (let i: number = j + 1; i < n; ++i) {
      let t: number = A[i * n + j]!;
      for (let k: number = 0; k < j; ++k) t -= A[i * n + k]! * A[j * n + k]!;
      A[i * n + j] = t / diagonal;
    }
  }
  const y: Float64Array = new Float64Array(n);
  for (let i: number = 0; i < n; ++i) {
    let t: number = b[i]!;
    for (let k: number = 0; k < i; ++k) t -= A[i * n + k]! * y[k]!;
    y[i] = t / A[i * n + i]!;
  }
  const x: Float64Array = new Float64Array(n);
  for (let i: number = n - 1; i >= 0; --i) {
    let t: number = y[i]!;
    for (let k: number = i + 1; k < n; ++k) t -= A[k * n + i]! * x[k]!;
    x[i] = t / A[i * n + i]!;
  }
  return x;
}

/**
 * Cross product.
 *
 * @param a Left
 * @param b Right
 * @returns `a x b`
 */
function cross(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Unit vector.
 *
 * @param a Nonzero vector
 * @returns `a / |a|`
 */
function unit(a: [number, number, number]): [number, number, number] {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
