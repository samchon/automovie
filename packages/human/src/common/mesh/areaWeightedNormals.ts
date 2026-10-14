import { Vector3 } from "@automovie/engine";

import { HumanMeshNormalDomainError } from "./HumanMeshNormalDomainError";

/**
 * Area-weighted normals over shared triangle vertices. Compute these before
 * separating skin and lip material groups so their colour boundary cannot
 * introduce a lighting seam. An unused vertex retains the engine's zero normal.
 * Unrepresentable accumulated areas refuse before normalization can emit NaN.
 *
 * @evidence contracts/common.md#principled-implementation Triangle cross products accumulate at shared vertices and the engine normalizes each sum; unused vertices retain zero and nonfinite accumulated areas throw the domain Error. Valid indexed triangles are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design One shared producer runs before material separation so colour boundaries do not independently redefine shading normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected direction, specimen winding or artificial rescue replaces nonfinite source areas; the existing zero-sum engine behavior remains.
 * @evidence contracts/common.md#meaningful-documentation The comment gives area weighting, boundary timing, unused zero normals and nonfinite refusal.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T triangles, accumulation/normalization cost O(V+T) time and O(V) output storage; every incident face contributes once.
 * @evidence contracts/performance.md#reuse-equivalent-work One accumulated field serves shared vertices, with no identity cache assuming positions/indices stayed unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The normal array transfers to its caller and face/vector temporaries expire on return/throw, without retained handles or tasks.
 */
export const areaWeightedNormals: (
  positions: number[],
  indices: number[],
) => number[] = (positions: number[], indices: number[]): number[] => {
  const normals: number[] = new Array<number>(positions.length).fill(0);
  for (let i: number = 0; i < indices.length; i += 3) {
    const a: number = indices[i] * 3;
    const b: number = indices[i + 1] * 3;
    const c: number = indices[i + 2] * 3;
    const ab: ReturnType<typeof Vector3.create> = Vector3.create(
      positions[b] - positions[a],
      positions[b + 1] - positions[a + 1],
      positions[b + 2] - positions[a + 2],
    );
    const ac: ReturnType<typeof Vector3.create> = Vector3.create(
      positions[c] - positions[a],
      positions[c + 1] - positions[a + 1],
      positions[c + 2] - positions[a + 2],
    );
    const normal: ReturnType<typeof Vector3.create> = Vector3.cross(ab, ac);
    for (let corner: number = 0; corner < 3; corner++) {
      const at: number = indices[i + corner] * 3;
      normals[at] += normal.x;
      normals[at + 1] += normal.y;
      normals[at + 2] += normal.z;
    }
  }
  for (let i: number = 0; i < normals.length; i += 3) {
    if (
      !Number.isFinite(normals[i]) ||
      !Number.isFinite(normals[i + 1]) ||
      !Number.isFinite(normals[i + 2])
    )
      throw new HumanMeshNormalDomainError();
    const normal: ReturnType<typeof Vector3.create> = Vector3.normalize(
      Vector3.create(normals[i], normals[i + 1], normals[i + 2]),
    );
    normals[i] = normal.x;
    normals[i + 1] = normal.y;
    normals[i + 2] = normal.z;
  }
  return normals;
};
