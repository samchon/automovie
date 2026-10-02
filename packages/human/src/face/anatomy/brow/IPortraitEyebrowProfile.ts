import { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

/**
 * Fibre dimensions on the final forehead surface. Lengths use millimetres;
 * clearance is measured beyond the fibre radius along the local surface normal.
 * The width and location of the brow belong to its separate boundary binding.
 *
 * @evidence contracts/common.md#principled-implementation The record holds what the fibre builder reads to trace and thicken one hair: radius with a three-fibre variation and a tip taper, clearance and arch off the skin, a sideways bend, a segment count, and the optional root band, span, end fades, density seed and flow that place and shape the population. Each field states its bound and the dependencies between them (a span limited by the root band when no flow is present).
 * @evidence contracts/common.md#clear-and-simple-design A flat record with one validating owner, `assertPortraitEyebrowProfile`; the optional fields are documented as replacements or omissions so no two fields control the same effect without saying which wins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit, interval and what omission means, and the record states where the brow width and location live.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres on the final forehead surface, clearance is measured beyond the fibre radius along the local surface normal, and fractions of the brow are dimensionless, as the record and its fields state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes a fibre population and defines no part or group; `buildPortraitEyebrow` names the fibres.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive; the fibre count is an argument of the builder.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 *
 * @author Samchon
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
