import type { IAutoMovieHumanBasisSourcePartition } from "@automovie/human/common/basis/IAutoMovieHumanBasisSourcePartition";

import { humanPersonBasisFixture } from "./humanPersonBasisFixture";
import { humanPersonTube } from "./humanPersonTubeFixture";

/**
 * Two caps and one common eight-point ring partition a single analytic tube.
 * The ring uses original source IDs, not a numerical nearest-point match.
 * The existing four-bone fixture supplies numerical posing only; this tube
 * makes no claim about human anatomy, clinical ranges or proportions.
 */
export function humanPersonSourceBasisFixture() {
  const fixture = humanPersonBasisFixture();
  const upper = humanPersonTube({
    rings: [0, 0.1, 0.2, 0.3],
    segments: 8,
    radius: 0.05,
    close: "top",
  });
  const lower = humanPersonTube({
    rings: [-0.5, -0.4, -0.3, -0.2, -0.1, 0],
    segments: 8,
    radius: 0.05,
    close: "bottom",
  });
  const faceSamples = Array.from({ length: 33 }, (_, vertex) =>
    vertex === 32 ? 73 : vertex + 40,
  );
  const bodySamples = Array.from({ length: 49 }, (_, vertex) =>
    vertex === 48 ? 72 : vertex,
  );
  const parentTriangles = [
    ...lower.indices.map((vertex) => bodySamples[vertex]),
    ...upper.indices.map((vertex) => faceSamples[vertex]),
  ];
  const shared = {
    generation: "analytic-shared-tube",
    originalVertices: 74,
    parentTriangles,
    intersections: [],
  };
  const facePartition: IAutoMovieHumanBasisSourcePartition = {
    ...shared,
    samples: faceSamples,
    parents: Array.from(
      { length: upper.indices.length / 3 },
      (_, i) => lower.indices.length / 3 + i,
    ),
  };
  const bodyPartition: IAutoMovieHumanBasisSourcePartition = {
    ...shared,
    samples: bodySamples,
    parents: Array.from({ length: lower.indices.length / 3 }, (_, i) => i),
  };
  fixture.face.channels = [];
  Object.assign(fixture.face.surfaces[0], {
    positions: upper.positions,
    indices: upper.indices,
    targets: {},
    regions: [
      { id: "face/skin", material: "skin", indices: upper.indices, uvs: null },
    ],
    sourcePartition: facePartition,
  });
  const rows = Array.from(
    { length: lower.positions.length / 3 },
    (_, vertex) => {
      const y = lower.positions[vertex * 3 + 1];
      return y < -0.3
        ? { bones: [0, 0, 0, 0], weights: [1, 0, 0, 0] }
        : y < -0.1
          ? { bones: [1, 0, 0, 0], weights: [1, 0, 0, 0] }
          : { bones: [2, 3, 0, 0], weights: [0.6, 0.4, 0, 0] };
    },
  );
  fixture.body.channels = [];
  Object.assign(fixture.body.surfaces[0], {
    positions: lower.positions,
    indices: lower.indices,
    targets: {},
    regions: [
      { id: "body/skin", material: "skin", indices: lower.indices, uvs: null },
    ],
    sourcePartition: bodyPartition,
    skin: {
      joints: ["hips", "spine", "neck", "head"],
      boneIndices: rows.flatMap((row) => row.bones),
      weights: rows.flatMap((row) => row.weights),
    },
  });
  return fixture;
}
