/**
 * Physical exterior skin section around one fitted nasal aperture, in mm.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates exterior nostril tissue width and crest relief from aperture position.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines a positive millimetre skin-band width and signed crest projection around the fitted nasal opening.
 * @author Samchon
 */
export interface IPortraitNasalRimSection {
  /** Positive width from the aperture to the surrounding skin attachment. */
  width: number;
  /** Signed crest projection along the outward aperture normal, in mm. */
  crest: number;
}
