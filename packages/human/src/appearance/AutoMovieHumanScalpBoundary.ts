import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import type { AutoMovieHumanHairline } from "../typings/AutoMovieHumanHairline";
import { AutoMovieHumanHairlineApex } from "./AutoMovieHumanHairlineApex";
import { AutoMovieHumanHairlineClass } from "./AutoMovieHumanHairlineClass";
import { AutoMovieHumanHairlineEarBehind } from "./AutoMovieHumanHairlineEarBehind";
import { AutoMovieHumanHairlineEarTop } from "./AutoMovieHumanHairlineEarTop";
import { AutoMovieHumanHairlineFrontalLine } from "./AutoMovieHumanHairlineFrontalLine";
import { AutoMovieHumanHairlineNape } from "./AutoMovieHumanHairlineNape";
import { AutoMovieHumanHairlineSideburn } from "./AutoMovieHumanHairlineSideburn";
import { AutoMovieHumanHairlineTemporalPeak } from "./AutoMovieHumanHairlineTemporalPeak";
import { AutoMovieHumanHairlineTrichion } from "./AutoMovieHumanHairlineTrichion";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";

/**
 * Hair-bearing boundary of the scalp as a height above eye level for each
 * azimuth around the head chart (see `AutoMovieHumanHeadField`).
 *
 * A head-skin point at azimuth `alpha` bears hair when its height above the
 * eyes' centres exceeds {@link height}. The boundary is assembled from its
 * zones, each built on the canonical side (+Z, azimuths 0 to 180 degrees)
 * from the head's landmarks (`AutoMovieHumanScalpLandmarks`): the frontal
 * line from the trichion to its apex on the exocanthion's plane
 * (`AutoMovieHumanHairlineTrichion`, `AutoMovieHumanHairlineFrontalLine`,
 * `AutoMovieHumanHairlineApex`), the temple down to the sideburn
 * (`AutoMovieHumanHairlineTemporalPeak`, `AutoMovieHumanHairlineSideburn`),
 * the margin over and behind the ear (`AutoMovieHumanHairlineEarTop`,
 * `AutoMovieHumanHairlineEarBehind`) and the nape
 * (`AutoMovieHumanHairlineNape`).
 * The declared reflection is `alpha -> -alpha` (`z -> -z`): the boundary
 * reads `|alpha|`. Interpolation is monotone piecewise cubic
 * (`AutoMovieHumanMonotoneCubic`), so the boundary never overshoots between
 * knots, and level at both ends: the front midline (0 degrees) and the back
 * midline (180 degrees) are mirror lines, where any other slope would fold
 * into a cusp, a notch at the parting of the frontal hairline.
 */
export namespace AutoMovieHumanScalpBoundary {
  /** The assembled boundary of one head and hairline class. */
  export interface IBoundary {
    /** `[azimuth degrees, height above the eyes mm]`, 0 to 180, increasing. */
    knots: Array<[number, number]>;
  }

  /**
   * Assemble the boundary from its zones.
   *
   * @param hairline Frontal hairline class
   * @param field Head chart
   * @param landmarks The head's landmarks
   * @returns The boundary
   */
  export function build(
    hairline: AutoMovieHumanHairline,
    field: AutoMovieHumanHeadField.IField,
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
  ): IBoundary {
    // The class's shape and the trichion, which the frontal line and the apex
    // are scaled by.
    const shape: AutoMovieHumanHairlineClass.IShape =
      AutoMovieHumanHairlineClass.shape(hairline);
    const middle: number =
      AutoMovieHumanHairlineTrichion.height(hairline, field, landmarks) -
      landmarks.eyeLevel;
    const scale: number = AutoMovieHumanHairlineApex.scale(
      shape,
      field,
      landmarks,
      middle,
    );

    // Zones in azimuth order, each from its own piece.
    const front: Array<[number, number]> = [
      ...AutoMovieHumanHairlineTrichion.knots(shape, middle),
      ...AutoMovieHumanHairlineFrontalLine.knots(shape, middle, scale),
      ...AutoMovieHumanHairlineApex.knots(shape, middle, scale),
    ];
    const peak: [number, number] = AutoMovieHumanHairlineTemporalPeak.knot(
      front[front.length - 1]!,
    );
    const zones: Array<[number, number]> = [
      ...front,
      peak,
      ...AutoMovieHumanHairlineSideburn.knots(peak[0]),
      AutoMovieHumanHairlineEarTop.knot(landmarks),
      AutoMovieHumanHairlineEarBehind.knot(landmarks),
      ...AutoMovieHumanHairlineNape.knots(landmarks),
    ];
    // A zone placed past its neighbour's azimuth on an unusual head keeps
    // the order by standing a degree after it.
    const knots: Array<[number, number]> = [];
    for (const [degrees, h] of zones) {
      const last: number = knots.length
        ? knots[knots.length - 1]![0]
        : -Infinity;
      if (degrees >= 180 && last >= 179) continue;
      knots.push([Math.min(180, Math.max(degrees, last + 1)), h]);
    }
    return { knots };
  }

  /**
   * Boundary height above eye level at one azimuth.
   *
   * @param boundary The assembled boundary
   * @param alpha Azimuth from the front (+X) toward +Z, radians
   * @returns Height in millimetres above the eyes' centres
   */
  export function height(boundary: IBoundary, alpha: number): number {
    // Fold the azimuth into [0, 180] degrees: the boundary is symmetric.
    let degrees: number = Math.abs((alpha * 180) / Math.PI) % 360;
    if (degrees > 180) degrees = 360 - degrees;
    return AutoMovieHumanMonotoneCubic.interpolate(boundary.knots, degrees);
  }
}
