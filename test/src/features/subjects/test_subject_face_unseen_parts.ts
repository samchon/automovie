import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  FACE_UNSEEN_NORMS,
  faceMidlineTriangles,
  faceUnseenIntervals,
  faceUnseenParts,
} from "../../../scripts/face-review/faceUnseenNorms";
import { nclose } from "../internal/predicates";

/** A closed box's corners and its outward counter-clockwise faces. */
const box = (
  offset: number,
  [x0, y0, z0]: readonly [number, number, number],
  [x1, y1, z1]: readonly [number, number, number],
) => ({
  positions: [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ].flat(),
  indices: [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [3, 7, 6],
    [3, 6, 2],
    [0, 4, 7],
    [0, 7, 3],
    [1, 2, 6],
    [1, 6, 5],
  ]
    .flat()
    .map((v) => v + offset),
});

/**
 * The parts of a surface the unseen readings are taken over, and their
 * intervals.
 * Scenarios:
 * 1. A left "ear" (a slab 4 mm thin, 50 mm tall, moved by the left
 *    ear-shape targets) is the left auricle; a head vertex 1 cm behind it
 *    lies about it and one 10 cm off does not; the right side, with no
 *    ear-shape channels, has neither; the scalp is the first triangle's
 *    vertices.
 * 2. The triangles within 5 mm of the midsagittal plane are the midline's.
 * 3. Each reading's interval spans every population's norm, at 17 and 60
 *    years, less and plus two spreads: the upper lip to the E-line from
 *    the European man at 60 (-4.58 - 3.4 - 4 mm) to the African man at 17
 *    (2.6 + 4 mm).
 */
export const test_subject_face_unseen_parts = (): void => {
  const slab = box(0, [0.07, 0, 0], [0.074, 0.05, 0.02]);
  const positions = [...slab.positions, 0.06, 0.02, -0.01, 0.2, 0.2, 0.2];
  const human: IAutoMovieHumanFaceBasis["surfaces"][number] = {
    id: "Human",
    positions,
    indices: slab.indices,
    targets: {
      "flap.positive": [0, 0.001, 0, 0],
      "wing.positive": [1, 0.001, 0, 0, 2, 0.001, 0, 0],
      "lobe.positive": [3, 4, 5, 6, 7].flatMap((v) => [v, 0.001, 0, 0]),
    },
    regions: [
      {
        id: "Human/skin",
        material: "skin",
        indices: [...slab.indices, 8, 8, 8, 9, 9, 9],
        uvs: null,
      },
    ],
    hairDomains: [
      { id: "scalp", origin: [0, 0, 0], triangles: [0] },
    ] as IAutoMovieHumanFaceBasis["surfaces"][number]["hairDomains"],
  };
  const basis: IAutoMovieHumanFaceBasis = {
    id: "ear/1",
    channels: (["Flap", "Wing", "Lobe"] as const).map((name) => ({
      id: `leftEar${name}`,
      kind: "shape" as const,
      minimum: 0,
      maximum: 1,
      positive: `${name.toLowerCase()}.positive`,
      negative: null,
    })),
    surfaces: [human],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
  const parts = faceUnseenParts(basis, human);
  TestValidator.equals(
    "parts",
    [parts.auricles, parts.mastoids, parts.scalp],
    [
      { left: [0, 1, 2, 3, 4, 5, 6, 7], right: [] },
      { left: [8], right: [] },
      [0, 2, 1],
    ],
  );
  TestValidator.equals(
    "midline",
    faceMidlineTriangles(
      [
        -0.001, 0, 0, 0.001, 0, 0, 0, 0.01, 0, 0.1, 0, 0, 0.12, 0, 0, 0.1, 0.01,
        0,
      ],
      [0, 1, 2, 3, 4, 5],
    ),
    [0, 1, 2],
  );
  const intervals = faceUnseenIntervals();
  TestValidator.predicate(
    "intervals",
    nclose(
      intervals.eLineUpper[0],
      FACE_UNSEEN_NORMS.european.male.eLineUpper - 0.0034 - 0.004,
      1e-12,
    ) &&
      nclose(
        intervals.eLineUpper[1],
        FACE_UNSEEN_NORMS.african.male.eLineUpper + 0.004,
        1e-12,
      ),
  );
};
