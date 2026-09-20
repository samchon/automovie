import { IPortraitNasalEnvelopeSection } from "./IPortraitNasalEnvelopeSection";

/**
 * A complete cyclic exterior and vestibular envelope, evaluated after host
 * subdivision. Sections replace as one ordered population. One station is a
 * uniform section; multiple stations allow different alar, sill and columellar
 * shapes. Their values interpolate periodically with zero station derivatives,
 * without overshooting the supplied widths or crest positions.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Authors a connected nasal envelope with distinct local sections and shared skin-to-lining derivatives.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Keeps cyclic section data separate from the per-interval tessellation count and constructs it after general host refinement.
 * @author Samchon
 */
export interface IPortraitNasalEnvelope {
  /** Nonempty, strictly increasing stations, beginning at zero. */
  sections: readonly IPortraitNasalEnvelopeSection[];

  /** Samples per exterior interval and half-vestibule, integer 2..64. */
  segments: number;
}
