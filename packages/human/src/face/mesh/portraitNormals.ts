import { Vector3 } from "@automovie/engine";
import { p } from "./p";

/**
 * Area-weighted normals over shared triangle vertices. Compute these before
 * separating skin and lip material groups so their colour boundary cannot
 * introduce a lighting seam. An unused vertex retains the engine's zero normal.
 * Unrepresentable accumulated areas refuse before normalization can emit NaN.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Keeps adjoining skin and vermilion on one normal field before material separation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Accumulates oriented triangle areas at shared vertices and normalizes their sums, retaining zero at unused vertices.
 */
export const portraitNormals = (
  positions: number[],
  indices: number[],
): number[] => {
  const normals = new Array<number>(positions.length).fill(0);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3,
      b = indices[i + 1] * 3,
      c = indices[i + 2] * 3;
    const ab = p(
      positions[b] - positions[a],
      positions[b + 1] - positions[a + 1],
      positions[b + 2] - positions[a + 2],
    );
    const ac = p(
      positions[c] - positions[a],
      positions[c + 1] - positions[a + 1],
      positions[c + 2] - positions[a + 2],
    );
    const normal = Vector3.cross(ab, ac);
    for (let corner = 0; corner < 3; corner++) {
      const at = indices[i + corner] * 3;
      normals[at] += normal.x;
      normals[at + 1] += normal.y;
      normals[at + 2] += normal.z;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    if (
      !Number.isFinite(normals[i]) ||
      !Number.isFinite(normals[i + 1]) ||
      !Number.isFinite(normals[i + 2])
    )
      throw new Error("Portrait normals require finite accumulated areas.");
    const normal = Vector3.normalize(
      p(normals[i], normals[i + 1], normals[i + 2]),
    );
    normals[i] = normal.x;
    normals[i + 1] = normal.y;
    normals[i + 2] = normal.z;
  }
  return normals;
};
