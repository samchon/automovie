import { tags } from "typia";

import type { IAutoMovieHumanPair } from "../common/IAutoMovieHumanPair";

/**
 * Lip and cheek action units used in speech, as intensities from rest (0) to maximum (1), FACS letter grades A to E at about 0.2, 0.4, 0.6, 0.8 and 1 (Ekman and Friesen 1978, FACS). Upper lip first, then the mouth corners, the lower lip and whole-mouth shapes. Units that act on one side separately take a left and right value, the person's own sides.
 *
 * Not consumed by the generator yet (deferred to the mouth-geometry task).
 */
export interface IAutoMovieHumanLipExpression {
  /** AU10, levator labii superioris: the upper lip rises. */
  upperLipRaiser?: IAutoMovieHumanPair<
    number & tags.Minimum<0> & tags.Maximum<1>
  >;

  /** AU12, zygomaticus major: the mouth corner pulls up and back. */
  lipCornerPuller?: IAutoMovieHumanPair<
    number & tags.Minimum<0> & tags.Maximum<1>
  >;

  /** AU15, depressor anguli oris: the mouth corner lowers. */
  lipCornerDepressor?: IAutoMovieHumanPair<
    number & tags.Minimum<0> & tags.Maximum<1>
  >;

  /** AU20, risorius with platysma: the mouth corner stretches sideways. */
  lipStretcher?: IAutoMovieHumanPair<
    number & tags.Minimum<0> & tags.Maximum<1>
  >;

  /** AU16, depressor labii inferioris: the lower lip lowers. */
  lowerLipDepressor?: IAutoMovieHumanPair<
    number & tags.Minimum<0> & tags.Maximum<1>
  >;

  /** AU18, incisivus labii: the lips push forward and gather (pucker). */
  lipPucker?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** AU22, orbicularis oris: the lips funnel outward. */
  lipFunneler?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** AU23, orbicularis oris: the lips tighten and thin. */
  lipTightener?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** AU24, orbicularis oris: the lips press together. */
  lipPressor?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** AU25: the lips part, without requiring the jaw to drop. */
  lipsPart?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** AU28, orbicularis oris: the lips are sucked in over the teeth. */
  lipSuck?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** AU34, cheek puff: air inflates the cheeks with the lips closed. */
  cheekPuff?: number & tags.Minimum<0> & tags.Maximum<1>;
}
