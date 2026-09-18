import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Oral aperture performance in millimetres, independent of vermilion thickness.
 * The observed separation calibrates the complete observed aperture profile;
 * zero current separation closes both rims onto one paired three-dimensional seam.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Separates oral opening from the identity lip sections and crown dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Evaluates neutral closure relative to the authored observed aperture.
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
