import { IPortraitOrbitalSupportStation } from "./IPortraitOrbitalSupportStation";

/**
 * Optional upper-orbit form, separate from brow fibres and aperture dimensions.
 * Stations state the forehead/brow/sulcus relationship together. Their target
 * movements are solved as one group, so a stationary forehead sample constrains
 * the neighbouring brow instead of silently receiving its summed inflation.
 * Omission of the whole layer keeps the existing head surface.
 * @author Samchon
 */
export interface IPortraitOrbitalSupportShape {
  /** Positive common interpolation support radius in millimetres. */
  radius: number;

  /** One through 32 independently placed sections; explicit empty is invalid. */
  stations: readonly IPortraitOrbitalSupportStation[];
}
