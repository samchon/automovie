/**
 * One visible upper-lid tissue station over the ocular-to-skin support bridge.
 * It describes surface shape, not a measured muscle or fat-layer thickness.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates upper-lid transverse placement from anterior tissue relief.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Measures outward offset and signed anterior relief in construction millimetres.
 */
export interface IPortraitUpperLidPoint {
  /** Positive distance from the aperture along its planar outward normal, in mm. */
  offset: number;

  /** Signed anterior relief over the common contact-to-host bridge, in mm. */
  projection: number;
}
