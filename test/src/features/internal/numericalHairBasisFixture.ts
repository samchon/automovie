import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";

import { createNumericalHairFixture } from "./createNumericalHairFixture";
import { createSignedOctahedron } from "./createSignedMeshFixture";
import { humanFaceBasisFixture } from "./humanFaceBasisFixture";

/**
 * An analytic 100 mm L1 ball with an upper-hemisphere growth domain. A shared
 * translation channel supplies an independent barycentric attachment oracle;
 * it changes current position but not neutral root sampling or length fields.
 * Returned basis/document data are owned and contain no portrait fixture.
 */
export function numericalHairBasisFixture(): {
  basis: IAutoMovieHumanFaceBasis;
  document: IAutoMovieHumanFaceBasisDocument;
} {
  const mesh = createSignedOctahedron();
  const basis: IAutoMovieHumanFaceBasis = {
    id: "analytic-hair/1",
    channels: [
      {
        id: "translate",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "translated",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "head",
        positions: mesh.positions.map((value) => value * 0.1),
        indices: mesh.indices!,
        targets: {
          translated: Array.from({ length: 6 }, (_, id) => [
            id,
            0.01,
            0,
            0,
          ]).flat(),
        },
        regions: [
          {
            id: "skin",
            material: "skin",
            indices: [...mesh.indices!],
            uvs: null,
          },
        ],
        hairDomains: [
          { id: "scalp", origin: [0, 0, 0], triangles: [0, 1, 2, 3] },
        ],
      },
    ],
    materials: [humanFaceBasisFixture().basis.materials[0]],
  };
  return {
    basis,
    document: {
      id: "analytical",
      name: "Analytical hair",
      basis: basis.id,
      shape: {},
      expression: {},
      hair: createNumericalHairFixture(),
    },
  };
}
