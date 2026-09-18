import { IPortraitNasalSectionStation } from "./IPortraitNasalSectionStation";

/**
 * A connected lower-nasal shape in a translated head frame: +X anatomical left,
 * +Y up and +Z anterior. Transverse poles and station heights use millimetres;
 * depths are absolute positions relative to the same socket datum, not added
 * Gaussian projections. Left and right poles may carry different depths.
 *
 * The clamped tensor-product cubic B-spline is C2 inside its domain. Its
 * nonnegative partition-of-unity weights keep the loft inside its control
 * depth hull. Control counts are bounded at 64 per axis so fitting one source
 * point never evaluates more than 4096 authored scalar controls.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Supplies an asymmetric connected nasal depth basis rather than a collection of independent bumps.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines bounded tensor-product cubic control arrays, a physical edge join and an explicit host-to-loft influence.
 */
export interface IPortraitNasalSection {
  /** Four through 64 strictly increasing local-X control positions, in mm. */
  transverse: readonly number[];

  /** Four through 64 strictly increasing local-Y transverse control curves. */
  stations: readonly IPortraitNasalSectionStation[];

  /**
   * Positive width of the identity transition at each rectangular domain edge,
   * in mm, no greater than half either domain span. A quintic blend has zero
   * first and second derivatives at the outside join and interior plateau.
   */
  joinWidth: number;

  /** Blend from the supplied host to the local loft, in [0,1]; zero is exact identity. */
  influence: number;
}
