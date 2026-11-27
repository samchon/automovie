import { AutoMovieHumanF1FacePriors as P } from "./AutoMovieHumanF1FacePriors";

/**
 * The lids' law: the fissure's two canthi and two margins in the level frame the published contours are measured in, and what a blink
 * turns. It reads no family and no figure; `packages/human/docs/techniques/face-one-shot.md` holds the design and the comparison with
 * the f1 reference.
 *
 * Frame: the frontal plane about the pupil's centre, `x` toward the temple and `y` up, millimetres, the head level. A direction is given
 * as an angle from the nasal side, 0 nasal, 90 up, 180 temporal, 270 down, as the midpupil lid distances of the literature are.
 *
 * - The upper margin is the published radial profile of Shin et al. 2025 (PLOS One; 40 Korean women aged 20 to 39, a cubic Bezier
 *   fitted to each margin and read every 15 degrees; this package's note `docs/sources/shin-2025-upper-eyelid-contour.md`), taken as
 *   its ratio to the distance straight up and scaled by the person's own distance straight up (MRD1). Ratios keep a contour's shape
 *   under a change of size; the absolute distances are one population's.
 * - The lower margin is the radial profile of a Chinese cohort (540 healthy subjects; women in their twenties; PMC11179404), likewise as
 *   ratios to the distance straight down and scaled by MRD2. That cohort's absolute sizes are small against every other source, so only
 *   its ratios are used.
 * - Between the published directions a ratio is read linearly: the law states the published samples and adds no curve of its own.
 * - The canthi: the medial one stands `MEDIAL_CANTHUS_DROP_MM` below the pupil's centre (van den Bosch et al. 1999, 320 white Dutch
 *   subjects, 3.7 mm, SD 1.1, no change with sex or age); the lateral one stands above it by the fissure's length times the sine of the
 *   canthal tilt. The pupil is taken at the middle of the fissure's level extent, an assumption no source read here states.
 *
 * The lid's outer face lies on the sphere of the globe's radius plus the lid's thickness; on the f1 reference that holds within 0.3 mm
 * over the middle 26 mm of the fissure and fails toward the medial canthus, which stands off the globe.
 */
export namespace AutoMovieHumanF1EyeLaw {
  /** A point of the level frame, mm: toward the temple, up. */
  export type P2 = [number, number];

  /** One eye's measures. */
  export interface IEye {
    /** Fissure length, endocanthion to exocanthion, mm. */
    length: number;

    /** The upper margin above the pupil's centre, straight up, eye open at rest, mm (MRD1). */
    above: number;

    /** The lower margin below the pupil's centre, straight down, mm (MRD2). */
    below: number;

    /** Canthal tilt: the exocanthion above the endocanthion's level, degrees. */
    tilt: number;

    /**
     * The person's own upper margin, by the published definition: its distance from the pupil's centre every 15 degrees from 0 to 180,
     * thirteen values, in any one unit (only their ratios are read). Absent, the published profile. A published contour is one
     * population's shape; on the f1 reference the margin agrees with it within a tenth of the distance straight up between 60 and 120
     * degrees and stands up to 1.6 times farther out toward both ends.
     */
    upperProfile?: readonly number[];

    /** The person's own lower margin likewise: every 15 degrees from 195 to 345, eleven values. Absent, the published profile. */
    lowerProfile?: readonly number[];
  }

  /** The medial canthus below the pupil's centre, mm: van den Bosch et al. 1999, Br J Ophthalmol 83:347 (read in full), 3.7, SD 1.1. */
  export const MEDIAL_CANTHUS_DROP_MM: number = 3.7;

  /**
   * A margin's distance from the pupil's centre along a direction, mm: the upper margin for 0 to 180 degrees, the lower for 195 to 345.
   * Between 180 and 195 and between 345 and 360 the margins run to the canthi and no profile is published; the law refuses those.
   *
   * `blink` in [0, 1] lowers the upper margin: at each of its directions the distance falls by that share of the way to the reflection of
   * the lower margin's distance in the pupil's level, so at 1 the upper margin lies on the lower one's mirror through that level and the
   * fissure is shut at the pupil. It is the measure a lid's turn about the canthal line is solved from, not that turn itself.
   */
  export function margin(eye: IEye, degrees: number, blink: number = 0): number {
    const upper: readonly number[] = eye.upperProfile ?? UPPER_MM;
    const lower: readonly number[] = eye.lowerProfile ?? LOWER_MM;
    if (upper.length !== UPPER_MM.length || lower.length !== LOWER_MM.length) throw new Error("eye law: a margin profile has thirteen values above and eleven below");
    if (degrees >= 0 && degrees <= 180) {
      const open: number = eye.above * ratio(upper, 0, 6, degrees);
      return blink === 0 ? open : open - blink * (open + (degrees >= 15 && degrees <= 165 ? eye.below * ratio(lower, 195, 5, 360 - degrees) : 0));
    }
    if (degrees >= 195 && degrees <= 345) return eye.below * ratio(lower, 195, 5, degrees);
    throw new Error("eye law: no margin profile is published at " + degrees + " degrees");
  }

  /** A margin's point in the level frame at a direction. */
  export function point(eye: IEye, degrees: number, blink: number = 0): P2 {
    const r: number = margin(eye, degrees, blink);
    return [-r * Math.cos((degrees * Math.PI) / 180), r * Math.sin((degrees * Math.PI) / 180)];
  }

  /** The two canthi in the level frame, the medial first. */
  export function canthi(eye: IEye): [P2, P2] {
    const tilt: number = (eye.tilt * Math.PI) / 180;
    const half: number = (eye.length * Math.cos(tilt)) / 2;
    return [
      [-half, -MEDIAL_CANTHUS_DROP_MM],
      [half, -MEDIAL_CANTHUS_DROP_MM + eye.length * Math.sin(tilt)],
    ];
  }

  /** The radius of the lid's outer face about the globe's centre, mm: the globe's radius plus the lid's thickness, published where the person's are absent. */
  export function radius(globe: number = P.GLOBE_AXIAL_MM / 2, lid: number = P.UPPER_LID_MM): number {
    return globe + lid;
  }

  /*
   * The upper margin's distance from the pupil's centre every 15 degrees from 0 (nasal) to 180 (temporal), mm: Shin et al. 2025, women,
   * right eye (read through a page reader; the digits want one check against the paper's table before a fit relies on them).
   */
  const UPPER_MM: readonly number[] = [9.12, 7.24, 6.0, 5.23, 4.78, 4.59, 4.62, 4.87, 5.4, 6.28, 7.66, 9.73, 12.15];

  /*
   * The lower margin's distance every 15 degrees from 195 (temporal) to 345 (nasal), mm: PMC11179404, women aged 20 to 29 (page reader).
   */
  const LOWER_MM: readonly number[] = [7.51, 5.86, 4.78, 4.12, 3.75, 3.58, 3.57, 3.87, 4.5, 5.86, 8.61];

  /*
   * A published profile read linearly at an angle, as its ratio to its value at the profile's sample `unit`.
   */
  function ratio(profile: readonly number[], first: number, unit: number, degrees: number): number {
    const at: number = (degrees - first) / 15;
    const k: number = Math.min(profile.length - 2, Math.max(0, Math.floor(at)));
    return (profile[k]! + (at - k) * (profile[k + 1]! - profile[k]!)) / profile[unit]!;
  }
}
