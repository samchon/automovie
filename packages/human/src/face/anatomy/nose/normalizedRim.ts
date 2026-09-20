import { Vector3 } from "@automovie/engine";

/**
 * Shared by resizePortraitNostrilRim, fitPortraitNostrilRim, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Changes nostril width and height independently of whole-nose dimensions and opening rotation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Scales the aperture in its own normalized plane while retaining normal residuals and copying unit-scale inputs exactly.
 * @author Samchon
 */
// Both ellipse fitting and aperture sizing use this same centred, normalized
// basis. Products of millimetre coordinates must not overflow while finding a
// plane. Callers validate point shape before entering this calculation.
export const normalizedRim = (points: number[][]) => {
  const scale = Math.max(...points.flat().map(Math.abs)) || 1;
  const normalized = points.map((point) => point.map((value) => value / scale));
  const center = [0, 1, 2].map(
    (axis) =>
      normalized.reduce((sum, point) => sum + point[axis], 0) / points.length,
  );
  const local = normalized.map((point) =>
    Vector3.create(
      point[0] - center[0],
      point[1] - center[1],
      point[2] - center[2],
    ),
  );
  return { scale, normalized, center, local };
};
