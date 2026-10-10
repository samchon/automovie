/**
 * A channel-driven translation of the whole mandible: protrusion, or one side
 * of laterotrusion.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJawTranslation {
  /** The expression channel that drives this translation. */
  channel: string;

  /** Mandibular translation at weight one, in metres. */
  translation: [number, number, number];
}
