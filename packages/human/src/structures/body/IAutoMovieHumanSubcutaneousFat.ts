import { tags } from "typia";

/**
 * Thickness of the subcutaneous fat layer over each region of the body, millimetres, from the skin's underside to the deep fascia, measured uncompressed with the body at rest; both sides take the same values.
 *
 * The thickness of fat over a muscle affects how sharply its borders and grooves show through the skin. Each value is a typical thickness for the region's named site, not a minimum or maximum over it or a muscle-size measurement.
 *
 * Static bounds are envelopes wider than any surveyed person: the largest trunk skinfold among the 481 adults of Durnin and Womersley (1974, Br J Nutr 32(1):77-97, Table 2) was 60 mm, a layer of about 30.
 */
export interface IAutoMovieHumanSubcutaneousFat {
  /** Over the rectus abdominis, beside and below the navel. */
  abdomen: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Over the external oblique, above the iliac crest at the side. */
  flank: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Over the pectoralis major, above any breast. */
  chest: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Over the back below the scapula. */
  back: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Over the biceps brachii at mid upper arm. */
  upperArmFront: number & tags.Minimum<0> & tags.Maximum<100>;

  /** Over the triceps brachii at mid upper arm. */
  upperArmBack: number & tags.Minimum<0> & tags.Maximum<100>;

  /** Over the forearm's muscle bellies below the elbow. */
  forearm: number & tags.Minimum<0> & tags.Maximum<100>;

  /** Over the quadriceps at mid thigh. */
  thighFront: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Over the hamstrings at mid thigh. */
  thighBack: number & tags.Minimum<0> & tags.Maximum<150>;

  /** Over the gastrocnemius at the calf's greatest girth. */
  calf: number & tags.Minimum<0> & tags.Maximum<100>;
}
