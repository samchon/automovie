import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Create a synthetic open tube of radius 0.2 m from y = 0 to y = 2, 16 sides by
 * 17 rings, skinned to joints `["hips", "spine"]`. The second joint's weight
 * rises by smoothstep from 0 at y = 0.75 to 1 at y = 1.25. Normals point
 * radially outward and triangles wind counter-clockwise seen from outside.
 */
export function createSkinnedTubeMesh(): IAutoMovieMesh {
  const sides: number = 16;
  const rings: number = 17;
  const radius: number = 0.2;
  const positions: number[] = [];
  const normals: number[] = [];
  const boneIndices: number[] = [];
  const weights: number[] = [];
  for (let ring: number = 0; ring < rings; ++ring) {
    const y: number = (2 * ring) / (rings - 1);
    const t: number = Math.min(1, Math.max(0, (y - 0.75) / 0.5));
    const child: number = t * t * (3 - 2 * t);
    for (let side: number = 0; side < sides; ++side) {
      const angle: number = (2 * Math.PI * side) / sides;
      positions.push(radius * Math.cos(angle), y, radius * Math.sin(angle));
      normals.push(Math.cos(angle), 0, Math.sin(angle));
      boneIndices.push(0, 1, 0, 0);
      weights.push(1 - child, child, 0, 0);
    }
  }
  const indices: number[] = [];
  for (let ring: number = 0; ring + 1 < rings; ++ring)
    for (let side: number = 0; side < sides; ++side) {
      const a: number = ring * sides + side;
      const b: number = ring * sides + ((side + 1) % sides);
      const c: number = a + sides;
      const d: number = b + sides;
      indices.push(a, c, b, b, c, d);
    }
  return {
    positions,
    normals,
    uvs: null,
    indices,
    skin: { joints: ["hips", "spine"], boneIndices, weights },
  };
}
