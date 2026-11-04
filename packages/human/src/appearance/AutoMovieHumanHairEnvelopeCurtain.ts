import { AutoMovieHumanHairEnvelopeMean } from "./AutoMovieHumanHairEnvelopeMean";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The hanging column of the hair mass, centred on the vertical through the
 * head: below a point of each azimuth, hair hangs as a vertical column of
 * that point's horizontal distance `rho`, `rho / cos(beta)` in the chart's
 * radial frame, with a horizontal normal. Lying hair hangs from the lowest
 * draped head point; hanging hair from the widest one, where the head is
 * vertical, so the curtain leaves the head tangentially and does not follow
 * it back in under the occiput, the ears and the jaw: there the head faces
 * down, and a cut shaded by it went black under the ears. The column is
 * analytic rather than data, since a fit of its `1 / cos` growth toward the
 * nadir rang into the head above it. `rho(alpha)` and its elevation
 * `beta_0(alpha)` is a von Mises kernel mean over azimuth of its per-azimuth
 * samples, smooth and periodic, and `rho(alpha)` is the head's own
 * horizontal reach at that elevation, so the column takes over below
 * `beta_0` without a step in radius; at the widest point the head is
 * vertical, so the normal turns only by the smoothing of `beta_0`.
 */
export namespace AutoMovieHumanHairEnvelopeCurtain {
  /** The two columns' profiles over azimuth. */
  export interface ICurtain {
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

  /** The column at one direction. */
  export interface IColumn {
    /** Radius `rho / cos(beta)`, millimetres. */
    value: number;

    /** Tangential gradient on the sphere. */
    gradient: AutoMovieHumanSkinVector.Vec3;

    /** Elevation below which the column takes over, radians. */
    floor: number;
  }

  /**
   * Build the curtain from the head scan: the widest reach per azimuth, the
   * smoothed hanging elevations and the column radii at them.
   *
   * @param scan The head scan
   * @param mean The fitted power mean
   * @returns The curtain
   */
  export function create(
    scan: AutoMovieHumanHairEnvelopeMean.IScan,
    mean: AutoMovieHumanHairEnvelopeMean.IMean,
  ): ICurtain {
    const { AZIMUTHS, ELEVATIONS } = AutoMovieHumanHairEnvelopeMean;
    const widestSamples: number[] = [];
    const shoulderSamples: number[] = [];
    for (let i: number = 0; i < AZIMUTHS; ++i) {
      // Widest horizontal distance of the draped head in this azimuth and its
      // elevation: hair below it falls as a vertical curtain from it.
      let widest: number = scan.rho[i]!;
      let shoulder: number = scan.floor[i]!;
      for (let j: number = 0; j < ELEVATIONS; ++j) {
        const at: number = j * AZIMUTHS + i;
        if (!(scan.weights[at]! > 0)) continue;

        const reach: number =
          scan.values[at]! *
          Math.cos(AutoMovieHumanHairEnvelopeMean.elevation(j));
        if (reach > widest) {
          widest = reach;
          shoulder = AutoMovieHumanHairEnvelopeMean.elevation(j);
        }
      }
      widestSamples.push(widest);
      shoulderSamples.push(shoulder);
    }

    // The hanging elevations are smoothed over azimuth; each column's radius
    // is then the head's own horizontal reach at that elevation, so the
    // column meets the head without a step in radius where it takes over.
    const curtain: ICurtain = {
      rho: new Float64Array(AZIMUTHS),
      floor: circular(scan.floor),
      widest: new Float64Array(AZIMUTHS),
      shoulder: circular(shoulderSamples),
    };
    for (let i: number = 0; i < AZIMUTHS; ++i) {
      const alpha: number = ((i + 0.5) / AZIMUTHS) * 2 * Math.PI;
      for (const [elevations, radii, fallback] of [
        [curtain.floor, curtain.rho, scan.rho],
        [curtain.shoulder, curtain.widest, widestSamples],
      ] as const) {
        const beta: number = elevations[i]!;
        const reached: [number, AutoMovieHumanSkinVector.Vec3] | null =
          AutoMovieHumanHairEnvelopeMean.power(
            mean,
            AutoMovieHumanHeadField.direction(alpha, beta),
          );
        radii[i] =
          reached === null ? fallback[i]! : reached[0] * Math.cos(beta);
      }
    }
    return curtain;
  }

  /**
   * The column at a unit direction: its radius, its gradient from
   * `rho'(alpha)` and `tan(beta)`, and the elevation below which it takes
   * over.
   *
   * @param curtain The curtain
   * @param d Unit direction
   * @param hang Whether the column hangs from the widest point rather than
   *   the lowest
   * @returns The column
   */
  export function column(
    curtain: ICurtain,
    d: AutoMovieHumanSkinVector.Vec3,
    hang: boolean,
  ): IColumn {
    const alpha: number = Math.atan2(d[2], d[0]);
    const beta: number = Math.asin(Math.max(-1, Math.min(1, d[1])));
    const cb: number = Math.max(Math.cos(beta), 1e-6);

    // Tangent frame: e_alpha toward increasing azimuth, e_beta upward.
    const ea: AutoMovieHumanSkinVector.Vec3 = [
      -Math.sin(alpha),
      0,
      Math.cos(alpha),
    ];
    const eb: AutoMovieHumanSkinVector.Vec3 = [
      -Math.sin(beta) * Math.cos(alpha),
      Math.cos(beta),
      -Math.sin(beta) * Math.sin(alpha),
    ];
    const [rho, drho]: [number, number] = profile(
      hang ? curtain.widest : curtain.rho,
      alpha,
    );
    const [floor]: [number, number] = profile(
      hang ? curtain.shoulder : curtain.floor,
      alpha,
    );
    const value: number = rho / cb;
    return {
      value,
      gradient: combine(ea, drho / cb / cb, eb, value * Math.tan(beta)),
      floor,
    };
  }
}

/**
 * Von Mises kernel mean of per-azimuth samples at every azimuth cell centre,
 * a smooth periodic profile with no ringing; the kernel has the head
 * kernel's width.
 *
 * @param samples One value per azimuth cell
 * @returns Smoothed values per azimuth cell
 */
function circular(samples: number[]): Float64Array {
  const { AZIMUTHS, KAPPA } = AutoMovieHumanHairEnvelopeMean;
  const out: Float64Array = new Float64Array(AZIMUTHS);
  for (let i: number = 0; i < AZIMUTHS; ++i) {
    let s0: number = 0;
    let s1: number = 0;
    for (let k: number = 0; k < AZIMUTHS; ++k) {
      const w: number = Math.exp(
        KAPPA * (Math.cos(((i - k) / AZIMUTHS) * 2 * Math.PI) - 1),
      );
      s0 += w;
      s1 += w * samples[k]!;
    }
    out[i] = s1 / s0;
  }
  return out;
}

/**
 * Periodic linear interpolation of a per-azimuth profile at an azimuth, with
 * its derivative. The profile is a kernel mean already smooth on the cell
 * scale, so the linear pieces add only a slope step of second order.
 *
 * @param values Values at the azimuth cell centres
 * @param alpha Azimuth, radians
 * @returns Value and derivative per radian
 */
function profile(values: Float64Array, alpha: number): [number, number] {
  const { AZIMUTHS } = AutoMovieHumanHairEnvelopeMean;
  const x: number = (alpha / (2 * Math.PI)) * AZIMUTHS - 0.5;
  const i: number = Math.floor(x);
  const t: number = x - i;
  const a: number = values[((i % AZIMUTHS) + AZIMUTHS) % AZIMUTHS]!;
  const b: number = values[(((i + 1) % AZIMUTHS) + AZIMUTHS) % AZIMUTHS]!;
  return [a + (b - a) * t, ((b - a) * AZIMUTHS) / (2 * Math.PI)];
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
  a: AutoMovieHumanSkinVector.Vec3,
  s: number,
  b: AutoMovieHumanSkinVector.Vec3,
  t: number,
): AutoMovieHumanSkinVector.Vec3 {
  return [a[0] * s + b[0] * t, a[1] * s + b[1] * t, a[2] * s + b[2] * t];
}
