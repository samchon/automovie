import { IPortraitNasalEnvelopeSection } from "./IPortraitNasalEnvelopeSection";

/**
 * A complete cyclic exterior and vestibular envelope, evaluated after host
 * subdivision. Sections replace as one ordered population. One station is a
 * uniform section; multiple stations allow different alar, sill and columellar
 * shapes. Their values interpolate periodically with zero station derivatives,
 * without overshooting the supplied widths or crest positions.
 *
 * @author Samchon
 */
export interface IPortraitNasalEnvelope {
  /** Nonempty, strictly increasing stations, beginning at zero. */
  sections: readonly IPortraitNasalEnvelopeSection[];

  /** Samples per exterior interval and half-vestibule, integer 2..64. */
  segments: number;
}
