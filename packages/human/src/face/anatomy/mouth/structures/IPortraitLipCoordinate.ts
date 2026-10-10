/**
 * Coordinates within one lip band, independent of a particular mesh's IDs.
 *
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
