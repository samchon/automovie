/**
 * Craniofacial proportions on named anatomical supports of the version-one
 * landmark basis. They alter the common host before any attached part is built,
 * not a finished eyeball or an unrelated arbitrary displacement field.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Owns facial proportions, temporal breadth and mandibular/chin form.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Shares the changed facial foundation with all anatomical attachments.
 * @author Samchon
 */
export interface IPortraitFacialFrameShape {
  /** Transverse facial scale about the nasion, in [0.7,1.3]; default 1. */
  widthScale?: number;
  /** Vertical facial scale about the nasion, in [0.7,1.3]; default 1. */
  lengthScale?: number;
  /** Signed lateral mandibular-angle displacement in [-8,8] mm; positive widens. */
  jawWidth?: number;
  /** Gnathion inferior displacement in [-8,8] mm; positive lengthens the chin. */
  chinHeight?: number;
  /** Pogonion anterior displacement in [-8,8] mm; positive advances the chin. */
  chinProjection?: number;
  /** Frontal midline anterior displacement in [-8,8] mm; positive advances the forehead. */
  foreheadProjection?: number;
  /**
   * Superior-orbit foundation depth in [-8,8] mm; positive advances and negative
   * recesses both brow supports before fitting the eyes. Zero preserves the
   * original foundation. The optical aperture stays outside this support.
   */
  browProjection?: number;
  /** Signed lateral temporal displacement in [-8,8] mm; positive widens both temples. */
  templeWidth?: number;
}
