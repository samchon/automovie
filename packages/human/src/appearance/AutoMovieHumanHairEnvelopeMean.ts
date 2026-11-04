import { AutoMovieHumanHairEnvelopeDrape } from "./AutoMovieHumanHairEnvelopeDrape";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The hair mass's smooth envelope over the head: a kernel power mean of the
 * draped head radius, centred on the chart's sphere.
 *
 * Head data: on a grid of {@link AZIMUTHS} azimuths and {@link ELEVATIONS}
 * elevations, the draped radius of the head (`AutoMovieHumanHairEnvelopeDrape`)
 * where the chart measures head skin above the menton. Over the head the
 * envelope is a kernel power mean of that data,
 *
 * `f(d) = (sum_m w_m K_m(d) v_m^p / sum_m w_m K_m(d))^(1/p)`,
 *
 * with `K_m(d) = exp(kappa (d . d_m - 1))` a spherical Gaussian of angular
 * width {@link WIDTH} about each datum's direction, `w_m` its cell's solid
 * angle and `p` = {@link POWER}. The kernel is positive, so `f` lies between
 * the smallest and largest datum within its reach and cannot ring: an earlier
 * least-squares fit of a sum of Gaussians interpolated the data through
 * oscillating weights, and its gradient turned the shading normals by up to
 * 14 degrees either way at the Gaussians' spacing over the vault (grey
 * blotches over the back and top of the hair). The power mean leans toward
 * the largest neighbour, so the surface runs over bumps instead of through
 * them, without a clamp; it approaches the local maximum as `p` grows
 * (Hardy, Littlewood and Polya 1934, the power-mean inequality).
 *
 * The scan also reports, per azimuth, the head's reach and elevation at its
 * lowest draped point below the horizon, which the hanging curtain takes
 * over from (`AutoMovieHumanHairEnvelopeCurtain`).
 */
export namespace AutoMovieHumanHairEnvelopeMean {
  /** Data grid azimuths. */
  export const AZIMUTHS: number = 64;

  /** Data grid elevations, from the nadir to the zenith. */
  export const ELEVATIONS: number = 32;

  /**
   * Angular width of the head kernel, radians: about 14 mm on a 95 mm scalp,
   * wider than the grid's 0.1 radian so every direction averages several
   * data, and narrower than the vault's own curvature changes (forehead to
   * vertex, about 0.6 radian). A convention.
   */
  export const WIDTH: number = 0.15;

  /** Concentration of the head kernel, `1 / WIDTH^2`. */
  export const KAPPA: number = 1 / WIDTH ** 2;

  /**
   * Kernel reach: data beyond `sqrt(2 * 4.6 / KAPPA)` (0.46 radian) weigh
   * under one percent of the centre and are skipped.
   */
  export const REACH: number = Math.sqrt((2 * 4.6) / KAPPA);

  /**
   * Exponent of the power mean. Over the vault neighbouring data differ by a
   * few percent, where a mean of order 16 lies within about a millimetre of
   * the largest neighbour; a convention.
   */
  export const POWER: number = 16;

  /** The head data of one scan. */
  export interface IScan {
    /** Head data directions, three numbers each, row-major by elevation then azimuth. */
    directions: Float64Array;

    /** Solid-angle weight per datum; zero where the grid holds no head datum. */
    weights: Float64Array;

    /** Draped radius per datum, millimetres. */
    values: Float64Array;

    /** Lying column radius `rho` per azimuth cell: the head's reach at its lowest draped point, millimetres. */
    rho: number[];

    /** Lowest draped elevation `beta_0` per azimuth cell, radians. */
    floor: number[];
  }

  /** The fitted power mean. */
  export interface IMean {
    /** Head data directions, as in {@link IScan}. */
    directions: Float64Array;

    /** Solid-angle weight per datum. */
    weights: Float64Array;

    /** Datum over {@link scale}, raised to {@link POWER}. */
    powered: Float64Array;

    /** Largest datum, millimetres; the power mean's unit. */
    scale: number;
  }

  /**
   * Centre elevation of a grid row.
   *
   * @param j Row, 0 at the nadir
   * @returns Elevation, radians
   */
  export function elevation(j: number): number {
    return ((j + 0.5) / ELEVATIONS) * Math.PI - Math.PI / 2;
  }

  /**
   * Scan the draped head over the grid, azimuth by azimuth from the top
   * down to the lowest draped point below the horizon, where the column hangs
   * from.
   *
   * @param field Head chart
   * @returns The head data
   */
  export function scan(field: AutoMovieHumanHeadField.IField): IScan {
    const menton: number = field.top - field.height;
    const directions: Float64Array = new Float64Array(
      3 * AZIMUTHS * ELEVATIONS,
    );
    const weights: Float64Array = new Float64Array(AZIMUTHS * ELEVATIONS);
    const values: Float64Array = new Float64Array(AZIMUTHS * ELEVATIONS);
    const rhoSamples: number[] = [];
    const floorSamples: number[] = [];
    const head: (d: AutoMovieHumanSkinVector.Vec3) => boolean = (
      d: AutoMovieHumanSkinVector.Vec3,
    ): boolean =>
      AutoMovieHumanHeadField.covered(field, d) &&
      field.centre[1] + d[1] * AutoMovieHumanHeadField.radius(field, d) >
        menton;
    for (let i: number = 0; i < AZIMUTHS; ++i) {
      const alpha: number = ((i + 0.5) / AZIMUTHS) * 2 * Math.PI;

      // From the top down, the draped head skin to the lowest draped point of
      // the azimuth; the column hangs from that point.
      let rho: number | null = null;
      let floor: number = -Math.PI / 2;
      for (let j: number = ELEVATIONS - 1; j >= 0 && rho === null; --j) {
        const beta: number = elevation(j);
        const d: AutoMovieHumanSkinVector.Vec3 =
          AutoMovieHumanHeadField.direction(alpha, beta);
        if (!head(d)) continue;

        const value: number = AutoMovieHumanHairEnvelopeDrape.drape(field, d);
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

      // An azimuth whose head skin never reaches below the horizon hangs from
      // its lowest datum, or from the chart where it has none.
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
    }
    return {
      directions,
      weights,
      values,
      rho: rhoSamples,
      floor: floorSamples,
    };
  }

  /**
   * Fit the power mean's unit and powered data to a scan.
   *
   * @param data The scan
   * @returns The fitted mean
   */
  export function fit(data: IScan): IMean {
    let scale: number = 0;
    for (let m: number = 0; m < data.values.length; ++m)
      scale = Math.max(scale, data.values[m]!);
    const powered: Float64Array = new Float64Array(data.values.length);
    for (let m: number = 0; m < data.values.length; ++m)
      powered[m] =
        data.weights[m]! > 0 ? (data.values[m]! / scale) ** POWER : 0;
    return {
      directions: data.directions,
      weights: data.weights,
      powered,
      scale,
    };
  }

  /**
   * Kernel power mean of the head data at a unit direction, with its
   * tangential gradient by the quotient rule; null where no datum lies within
   * the kernel's reach.
   *
   * @param mean The fitted mean
   * @param d Unit direction
   * @returns Radius and gradient, or null
   */
  export function power(
    mean: IMean,
    d: AutoMovieHumanSkinVector.Vec3,
  ): [number, AutoMovieHumanSkinVector.Vec3] | null {
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
    const { directions, weights, powered } = mean;
    let s0: number = 0;
    let s1: number = 0;
    const g0: AutoMovieHumanSkinVector.Vec3 = [0, 0, 0];
    const g1: AutoMovieHumanSkinVector.Vec3 = [0, 0, 0];
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
    const f: number = mean.scale * (s1 / s0) ** (1 / POWER);
    const gradient: AutoMovieHumanSkinVector.Vec3 = [0, 0, 0];
    for (let k: number = 0; k < 3; ++k)
      gradient[k] = (f / POWER) * (g1[k]! / s1 - g0[k]! / s0);
    return [f, gradient];
  }
}
