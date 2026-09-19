/**
 * A position and physical first derivative on a millimetre-valued section.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Gives adjacent nasal skin and lining sections one shared position-and-tangent boundary.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries head-frame XYZ and its unnormalized derivative with respect to physical millimetre section distance.
 * @author Samchon
 */
export interface IPortraitNasalJet {
  /** XYZ in the common head frame, in mm. */
  point: readonly number[];

  /** dXYZ/ds for physical section distance s in mm; this is not normalized. */
  derivative: readonly number[];
}
