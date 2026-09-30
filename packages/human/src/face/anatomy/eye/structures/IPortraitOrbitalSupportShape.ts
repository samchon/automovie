import { IPortraitOrbitalSupportStation } from "./IPortraitOrbitalSupportStation";

/**
 * Optional upper-orbit form, separate from brow fibres and aperture dimensions.
 * Stations state the forehead/brow/sulcus relationship together. Their target
 * movements are solved as one group, so a stationary forehead sample constrains
 * the neighbouring brow instead of silently receiving its summed inflation.
 * Omission of the whole layer keeps the existing head surface.
 *
 * @evidence contracts/common.md#principled-implementation A common support radius and one to 32 independently placed sections are what the control layer needs to solve a smooth group displacement; solving the stations together is what keeps a stationary neighbour from receiving a summed inflation.
 * @evidence contracts/common.md#clear-and-simple-design One radius and one list of stations, validated and consumed by one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation The record states that the layer is optional and separate from brow fibres and aperture dimensions, why stations are solved together, the station count and that omission keeps the existing head surface.
 * @evidence contracts/modeling.md#spatial-conventions The radius is a positive millimetre length and the stations state their own millimetre distances in the head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes a displacement layer over existing skin and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 *
 * @author Samchon
 */
export interface IPortraitOrbitalSupportShape {
  /** Positive common interpolation support radius in millimetres. */
  radius: number;

  /** One through 32 independently placed sections; explicit empty is invalid. */
  stations: readonly IPortraitOrbitalSupportStation[];
}
