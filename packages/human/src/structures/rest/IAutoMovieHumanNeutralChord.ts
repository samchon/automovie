/** A measured support-to-support mechanical chord.
 */
export interface IAutoMovieHumanNeutralChord {
  /** Positive Euclidean support-to-support distance, mm. */
  lengthMm: number;

  /** Mechanical azimuth from +X toward +Z, degrees in [-180,180]. */
  azimuthDegrees: number;

  /** Mechanical elevation above the XZ plane, degrees in [-90,90]. */
  elevationDegrees: number;
}
