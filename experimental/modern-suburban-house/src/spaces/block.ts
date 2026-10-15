import { transformAutoMovieMesh, tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Axis-aligned box between two world corners.
 */

export const block = (
  min: readonly [number, number, number],
  max: readonly [number, number, number]
): IAutoMovieMesh => {
  const [width, height, depth] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];
  if (!(width > 0 && height > 0 && depth > 0))
    throw new Error(
      `block needs positive extents, got ${width} × ${height} × ${depth}`
    );
  return transformAutoMovieMesh(
    tessellateToMesh({ type: "box", width, height, depth }),
    {
      translation: {
        x: (min[0] + max[0]) / 2,
        y: (min[1] + max[1]) / 2,
        z: (min[2] + max[2]) / 2,
      },
    }
  );
};
