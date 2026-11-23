/**
 * Thickness of the subcutaneous fat layer over each region of the body,
 * millimetres, from the skin's underside to the deep fascia, measured
 * uncompressed with the body at rest; both sides take the same values.
 *
 * The thickness of fat over a muscle affects how sharply its borders and
 * grooves show through the skin. Each value is a typical thickness for the
 * region's named site, not a minimum or maximum over it or a muscle-size
 * measurement.
 *
 * Static bounds are envelopes wider than any surveyed person: the largest trunk
 * skinfold among the 481 adults of Durnin and Womersley (1974, Br J Nutr
 * 32(1):77-97, Table 2) was 60 mm, a layer of about 30.
 */
export interface IAutoMovieHumanSubcutaneousFat {
  /**
   * Over the rectus abdominis, beside and below the navel. Schema constraints:
   * Minimum: 0; Maximum: 150; retained by Human's schema refinement.
   */
  abdomen: number;

  /**
   * Over the external oblique, above the iliac crest at the side. Schema
   * constraints: Minimum: 0; Maximum: 150; retained by Human's schema
   * refinement.
   */
  flank: number;

  /**
   * Over the pectoralis major, above any breast. Schema constraints: Minimum:
   * 0; Maximum: 150; retained by Human's schema refinement.
   */
  chest: number;

  /**
   * Over the back below the scapula. Schema constraints: Minimum: 0; Maximum:
   * 150; retained by Human's schema refinement.
   */
  back: number;

  /**
   * Over the biceps brachii at mid upper arm. Schema constraints: Minimum: 0;
   * Maximum: 100; retained by Human's schema refinement.
   */
  upperArmFront: number;

  /**
   * Over the triceps brachii at mid upper arm. Schema constraints: Minimum: 0;
   * Maximum: 100; retained by Human's schema refinement.
   */
  upperArmBack: number;

  /**
   * Over the forearm's muscle bellies below the elbow. Schema constraints:
   * Minimum: 0; Maximum: 100; retained by Human's schema refinement.
   */
  forearm: number;

  /**
   * Over the quadriceps at mid thigh. Schema constraints: Minimum: 0; Maximum:
   * 150; retained by Human's schema refinement.
   */
  thighFront: number;

  /**
   * Over the hamstrings at mid thigh. Schema constraints: Minimum: 0; Maximum:
   * 150; retained by Human's schema refinement.
   */
  thighBack: number;

  /**
   * Over the gastrocnemius at the calf's greatest girth. Schema constraints:
   * Minimum: 0; Maximum: 100; retained by Human's schema refinement.
   */
  calf: number;
}
