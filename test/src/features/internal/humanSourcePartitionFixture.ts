import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";

/** Two perpendicular source triangles partitioned at X=1 by shared affine IDs. */
export function humanSourcePartitionFixture() {
  const shared = {
    generation: "analytic-two-planes",
    originalVertices: 4,
    parentTriangles: [0, 1, 2, 0, 3, 1],
    intersections: [
      { a: 0, b: 1, t: 0.5 },
      { a: 1, b: 2, t: 0.5 },
      { a: 3, b: 1, t: 0.5 },
    ],
  };
  const faceSource: IAutoMovieHumanBasisSourcePartition = {
    ...shared,
    samples: [4, 1, 5, 6],
    parents: [0, 1],
  };
  const bodySource: IAutoMovieHumanBasisSourcePartition = {
    ...shared,
    samples: [0, 4, 5, 2, 3, 6],
    parents: [0, 0, 1, 1],
  };
  return {
    face: {
      positions: [1, 0, 0, 2, 0, 0, 1, 1, 0, 1, 0, 1],
      indices: [0, 1, 2, 3, 1, 0],
      sourcePartition: faceSource,
    },
    body: {
      positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 2, 0, 0, 0, 2, 1, 0, 1],
      indices: [0, 1, 2, 0, 2, 3, 0, 4, 5, 0, 5, 1],
      sourcePartition: bodySource,
    },
  };
}
