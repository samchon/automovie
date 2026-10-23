import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanEyeGlobe } from "./AutoMovieHumanEyeGlobe";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Eyelid margin geometry around one eye opening, from its calibrated
 * contact line and the seated globe.
 *
 * The aperture of an eye is the posterior lid margin: the line where each
 * lid touches the eyeball, meeting the other lid at the two canthi. This
 * module evaluates it at uniform phases and derives, by fixed anatomical
 * rules, everything the skin cut and the eye's appearance build on it:
 *
 * - the globe frame: the biometric globe of {@link AutoMovieHumanEyeGlobe}
 *   seated on the calibrated eye sphere, so the contact line lies on its
 *   anterior surface;
 * - the posterior edge: each margin point moved onto that surface (plus a
 *   hair's clearance) wherever the globe lies behind it, so the lid rests on
 *   the eye without a gap or an overlap; beyond the globe's silhouette, at
 *   the canthi, the calibrated point stays;
 * - the anterior edge (lash line): in front of the posterior edge by the
 *   lid margin's depth, slightly outward, thinning toward the canthi where
 *   the two lids merge;
 * - canthi, lid membership (upper or lower) and the position along each
 *   lid from the medial to the lateral canthus.
 *
 * Frame: calibration millimetres. `forward` is the aperture's line of sight,
 * `up` world up made orthogonal to it, `lateral = forward x up`; for a
 * horizontal `forward` this is the projection of
 * {@link AutoMovieHumanLoftAperture.outline}.
 */
export namespace AutoMovieHumanEyelid {
  /** Point `[x, y, z]` in mm. */
  export type Point = [number, number, number];

  /**
   * Lid rule constants in mm.
   *
   * - `band`: width, measured across the margin in projection, of the skin
   *   the lid band replaces outside the contact line. The lofted skin there
   *   reproduces the reference's inward roll into the conjunctival sac only
   *   coarsely, so the band rebuilds the last millimetres of the lid by rule.
   * - `upper`, `lower`: depth of the lid margin along the line of sight, from
   *   the contact line to the anterior edge, for each lid. The margin is
   *   about 2 mm wide (anterior lamella with the lashes to the posterior
   *   edge on the eye, Gray 1918) and inclined to the line of sight; the
   *   reference's anterior lid edge lies 0.6 to 1.1 mm in front of its
   *   contact line.
   * - `offset`: how far the anterior edge lies outward of the posterior edge
   *   in projection.
   * - `taper`: arc length from a canthus over which the margin depth grows
   *   from `merge` of its full value; the lids thin where they meet.
   * - `gap`: clearance of the posterior edge off the globe surface.
   * - `clearance`: least lid thickness over the globe across the band.
   */
  export const rule: {
    band: number;
    upper: number;
    lower: number;
    offset: number;
    taper: number;
    merge: number;
    gap: number;
    clearance: number;
  } = {
    band: 2.5,
    upper: 1.0,
    lower: 0.8,
    offset: 0.25,
    taper: 5,
    merge: 0.3,
    gap: 0.03,
    clearance: 0.5,
  };

  /** Margin samples per eye. */
  export const SAMPLES: number = 360;

  /** Seated globe frame in calibration mm. */
  export interface IGlobe {
    /** Centre of the scleral ellipsoid. */
    centre: Point;

    /** Unit gaze direction, the aperture's `forward`. */
    forward: Point;

    /** Unit up, orthogonal to `forward`. */
    up: Point;

    /** Unit `forward x up`. */
    lateral: Point;
  }

  /** One margin sample. */
  export interface ISample {
    /** Phase of the aperture series, radians. */
    phase: number;

    /** Posterior lid edge, on the globe where the globe lies behind it. */
    contact: Point;

    /** Anterior lid edge, the lash line. */
    anterior: Point;

    /** Unit direction across the margin away from the opening, in projection. */
    outward: Point;

    /** Unit direction along increasing phase, in projection. */
    tangent: Point;

    /** Distance of the contact point from the gaze axis, mm. */
    rho: number;

    /** Whether the sample belongs to the upper lid. */
    upper: boolean;

    /** Arc length to the nearer canthus, mm. */
    corner: number;

    /** Position along its lid: 0 at the medial canthus, 1 at the lateral. */
    position: number;

    /** Margin depth from posterior to anterior edge, mm. */
    thickness: number;
  }

  /** Evaluated margin of one eye. */
  export interface ILid {
    /** Aperture name, e.g. `eye.left`. */
    name: string;

    /** Seated globe. */
    globe: IGlobe;

    /** Samples at uniform phases. */
    samples: ISample[];

    /** Index of the medial canthus sample. */
    medial: number;

    /** Index of the lateral canthus sample. */
    lateral: number;
  }

  /**
   * Evaluate the lid of an eye aperture.
   *
   * @param aperture Eye aperture, its margin the lid contact line
   * @param eye Calibrated eye sphere behind it
   * @returns The lid samples and the seated globe
   */
  export function create(
    aperture: IAutoMovieHumanLoftAperture,
    eye: IAutoMovieHumanBodyCalibration.IEye,
  ): ILid {
    const globe: IGlobe = seat(aperture, eye);
    const n: number = SAMPLES;
    const raw: Point[] = Array.from(
      { length: n },
      (_: unknown, i: number): Point =>
        AutoMovieHumanLoftAperture.evaluate(aperture, (2 * Math.PI * i) / n),
    );

    // Projected coordinates relative to the globe centre.
    const plane: [number, number][] = raw.map((p: Point): [number, number] => [
      dot(sub(p, globe.centre), globe.lateral),
      dot(sub(p, globe.centre), globe.up),
    ]);

    // Orientation: positive signed area is counter-clockwise in
    // (lateral, up), whose outward normal is the tangent turned clockwise.
    let area: number = 0;
    plane.forEach((a: [number, number], i: number): void => {
      const b: [number, number] = plane[(i + 1) % n]!;
      area += a[0] * b[1] - b[0] * a[1];
    });
    const turn: number = area > 0 ? 1 : -1;

    // Canthi: the lateral extremes; the medial one lies nearer the
    // body's midline (z = 0 in the registered frame).
    let lo: number = 0;
    let hi: number = 0;
    plane.forEach((q: [number, number], i: number): void => {
      if (q[0] < plane[lo]![0]) lo = i;
      if (q[0] > plane[hi]![0]) hi = i;
    });
    const medial: number =
      Math.abs(raw[lo]![2]) < Math.abs(raw[hi]![2]) ? lo : hi;
    const lateral: number = medial === lo ? hi : lo;

    // Arc lengths, and which of the two arcs between the canthi is upper.
    const step: number[] = plane.map(
      (a: [number, number], i: number): number => {
        const b: [number, number] = plane[(i + 1) % n]!;
        return Math.hypot(b[0] - a[0], b[1] - a[1]);
      },
    );
    const along = (from: number, to: number): number => {
      let s: number = 0;
      for (let i: number = from; i !== to; i = (i + 1) % n) s += step[i]!;
      return s;
    };
    const arc = (from: number, to: number): number[] => {
      const out: number[] = [];
      for (let i: number = from; i !== to; i = (i + 1) % n) out.push(i);
      out.push(to);
      return out;
    };
    const first: number[] = arc(medial, lateral);
    const second: number[] = arc(lateral, medial);
    const height = (list: number[]): number =>
      list.reduce((s: number, i: number): number => s + plane[i]![1], 0) /
      list.length;
    const upperArc: Set<number> = new Set(
      height(first) > height(second) ? first : second,
    );

    const samples: ISample[] = raw.map((p: Point, i: number): ISample => {
      const before: [number, number] = plane[(i + n - 1) % n]!;
      const after: [number, number] = plane[(i + 1) % n]!;
      const tl: number = after[0] - before[0];
      const tv: number = after[1] - before[1];
      const tlen: number = Math.hypot(tl, tv) || 1;
      const t2: [number, number] = [tl / tlen, tv / tlen];
      const o2: [number, number] = [turn * t2[1], -turn * t2[0]];
      const tangent: Point = add(
        scale(globe.lateral, t2[0]),
        scale(globe.up, t2[1]),
      );
      const outward: Point = add(
        scale(globe.lateral, o2[0]),
        scale(globe.up, o2[1]),
      );

      // Posterior edge: on the globe where it lies behind the point, the
      // calibrated depth beyond its silhouette, never inside it.
      const rho: number = Math.hypot(plane[i]![0], plane[i]![1]);
      const depth: number = dot(sub(p, globe.centre), globe.forward);
      const surface: number = AutoMovieHumanEyeGlobe.anterior(rho) + rule.gap;
      const radial: number = AutoMovieHumanEyeGlobe.dimensions.radial;
      const w: number = Number.isFinite(surface)
        ? 1 - smoothstep(0.85 * radial, 0.95 * radial, rho)
        : 0;
      const free: number = Number.isFinite(surface)
        ? Math.max(depth, surface)
        : depth;
      const placed: number = w > 0 ? w * surface + (1 - w) * free : free;
      const contact: Point = add(p, scale(globe.forward, placed - depth));

      const upper: boolean = upperArc.has(i);
      const toMedial: number = Math.min(along(i, medial), along(medial, i));
      const toLateral: number = Math.min(along(i, lateral), along(lateral, i));
      const length: number = toMedial + toLateral;
      const corner: number = Math.min(toMedial, toLateral);
      const thickness: number =
        (upper ? rule.upper : rule.lower) *
        (rule.merge + (1 - rule.merge) * smoothstep(0, rule.taper, corner));
      return {
        phase: (2 * Math.PI * i) / n,
        contact,
        anterior: add(
          contact,
          add(scale(globe.forward, thickness), scale(outward, rule.offset)),
        ),
        outward,
        tangent,
        rho,
        upper,
        corner,
        position: length > 0 ? toMedial / length : 0,
        thickness,
      };
    });
    return { name: aperture.name, globe, samples, medial, lateral };
  }

  /**
   * Seated globe frame of an eye: the biometric globe moved along the
   * aperture's line of sight onto the calibrated sphere by
   * {@link AutoMovieHumanEyeGlobe.seat}, as the appearance layer seats the
   * visible eyeball.
   *
   * @param aperture The eye's aperture, for its line of sight
   * @param eye Calibrated eye sphere
   * @returns Globe frame in calibration mm
   */
  export function seat(
    aperture: IAutoMovieHumanLoftAperture,
    eye: IAutoMovieHumanBodyCalibration.IEye,
  ): IGlobe {
    const forward: Point = normalize(aperture.forward);
    const up: Point = normalize(sub([0, 1, 0], scale(forward, forward[1])));
    const shift: number = AutoMovieHumanEyeGlobe.seat(eye.radius);
    return {
      centre: add(eye.centre, scale(forward, shift)),
      forward,
      up,
      lateral: cross(forward, up),
    };
  }

  /**
   * Depth of the globe's anterior surface along `forward` at the projection
   * of a point, relative to the globe centre; NaN beyond its silhouette.
   *
   * @param globe Globe frame
   * @param p Point in mm
   * @returns Depth in mm
   */
  export function surface(globe: IGlobe, p: Readonly<Point>): number {
    const d: Point = sub(p, globe.centre);
    return AutoMovieHumanEyeGlobe.anterior(
      Math.hypot(dot(d, globe.lateral), dot(d, globe.up)),
    );
  }

  /** Vector sum. */
  export function add(a: Readonly<Point>, b: Readonly<Point>): Point {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Vector difference. */
  export function sub(a: Readonly<Point>, b: Readonly<Point>): Point {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Scaled vector. */
  export function scale(a: Readonly<Point>, k: number): Point {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /** Dot product. */
  export function dot(a: Readonly<Point>, b: Readonly<Point>): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: Readonly<Point>, b: Readonly<Point>): Point {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Unit vector; a zero vector stays zero. */
  export function normalize(a: Readonly<Point>): Point {
    const length: number = Math.hypot(a[0], a[1], a[2]);
    return length > 0 ? scale(a, 1 / length) : [0, 0, 0];
  }

  /** Hermite smoothstep of `x` between `a` and `b`. */
  export function smoothstep(a: number, b: number, x: number): number {
    const t: number = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
}
