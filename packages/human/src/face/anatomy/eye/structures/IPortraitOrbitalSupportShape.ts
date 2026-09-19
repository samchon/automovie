import { IPortraitOrbitalSupportStation } from "./IPortraitOrbitalSupportStation";

/**
 * Optional upper-orbit form, separate from brow fibres and aperture dimensions.
 * Stations state the forehead/brow/sulcus relationship together. Their target
 * movements are solved as one group, so a stationary forehead sample constrains
 * the neighbouring brow instead of silently receiving its summed inflation.
 * Omission of the whole layer keeps the existing head surface.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Defines replaceable upper-orbit form independently of eyebrow fibres and eye aperture dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Groups one-to-32 named section witnesses under one positive millimetre interpolation radius.
 */
export interface IPortraitOrbitalSupportShape {
  /** Positive common interpolation support radius in millimetres. */
  radius: number;

  /** One through 32 independently placed sections; explicit empty is invalid. */
  stations: readonly IPortraitOrbitalSupportStation[];
}
