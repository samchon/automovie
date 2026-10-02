import type { IAutoMovieHumanBodyBasisSurface } from "@automovie/human";

/**
 * Independent tetrahedron with volume 1/3 m3 and outward oriented faces.
 * Its four vertices are neighbours of each other, so one half-Laplacian
 * sweep is (1/3)I + (1/6)J. It carries two half-weighted bones at each vertex
 * by default. The alternative is an open square cone, with a y=0 rim at
 * x/z=+-1 m and an apex (0,1,0) m. Its four rim vertices are boundary support.
 * Both use metre positions and outward winding; returned arrays are owned by
 * each fixture. Tests vary typed inputs, not expected results.
 */
export function humanBodyMushSurface(open = false): IAutoMovieHumanBodyBasisSurface {
  const positions = open ? [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 0, 1, 0] : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0];
  const indices = open ? [0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0] : [0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 3, 2];
  return {
    id: "analytic-tetrahedron",
    positions,
    indices,
    targets: {},
    regions: [{ id: "skin", material: "skin", indices, uvs: null }],
    skin: {
      joints: ["hips", "spine"],
      boneIndices: Array.from({ length: positions.length / 3 }, () => [0, 1, 0, 0]).flat(),
      weights: Array.from({ length: positions.length / 3 }, () => [0.5, 0.5, 0, 0]).flat(),
    },
  };
}
