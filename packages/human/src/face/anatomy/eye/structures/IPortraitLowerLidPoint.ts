/**
 * A point in the lower lid's transverse section. Offset runs outward from the
 * aperture in its local image-plane normal; projection is signed anterior
 * relief over the common globe-to-skin depth bridge. Both use millimetres.
 * These describe visible tissue, not measured muscle thickness.
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names lower-lid tissue offsets separately from anterior surface relief.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries millimetre distance from the wet aperture and signed projection over the common depth bridge.
 */
export interface IPortraitLowerLidPoint {
  /** Positive distance from the aperture, in millimetres. */
  offset: number;

  /** Signed anterior relief relative to the section's support bridge, in mm. */
  projection: number;
}
