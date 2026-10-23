import { tags } from "typia";

/**
 * Tongue position, tip first, then the dorsum. Each value is a fraction of the person's maximal voluntary excursion from the resting tongue (0), signed where the motion has two directions (convention: no physical-unit source was read).
 *
 * Not consumed by the generator yet (deferred to the mouth-geometry task).
 */
export interface IAutoMovieHumanTongueExpression {
  /** Tip elevation toward the alveolar ridge and palate (1), or depression to the floor of the mouth (-1). */
  tipElevation?: number & tags.Minimum<-1> & tags.Maximum<1>;

  /** Tip protrusion past the incisors (1), or retraction into the mouth (-1). */
  tipProtrusion?: number & tags.Minimum<-1> & tags.Maximum<1>;

  /** Tip deviation toward the person's left mouth corner (1) or right (-1). */
  tipLateral?: number & tags.Minimum<-1> & tags.Maximum<1>;

  /** Dorsum height: raised against the palate (1), as for /k/, or lowered (-1), as for an open vowel. */
  dorsumHeight?: number & tags.Minimum<-1> & tags.Maximum<1>;

  /** Dorsum backing toward the pharyngeal wall, from rest (0) to maximum (1), as for back vowels. */
  dorsumBacking?: number & tags.Minimum<0> & tags.Maximum<1>;
}
