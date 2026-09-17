import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createPortraitMaterials,
} from "@automovie/human";

/**
 * Independent analytic basis: a unit square with a UV/material split and a
 * separate triangular attachment. Shape widens/narrows the square; expression
 * lifts its far corner and translates one attachment vertex. Coordinates use
 * metres purely to make expected sums and cross-product normals hand-checkable.
 * No portrait fixture or measured mesh participates in these unit oracles.
 */
export function humanFaceBasisFixture(): {
  basis: IAutoMovieHumanFaceBasis;
  document: IAutoMovieHumanFaceBasisDocument;
} {
  const basis: IAutoMovieHumanFaceBasis = {
    version: "human-face-basis/1",
    id: "analytic-square/1",
    channels: [
      {
        id: "width",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "wide",
        negative: "narrow",
      },
      {
        id: "lift",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "raised",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "square",
        positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        indices: [0, 1, 2, 0, 2, 3],
        targets: {
          wide: [1, 0.5, 0, 0, 2, 0.5, 0, 0],
          narrow: [1, -0.25, 0, 0, 2, -0.25, 0, 0],
          raised: [2, 0, 0, 1],
        },
        regions: [
          {
            id: "first",
            material: "skin",
            indices: [0, 1, 2],
            uvs: [0, 0, 1, 0, 1, 1],
          },
          { id: "second", material: "lips", indices: [0, 2, 3], uvs: null },
        ],
      },
      {
        id: "attachment",
        positions: [2, 0, 0, 3, 0, 0, 2, 1, 0],
        indices: [0, 1, 2],
        targets: { raised: [2, 0, 0, 0.5] },
        regions: [
          { id: "attached", material: "skin", indices: [0, 1, 2], uvs: null },
        ],
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin" || material.id === "lips",
    ),
  };
  return {
    basis,
    document: {
      version: "human-face-basis-document/1",
      id: "square",
      name: "Analytic face",
      basis: basis.id,
      shape: {},
      expression: {},
    },
  };
}
