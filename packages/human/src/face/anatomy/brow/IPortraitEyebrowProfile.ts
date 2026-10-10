import type { IPortraitEyebrowFlowPattern } from "./IPortraitEyebrowFlowPattern";
import { IPortraitEyebrowFlowProfile } from "./IPortraitEyebrowFlowProfile";

/**
 * Fibre dimensions on the final forehead surface. Lengths use millimetres;
 * clearance is measured beyond the fibre radius along the local surface normal.
 * The width and location of the brow belong to its separate boundary binding.
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

  /**
   * Optional initial centreline angle to the supporting native skin facet,
   * in [0,90) degrees. With unpitched surface-course length L, the connected
   * builder advances actual course distance L*t*cos(angle) and adds outward
   * rise L*t*sin(angle). Its C1 taper, arch and normal field have zero root
   * derivatives, preserving this angle in the complete analytic centreline.
   * L remains a derived course length, not an authored or measured total shaft
   * length. The emitted finite lattice approximates the initial tangent.
   * Omission is zero, a centreline initially tangent to its facet. Consumed by
   * the connected face's skin-seated shaft builder; the procedural portrait
   * builder ignores it. An authored convention: no emergence angle of brow
   * hair was read from a primary measurement.
   */
  emergenceDegrees?: number;

  /** Signed millimetre bend of the authored free guide along the band's lateral tangent. Anatomical side supplies direction; chart lifting can change the final surface-tip displacement. */
  outwardBend: number;

  /** Integral longitudinal segment count, from 1 through 32. */
  segments: number;

  /** Optional minimum/maximum root position across the brow, lower zero to upper one; defaults to [0.1,0.22]. This is the tuple spelling existing documents carry; a new document states `rootLower` and `rootUpper`, and stating both spellings refuses. */
  rootBand?: readonly [number, number];

  /** Optional cross-brow fibre span in [0,1]; without flow it cannot exceed one minus the maximum root. Omission uses 0.26 to 0.34 along the brow. */
  span?: number;

  /** Optional medial/lateral density fade lengths as fractions of the brow arc, each in [0,0.5]. Omission retains every fibre. */
  endFade?: readonly [number, number];

  /** Optional unsigned 32-bit density seed. Presence selects thinning independent of root height; omission preserves the original coupled population for numerical replay. */
  densitySeed?: number;

  /** Optional complete longitudinal/cross-root flow; replaces span and outwardBend for emitted fibres. */
  flow?: IPortraitEyebrowFlowProfile;

  /** Lowest root position across the band, in [0,1] from the lower boundary; the named spelling of `rootBand[0]`. Omitted with `rootUpper` present, it is 0.1. */
  rootLower?: number;

  /** Highest root position across the band, in [rootLower,1]; the named spelling of `rootBand[1]`. Omitted with `rootLower` present, it is 0.22. */
  rootUpper?: number;

  /** Length of the medial end over which the population thins, as a fraction of the brow in [0,0.5]; the named spelling of `endFade[0]`. */
  medialFade?: number;

  /** Length of the lateral end over which the population thins, as a fraction of the brow in [0,0.5]; the named spelling of `endFade[1]`. */
  lateralFade?: number;

  /** The brow's grain in four numbers; replaces span and outwardBend for emitted fibres, and is the authoring spelling of `flow`. */
  grain?: IPortraitEyebrowFlowPattern;
}
