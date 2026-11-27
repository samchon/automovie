import type { IAutoMovieHumanPair } from "./IAutoMovieHumanPair";

/**
 * Lip and cheek action units used in speech, as intensities from rest (0) to
 * maximum (1), FACS letter grades A to E at about 0.2, 0.4, 0.6, 0.8 and 1
 * (Ekman and Friesen 1978, FACS). Upper lip first, then the mouth corners, the
 * lower lip and whole-mouth shapes. Units that act on one side separately take
 * a left and right value, the person's own sides.
 *
 * `AutoMovieHumanMouthExpression` resolves each into the rule displacements of
 * `AutoMovieHumanMouthDeformation`. The skin is open along the lips' contact
 * line, so lips that part do not stretch across it.
 */
export interface IAutoMovieHumanLipExpression {
  /**
   * AU10, levator labii superioris: the upper lip rises. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  upperLipRaiser?: IAutoMovieHumanPair<number>;

  /**
   * AU12, zygomaticus major: the mouth corner pulls up and back. Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  lipCornerPuller?: IAutoMovieHumanPair<number>;

  /**
   * AU15, depressor anguli oris: the mouth corner lowers. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  lipCornerDepressor?: IAutoMovieHumanPair<number>;

  /**
   * AU20, risorius with platysma: the mouth corner stretches sideways. Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  lipStretcher?: IAutoMovieHumanPair<number>;

  /**
   * AU16, depressor labii inferioris: the lower lip lowers. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  lowerLipDepressor?: IAutoMovieHumanPair<number>;

  /**
   * AU17, mentalis: the chin's skin and the lower lip push up, as when the
   * lower lip meets the upper teeth for /f/. Schema constraints: Minimum: 0;
   * Maximum: 1; retained by Human's schema refinement.
   */
  chinRaiser?: number;

  /**
   * AU18, incisivus labii: the lips push forward and gather (pucker). Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  lipPucker?: number;

  /**
   * AU22, orbicularis oris: the lips funnel outward. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  lipFunneler?: number;

  /**
   * AU23, orbicularis oris: the lips tighten and thin. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  lipTightener?: number;

  /**
   * AU24, orbicularis oris: the lips press together. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  lipPressor?: number;

  /**
   * AU25: the lips part, without requiring the jaw to drop. Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  lipsPart?: number;

  /**
   * AU28, orbicularis oris: the lips are sucked in over the teeth. Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  lipSuck?: number;

  /**
   * AU34, cheek puff: air inflates the cheeks with the lips closed. Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  cheekPuff?: number;
}
