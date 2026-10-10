/**
 * One visible upper-lid tissue station over the ocular-to-skin support bridge.
 * It describes surface shape, not a measured muscle or fat-layer thickness.
 *
 * @author Samchon
 */
export interface IPortraitUpperLidPoint {
  /** Positive distance from the aperture along its planar outward normal, in mm. */
  offset: number;

  /** Signed anterior relief over the common contact-to-host bridge, in mm. */
  projection: number;
}
