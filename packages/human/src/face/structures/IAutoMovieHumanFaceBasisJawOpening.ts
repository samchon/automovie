/**
 * The jaw opening: the channel that drives it, the rotation it reaches at
 * weight one and the mandibular translation coupled linearly with the angle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJawOpening {
  /** The expression channel that opens the jaw. */
  channel: string;

  /** Rotation at weight one, in degrees. */
  degrees: number;

  /** Mandibular translation at weight one, in metres, coupled linearly with the angle. */
  translation: [number, number, number];
}
