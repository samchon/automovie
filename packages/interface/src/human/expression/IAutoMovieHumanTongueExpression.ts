/**
 * Tongue position, tip first, then the dorsum. Each value is a fraction of the
 * person's maximal voluntary excursion from the resting tongue (0), signed
 * where the motion has two directions (convention: no physical-unit source was
 * read).
 *
 * The tip and the dorsum travel toward the anatomical contact each motion
 * makes: elevation to the alveolar ridge behind the upper incisors, protrusion
 * past the incisors, the dorsum to the palate
 * (`AutoMovieHumanMouthDeformation`), with the jaw's opening taken out so a
 * contact stays one when the mouth opens.
 */
export interface IAutoMovieHumanTongueExpression {
  /**
   * Tip elevation toward the alveolar ridge and palate (1), or depression to
   * the floor of the mouth (-1). Schema constraints: Minimum: -1; Maximum: 1;
   * retained by Human's schema refinement.
   */
  tipElevation?: number;

  /**
   * Tip protrusion past the incisors (1), or retraction into the mouth (-1).
   * Schema constraints: Minimum: -1; Maximum: 1; retained by Human's schema
   * refinement.
   */
  tipProtrusion?: number;

  /**
   * Tip deviation toward the person's left mouth corner (1) or right (-1).
   * Schema constraints: Minimum: -1; Maximum: 1; retained by Human's schema
   * refinement.
   */
  tipLateral?: number;

  /**
   * Dorsum height: raised against the palate (1), as for /k/, or lowered (-1),
   * as for an open vowel. Schema constraints: Minimum: -1; Maximum: 1; retained
   * by Human's schema refinement.
   */
  dorsumHeight?: number;

  /**
   * Dorsum backing toward the pharyngeal wall, from rest (0) to maximum (1), as
   * for back vowels. Schema constraints: Minimum: 0; Maximum: 1; retained by
   * Human's schema refinement.
   */
  dorsumBacking?: number;
}
