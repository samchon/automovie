/**
 * The profile of a malleolus's relief window: the bump's height net.
 *
 * A malleolus moves skin outward along the foot's lateral (or medial)
 * direction by a bump of the named prominence over a window of
 * {@link WINDOW} radii either side of its centre. The net is a 9 by 9 grid of
 * the product of a one-dimensional profile `[0, 0, 0, 0.6, 1, 0.6, 0, 0, 0]`
 * whose three outer values on each side are zero, so the window's height,
 * slope and curvature vanish at its edge (a C2 edge) and the relief needs no
 * seam. The profile's peak after the loft's cubic interpolation of the net is
 * {@link PEAK} of its centre value, so the gain that gives a stated
 * prominence is the prominence over {@link PEAK}.
 */
export namespace AutoMovieHumanFootMalleolusBump {
  /** A window's half reach, in malleolus radii. Convention. */
  export const WINDOW: number = 1.6;

  /** A relief window's net. */
  export interface IBump {
    /** Rows of the net. */
    rows: number;

    /** Columns of the net. */
    columns: number;

    /** Heights over the window, row by row, mm. */
    heights: number[];
  }

  /**
   * The net of a bump of a stated prominence.
   *
   * @param prominence The bump's greatest height, mm.
   */
  export function of(prominence: number): IBump {
    const gain: number = prominence / PEAK;

    return {
      rows: PROFILE.length,
      columns: PROFILE.length,
      heights: PROFILE.flatMap((r: number): number[] => PROFILE.map((c: number): number => gain * r * c)),
    };
  }
}

/** The one-dimensional profile of the net: three outer zeros each side. Convention. */
const PROFILE: readonly number[] = [0, 0, 0, 0.6, 1, 0.6, 0, 0, 0];

/** The bump's peak after interpolation, over its centre value: measured on the loft's cubic over this profile. */
const PEAK: number = 0.75;
