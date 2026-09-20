import type { Point } from "./structures/Point";

/**
 * Construct one point in the shared millimetre coordinate frame.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Provides the shared head-frame point values consumed by anatomical part builders.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Constructs an XYZ vector without changing its caller-owned millimetre coordinates.
 * @author Samchon
 */
export const portraitPoint = (x: number, y: number, z: number): Point => ({
  x,
  y,
  z,
});
