import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Kinematic oral performance in portrait millimetres, with observed/current aperture, independent mandibular hinge rotation and optional smile/pucker. Zero current aperture closes the pre-jaw paired margins; an independently open current jaw can still separate the final posed rims. The retained numeric envelopes are construction policies rather than measured physiological capacity.
 *
 * @evidence contracts/common.md#principled-implementation Observed/current lip separation and optional hinge, smile and pucker distinguish source pose from requested kinematic pose.
 * @evidence contracts/common.md#clear-and-simple-design createPortraitMouthPerformance transports paired margins and surrounding band displacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical envelopes are authoring conventions, not physiological limits; zero aperture is before any independent current jaw rotation.
 * @evidence contracts/common.md#meaningful-documentation Distances are millimetres, hinge motion degrees and pucker's six-percent coupling is the retained construction formula.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Margin preparation and displaced point work occur in the performance owner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One resolved source/posed pair serves both returned rims and band sampling.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns inputs while the producer clones settings and curves retained by its move closure.
 *
 * @author Samchon
 */
export interface IPortraitMouthPerformance {
  /** Current central lip separation in [0,30] mm, before mandibular rotation. */
  lipPart: number;

  /** Central separation represented by the basis in [0,30] mm. Zero requires a coincident observed seam. */
  observedLipPart: number;

  /** Optional observed/current mandibular rotation about an authored transverse hinge. Omission is a stationary jaw. */
  jaw?: {
    /** Hinge centre in head-frame millimetres; the hinge axis is +X. */
    hinge: IAutoMovieVector3;

    /** Current inferior opening in [0,25] degrees. */
    current: number;

    /** Inferior opening already in the observed lower lip, in [0,25] degrees. */
    observed: number;
  };

  /** Optional signed changes in commissure elevation, in [-13,13] mm; zero preserves the observed smile. */
  smile?: { right: number; left: number };

  /** Optional observed/current protrusion in [0,4] mm, coupled to six percent narrowing per millimetre. */
  pucker?: { current: number; observed: number };
}
