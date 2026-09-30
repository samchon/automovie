import { Vector3 } from "@automovie/engine";

/**
 * Centre and scale a nostril rim's millimetre points for plane and ellipse
 * fitting.
 *
 * `scale` is the largest absolute coordinate (1 when every coordinate is zero),
 * `normalized` the points divided by it, `center` their mean and `local` the
 * centred vectors. Shared by `fitPortraitNostrilRim` and
 * `resizePortraitNostrilRim` so both fit on the same basis.
 *
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
