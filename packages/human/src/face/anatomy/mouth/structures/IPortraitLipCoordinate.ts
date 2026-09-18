/**
 * Coordinates within one lip band, independent of a particular mesh's IDs.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Locates vermilion relief within the upper or lower lip independently of mesh vertex IDs.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Names anatomical transverse progress and cutaneous-to-oral depth within a curved lip band.
 * @author Samchon
 */
export interface IPortraitLipCoordinate {
  /** Upper or lower vermilion band; independent of anatomical left/right. */
  side: "upper" | "lower";

  /** -1 at the anatomical right inner corner, +1 at the left. */
  lateral: number;

  /** Zero at the cutaneous border, one at the oral aperture. */
  across: number;
}
