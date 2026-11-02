import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Smooth envelope of the hair mass: a radial function over directions from
 * the head chart's centre, whose surface hair lies over and whose normals
 * shade it.
 *
 * Head data: on a grid of {@link AZIMUTHS} azimuths and {@link ELEVATIONS}
 * elevations, the draped radius of the head (see {@link drape}) where the
 * chart measures head skin above the menton. Over the head the envelope is
 * a kernel power mean of that data,
 *
 * `f(d) = (sum_m w_m K_m(d) v_m^p / sum_m w_m K_m(d))^(1/p)`,
 *
 * with `K_m(d) = exp(kappa (d . d_m - 1))` a spherical Gaussian of angular
 * width {@link WIDTH} about each datum's direction, `w_m` its cell's solid
 * angle and `p` = {@link POWER}. The kernel is positive, so `f` lies between
 * the smallest and largest datum within its reach and cannot ring: an
 * earlier least-squares fit of a sum of Gaussians interpolated the data
 * through oscillating weights, and its gradient turned the shading normals
 * by up to 14 degrees either way at the Gaussians' spacing over the vault
 * (grey blotches over the back and top of the hair). The power mean leans
 * toward the largest neighbour, so the surface runs over bumps instead of
 * through them, without a clamp; it approaches the local maximum as `p`
 * grows (Hardy, Littlewood and Polya 1934, the power-mean inequality).
 *
 * Hanging column: below a point of each azimuth, hair hangs as a vertical
 * column of that point's horizontal distance `rho`, `rho / cos(beta)` in
 * this radial frame, with a horizontal normal. Lying hair hangs from the
 * lowest draped head point; hanging hair from the widest one, where the
 * head is vertical, so the curtain leaves the head tangentially and does
 * not follow it back in under the occiput, the ears and the jaw: there the
 * head faces down, and a cut shaded by it went black under the ears. The
 * column is analytic rather than data, since a fit of its `1 / cos` growth
 * toward the nadir rang into the head above it. `rho(alpha)` and its
 * elevation `beta_0(alpha)` is a von Mises kernel mean over azimuth of its
 * per-azimuth samples, smooth and periodic, and `rho(alpha)` is the head's
 * own horizontal reach at that elevation, so the column takes over below
 * `beta_0` without a step in radius; at the widest point the head is
 * vertical, so the normal turns only by the smoothing of `beta_0`.
 *
 * Normals: the star surface `P(d) = f(d) d` has the outward normal
 * `d - grad f / f`, with the tangential gradient of `f` on the sphere,
 * evaluated analytically for every part.
 */
export namespace AutoMovieHumanHairEnvelope {
  /** Fitted envelope. */
  export interface IEnvelope {
    /** Head data directions, three numbers each, row-major by elevation then azimuth. */
    directions: Float64Array;

    /** Solid-angle weight per datum; zero where the grid holds no head datum. */
    weights: Float64Array;

    /** Datum over {@link scale}, raised to {@link POWER}. */
    powered: Float64Array;

    /** Largest datum, millimetres; the power mean's unit. */
    scale: number;

    /** Lying column radius `rho` per azimuth cell: the head's reach at {@link floor}, millimetres. */
    rho: Float64Array;

    /** Lowest head elevation `beta_0` per azimuth cell, kernel-smoothed, radians. */
    floor: Float64Array;

    /**
     * Hanging column radius per azimuth cell: the head's horizontal reach at
     * {@link shoulder}, its widest point, millimetres; the curtain a hanging
     * cut falls as.
     */
    widest: Float64Array;

    /** Elevation of that widest point per azimuth cell, kernel-smoothed, radians. */
    shoulder: Float64Array;
  }

  /**
   * Fit the envelope of one head chart.
   *
   * @param field Head chart
   * @returns The envelope
   */
  export function create(field: AutoMovieHumanHeadField.IField): IEnvelope {
    const menton: number = field.top - field.height;
    const directions: Float64Array = new Float64Array(3 * AZIMUTHS * ELEVATIONS);
    const weights: Float64Array = new Float64Array(AZIMUTHS * ELEVATIONS);
    const values: Float64Array = new Float64Array(AZIMUTHS * ELEVATIONS);
    const rhoSamples: number[] = [];
    const floorSamples: number[] = [];
    const widestSamples: number[] = [];
    const shoulderSamples: number[] = [];
    const head: (d: [number, number, number]) => boolean = (
      d: [number, number, number],
    ): boolean =>
      AutoMovieHumanHeadField.covered(field, d) &&
      field.centre[1] + d[1] * AutoMovieHumanHeadField.radius(field, d) >
        menton;
    for (let i: number = 0; i < AZIMUTHS; ++i) {
      const alpha: number = ((i + 0.5) / AZIMUTHS) * 2 * Math.PI;
      // From the top down, the draped head skin to the lowest draped point
      // of the azimuth; the column hangs from that point.
      let rho: number | null = null;
      let floor: number = -Math.PI / 2;
      for (let j: number = ELEVATIONS - 1; j >= 0 && rho === null; --j) {
        const beta: number = elevation(j);
        const d: [number, number, number] = AutoMovieHumanHeadField.direction(
          alpha,
          beta,
        );
        if (!head(d)) continue;
        const value: number = drape(field, d);
        const at: number = j * AZIMUTHS + i;
        directions.set(d, 3 * at);
        weights[at] = Math.cos(beta);
        values[at] = value;
        if (
          beta < 0 &&
          (j === 0 ||
            !head(AutoMovieHumanHeadField.direction(alpha, elevation(j - 1))))
        ) {
          rho = value * Math.cos(beta);
          floor = beta;
        }
      }
      // An azimuth whose head skin never reaches below the horizon hangs
      // from its lowest datum, or from the chart where it has none.
      if (rho === null) {
        let lowest: number = -1;
        for (let j: number = 0; j < ELEVATIONS && lowest < 0; ++j)
          if (weights[j * AZIMUTHS + i]! > 0) lowest = j;
        floor = lowest < 0 ? 0 : elevation(lowest);
        rho =
          lowest < 0
            ? AutoMovieHumanHeadField.radius(
                field,
                AutoMovieHumanHeadField.direction(alpha, 0),
              )
            : values[lowest * AZIMUTHS + i]! * Math.cos(floor);
      }
      rhoSamples.push(rho);
      floorSamples.push(floor);

      // Widest horizontal distance of the draped head in this azimuth and
      // its elevation: hair below it falls as a vertical curtain from it.
      let widest: number = rho;
      let shoulder: number = floor;
      for (let j: number = 0; j < ELEVATIONS; ++j) {
        const at: number = j * AZIMUTHS + i;
        if (!(weights[at]! > 0)) continue;
        const reach: number = values[at]! * Math.cos(elevation(j));
        if (reach > widest) {
          widest = reach;
          shoulder = elevation(j);
        }
      }
      widestSamples.push(widest);
      shoulderSamples.push(shoulder);
    }

    let scale: number = 0;
    for (let m: number = 0; m < values.length; ++m)
      scale = Math.max(scale, values[m]!);
    const powered: Float64Array = new Float64Array(values.length);
    for (let m: number = 0; m < values.length; ++m)
      powered[m] = weights[m]! > 0 ? (values[m]! / scale) ** POWER : 0;

    // The hanging elevations are smoothed over azimuth; each column's radius
    // is then the head's own horizontal reach at that elevation, so the
    // column meets the head without a step in radius where it takes over.
    const envelope: IEnvelope = {
      directions,
      weights,
      powered,
      scale,
      rho: new Float64Array(AZIMUTHS),
      floor: circular(floorSamples),
      widest: new Float64Array(AZIMUTHS),
      shoulder: circular(shoulderSamples),
    };
    for (let i: number = 0; i < AZIMUTHS; ++i) {
      const alpha: number = ((i + 0.5) / AZIMUTHS) * 2 * Math.PI;
      for (const [elevations, radii, fallback] of [
        [envelope.floor, envelope.rho, rhoSamples],
        [envelope.shoulder, envelope.widest, widestSamples],
      ] as const) {
        const beta: number = elevations[i]!;
        const reached: [number, [number, number, number]] | null = power(
          envelope,
          AutoMovieHumanHeadField.direction(alpha, beta),
        );
        radii[i] =
          reached === null ? fallback[i]! : reached[0] * Math.cos(beta);
      }
    }
    return envelope;
  }

  /**
   * Envelope radius along a direction.
   *
   * Lying hair follows the head down to its lowest draped point and hangs
   * from there; hanging hair (`hang`) leaves the head at its widest
   * draped point in each azimuth and falls below it as a vertical curtain,
   * as a cut hanging under gravity does, instead of following the head
   * back in under the occiput, the ears and the jaw, where the surface
   * faces down and shades the hair dark.
   *
   * @param envelope Envelope
   * @param u Direction; need not be unit
   * @param hang Whether the hair hangs from the widest point
   * @returns Radius in millimetres
   */
  export function radius(
    envelope: IEnvelope,
    u: [number, number, number],
    hang: boolean = false,
  ): number {
    return evaluate(envelope, unit(u), hang)[0];
  }

  /**
   * Outward unit normal of the envelope at the direction of a point, which
   * is also the normal of every scaled copy `lambda P(d)` there.
   *
   * @param envelope Envelope
   * @param p Point, head-local millimetres
   * @param hang Whether the hair hangs from the widest point, see {@link radius}
   * @returns Unit normal
   */
  export function normal(
    envelope: IEnvelope,
    p: [number, number, number],
    hang: boolean = false,
  ): [number, number, number] {
    const d: [number, number, number] = unit(p);
    const [f, g] = evaluate(envelope, d, hang);
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

/** Data grid azimuths. */
const AZIMUTHS: number = 64;

/** Data grid elevations, from the nadir to the zenith. */
const ELEVATIONS: number = 32;

/**
 * Angular width of the head kernel, radians: about 14 mm on a 95 mm
 * scalp, wider than the grid's 0.1 radian so every direction averages
 * several data, and narrower than the vault's own curvature changes
 * (forehead to vertex, about 0.6 radian). A convention.
 */
const WIDTH: number = 0.15;

/** Concentration of the head kernel, `1 / WIDTH^2`. */
const KAPPA: number = 1 / WIDTH ** 2;

/**
 * Kernel reach: data beyond `sqrt(2 * 4.6 / KAPPA)` (0.46 radian) weigh
 * under one percent of the centre and are skipped.
 */
const REACH: number = Math.sqrt((2 * 4.6) / KAPPA);

/**
 * Exponent of the power mean. Over the vault neighbouring data differ by a
 * few percent, where a mean of order 16 lies within about a millimetre of
 * the largest neighbour; a convention.
 */
const POWER: number = 16;


/** Concentration of the azimuth kernel of the column, same width as the head kernel. */
const AZIMUTH_KAPPA: number = KAPPA;

/**
 * Centre elevation of a grid row.
 *
 * @param j Row, 0 at the nadir
 * @returns Elevation, radians
 */
function elevation(j: number): number {
  return ((j + 0.5) / ELEVATIONS) * Math.PI - Math.PI / 2;
}

/**
 * Von Mises kernel mean of per-azimuth samples at every azimuth cell
 * centre, a smooth periodic profile with no ringing.
 *
 * @param samples One value per azimuth cell
 * @returns Smoothed values per azimuth cell
 */
function circular(samples: number[]): Float64Array {
  const out: Float64Array = new Float64Array(AZIMUTHS);
  for (let i: number = 0; i < AZIMUTHS; ++i) {
    let s0: number = 0;
    let s1: number = 0;
    for (let k: number = 0; k < AZIMUTHS; ++k) {
      const w: number = Math.exp(
        AZIMUTH_KAPPA * (Math.cos(((i - k) / AZIMUTHS) * 2 * Math.PI) - 1),
      );
      s0 += w;
      s1 += w * samples[k]!;
    }
    out[i] = s1 / s0;
  }
  return out;
}

/**
 * Periodic linear interpolation of a per-azimuth profile at an azimuth,
 * with its derivative. The profile is a kernel mean already smooth on the
 * cell scale, so the linear pieces add only a slope step of second order.
 *
 * @param profile Values at the azimuth cell centres
 * @param alpha Azimuth, radians
 * @returns Value and derivative per radian
 */
function profile(profile: Float64Array, alpha: number): [number, number] {
  const x: number = (alpha / (2 * Math.PI)) * AZIMUTHS - 0.5;
  const i: number = Math.floor(x);
  const t: number = x - i;
  const a: number = profile[((i % AZIMUTHS) + AZIMUTHS) % AZIMUTHS]!;
  const b: number = profile[(((i + 1) % AZIMUTHS) + AZIMUTHS) % AZIMUTHS]!;
  return [a + (b - a) * t, ((b - a) * AZIMUTHS) / (2 * Math.PI)];
}

/**
 * Value and tangential gradient at a unit direction.
 *
 * @param envelope Envelope
 * @param d Unit direction
 * @param hang Whether the column hangs from the widest point rather than
 *   the lowest
 * @returns Radius and its gradient on the sphere
 */
function evaluate(
  envelope: AutoMovieHumanHairEnvelope.IEnvelope,
  d: [number, number, number],
  hang: boolean,
): [number, [number, number, number]] {
  const alpha: number = Math.atan2(d[2], d[0]);
  const beta: number = Math.asin(Math.max(-1, Math.min(1, d[1])));
  const cb: number = Math.max(Math.cos(beta), 1e-6);

  // Tangent frame: e_alpha toward increasing azimuth, e_beta upward.
  const ea: [number, number, number] = [-Math.sin(alpha), 0, Math.cos(alpha)];
  const eb: [number, number, number] = [
    -Math.sin(beta) * Math.cos(alpha),
    Math.cos(beta),
    -Math.sin(beta) * Math.sin(alpha),
  ];

  // Column: rho / cos(beta), its gradient from rho'(alpha) and tan(beta).
  const [rho, drho] = profile(hang ? envelope.widest : envelope.rho, alpha);
  const [floor] = profile(
    hang ? envelope.shoulder : envelope.floor,
    alpha,
  );
  const column: number = rho / cb;
  const columnGradient: [number, number, number] = combine(
    ea,
    drho / cb / cb,
    eb,
    column * Math.tan(beta),
  );

  // The column takes over below its hanging elevation. Its radius there is
  // the head's own reach (see `create`), so the radius is continuous; at
  // the widest point the head is vertical, so the normal is too, up to the
  // azimuth smoothing of that elevation. A blend band either side lifted
  // the column over the scalp above it, or mixed in the head's
  // down-facing normals below it.
  if (beta <= floor) return [column, columnGradient];
  return power(envelope, d) ?? [column, columnGradient];
}

/**
 * Kernel power mean of the head data at a unit direction, with its
 * tangential gradient by the quotient rule; null where no datum lies
 * within the kernel's reach.
 *
 * @param envelope Envelope
 * @param d Unit direction
 * @returns Radius and gradient, or null
 */
function power(
  envelope: AutoMovieHumanHairEnvelope.IEnvelope,
  d: [number, number, number],
): [number, [number, number, number]] | null {
  const alpha: number = Math.atan2(d[2], d[0]);
  const beta: number = Math.asin(Math.max(-1, Math.min(1, d[1])));
  const j0: number = Math.max(
    0,
    Math.floor(((beta - REACH + Math.PI / 2) / Math.PI) * ELEVATIONS - 0.5),
  );
  const j1: number = Math.min(
    ELEVATIONS - 1,
    Math.ceil(((beta + REACH + Math.PI / 2) / Math.PI) * ELEVATIONS - 0.5),
  );
  const cos: number = Math.max(
    Math.cos(Math.min(Math.PI / 2, Math.abs(beta) + REACH)),
    0,
  );
  // Azimuth cells within reach on the row nearest the pole, or the whole
  // ring when that covers it.
  const span: number =
    cos * AZIMUTHS < 1
      ? AZIMUTHS
      : Math.ceil((REACH / cos / (2 * Math.PI)) * AZIMUTHS) + 1;
  const ring: boolean = 2 * span + 1 >= AZIMUTHS;
  const first: number =
    Math.floor((alpha / (2 * Math.PI)) * AZIMUTHS) - (ring ? 0 : span);
  const cells: number = ring ? AZIMUTHS : 2 * span + 1;
  const { directions, weights, powered } = envelope;
  let s0: number = 0;
  let s1: number = 0;
  const g0: [number, number, number] = [0, 0, 0];
  const g1: [number, number, number] = [0, 0, 0];
  for (let j: number = j0; j <= j1; ++j)
    for (let o: number = 0; o < cells; ++o) {
      const i: number = (((first + o) % AZIMUTHS) + AZIMUTHS) % AZIMUTHS;
      const m: number = j * AZIMUTHS + i;
      const w: number = weights[m]!;
      if (w === 0) continue;
      const cx: number = directions[3 * m]!;
      const cy: number = directions[3 * m + 1]!;
      const cz: number = directions[3 * m + 2]!;
      const dot: number = d[0] * cx + d[1] * cy + d[2] * cz;
      const k: number = w * Math.exp(KAPPA * (dot - 1));
      const v: number = powered[m]!;
      s0 += k;
      s1 += k * v;
      // grad K = kappa K (c - (d . c) d), tangent to the sphere at d.
      const tx: number = KAPPA * k * (cx - dot * d[0]);
      const ty: number = KAPPA * k * (cy - dot * d[1]);
      const tz: number = KAPPA * k * (cz - dot * d[2]);
      g0[0] += tx;
      g0[1] += ty;
      g0[2] += tz;
      g1[0] += tx * v;
      g1[1] += ty * v;
      g1[2] += tz * v;
    }
  if (!(s0 > 1e-12) || !(s1 > 0)) return null;
  // f = scale (S1 / S0)^(1/p); grad f = f / p * (grad S1 / S1 - grad S0 / S0).
  const f: number = envelope.scale * (s1 / s0) ** (1 / POWER);
  const gradient: [number, number, number] = [0, 0, 0];
  for (let k: number = 0; k < 3; ++k)
    gradient[k] = (f / POWER) * (g1[k]! / s1 - g0[k]! / s0);
  return [f, gradient];
}

/**
 * Linear combination `a s + b t`.
 *
 * @param a First vector
 * @param s Its factor
 * @param b Second vector
 * @param t Its factor
 * @returns The combination
 */
function combine(
  a: [number, number, number],
  s: number,
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] * s + b[0] * t, a[1] * s + b[1] * t, a[2] * s + b[2] * t];
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
