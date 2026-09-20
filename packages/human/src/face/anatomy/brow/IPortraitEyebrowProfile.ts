import { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

/**
 * Fibre dimensions on the final forehead surface. Lengths use millimetres;
 * clearance is measured beyond the fibre radius along the local surface normal.
 * The width and location of the brow belong to its separate boundary binding.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates brow fibre dimensions and distribution from the underlying orbital skin form.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines millimetre strand radius, clearance and bend with bounded sampling, cross-brow root span and endpoint density fades.
 */
export interface IPortraitEyebrowProfile {
  /** Optional skin-following ribbon instead of an eight-sided tube; omission preserves tube geometry. */
  representation?: "ribbon";
  /** Positive base fibre radius. */
  radius: number;
  /** Nonnegative radius increment for the deterministic three-fibre variation. */
  radiusStep: number;
  /** Fraction of radius lost towards the tip, in [0,1). */
  taper: number;
  /** Nonnegative clearance beyond the fibre radius. */
  clearance: number;
  /** Nonnegative mid-fibre arch above the surface. */
  arch: number;
  /** Signed outward bending distance; anatomical side supplies its direction. */
  outwardBend: number;
  /** Integral longitudinal segment count, from 1 through 32. */
  segments: number;
  /** Optional minimum/maximum root position across the brow, lower zero to upper one; defaults to [0.1,0.22]. */
  rootBand?: readonly [number, number];
  /** Optional cross-brow fibre span in [0,1]; without flow it cannot exceed one minus the maximum root. Omission uses 0.26 to 0.34 along the brow. */
  span?: number;
  /** Optional medial/lateral density fade lengths as fractions of the brow arc, each in [0,0.5]. Omission retains every fibre. */
  endFade?: readonly [number, number];
  /** Optional unsigned 32-bit density seed. Presence selects thinning independent of root height; omission preserves the original coupled population for numerical replay. */
  densitySeed?: number;
  /** Optional complete longitudinal/cross-root flow; replaces span and outwardBend for emitted fibres. */
  flow?: IPortraitEyebrowFlowProfile;
}
