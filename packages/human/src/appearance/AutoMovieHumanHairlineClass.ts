import { AutoMovieHumanHairline } from "../typings/AutoMovieHumanHairline";

/**
 * The five frontal hairline classes' contours between the midline and the
 * frontotemporal apex, as shape data shared by the frontal pieces
 * (`AutoMovieHumanHairlineTrichion`, `AutoMovieHumanHairlineFrontalLine`,
 * `AutoMovieHumanHairlineApex`): heights as shares of the class's midline
 * height above the eyes, azimuths as degrees the apex's place scales
 * (`AutoMovieHumanHairlineApex.scale`).
 *
 * The classes follow the definitions of Zhang 2026 (after Suzan et al.) in
 * `docs/anatomy/hair.md`: round a smooth concave arc; rectangular level to a
 * sharp corner; M-shaped raised toward a recession; bell-shaped a dome nearly
 * level over the central forehead; triangular descending nearly straight to
 * the temples. The knots are conventions of this prototype between the two
 * sourced ends (the midline height and the apex's place), the earlier
 * head-share knots divided by each class's midline share (round 0.33, 0.31,
 * 0.26 at 0, 30 and 50 degrees, and so on) so only their shape remains.
 */
export namespace AutoMovieHumanHairlineClass {
  /** One class's shape between the midline and its apex. */
  export interface IShape {
    /** `[azimuth degrees, share of the midline height]`, the first at 0. */
    knots: Array<[number, number]>;

    /** Index of the knot on the exocanthion's sagittal plane. */
    apex: number;
  }

  /**
   * A class's shape.
   *
   * @param hairline Frontal hairline class
   * @returns Its shape
   */
  export function shape(hairline: AutoMovieHumanHairline): IShape {
    return SHAPE[hairline];
  }
}

/** Class shapes (conventions, see the namespace). */
const SHAPE: Record<
  AutoMovieHumanHairline,
  AutoMovieHumanHairlineClass.IShape
> = {
  [AutoMovieHumanHairline.Round]: {
    knots: [
      [0, 1],
      [30, 0.31 / 0.33],
      [50, 0.26 / 0.33],
    ],
    apex: 2,
  },
  [AutoMovieHumanHairline.Rectangular]: {
    knots: [
      [0, 1],
      [30, 1],
      [44, 0.3 / 0.31],
      [52, 0.24 / 0.31],
    ],
    apex: 2,
  },
  [AutoMovieHumanHairline.MShaped]: {
    knots: [
      [0, 1],
      [22, 0.36 / 0.33],
      [36, 0.41 / 0.33],
      [50, 0.3 / 0.33],
    ],
    apex: 2,
  },
  [AutoMovieHumanHairline.BellShaped]: {
    knots: [
      [0, 1],
      [16, 0.365 / 0.37],
      [32, 0.33 / 0.37],
      [46, 0.28 / 0.37],
      [56, 0.23 / 0.37],
    ],
    apex: 4,
  },
  [AutoMovieHumanHairline.Triangular]: {
    knots: [
      [0, 1],
      [25, 0.32 / 0.38],
      [50, 0.25 / 0.38],
    ],
    apex: 2,
  },
};
