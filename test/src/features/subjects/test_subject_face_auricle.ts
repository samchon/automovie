import { TestValidator } from "@nestia/e2e";

import {
  faceAuricleLength,
  faceAuricleVertices,
} from "../../../scripts/face-review/faceAuricle";
import { nclose } from "../internal/predicates";

/** A closed box's eight corners and twelve outward counter-clockwise faces. */
const box = (
  offset: number,
  [x0, y0, z0]: readonly [number, number, number],
  [x1, y1, z1]: readonly [number, number, number],
): { positions: number[]; indices: number[] } => ({
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
 * The auricle as the region's thin flap, and its length.
 * Scenarios:
 * 1. Of a region spanning a 40 x 60 x 4 mm slab, a 100 mm cube and a
 *    vertex on no triangle, the slab's eight corners are within 1 cm of
 *    the surface's far side along their inward normals and are the
 *    auricle; the cube's corners are 17 cm deep and the lone vertex has no
 *    normal.
 * 2. The slab's length is its diagonal, hypot(40, 60, 4) mm; fewer than two
 *    vertices have no length, and an empty region no auricle.
 */
export const test_subject_face_auricle = (): void => {
  const slab = box(0, [0, 0, 0], [0.04, 0.06, 0.004]);
  const cube = box(8, [0.2, 0, 0], [0.3, 0.1, 0.1]);
  const positions = [...slab.positions, ...cube.positions, 0.5, 0.5, 0.5];
  const indices = [...slab.indices, ...cube.indices];
  const region = [...new Array(17).keys()];
  const auricle = faceAuricleVertices({
    positions,
    indices,
    region,
    thickness: 0.01,
  });
  TestValidator.equals("flap", auricle, [0, 1, 2, 3, 4, 5, 6, 7]);
  TestValidator.predicate(
    "length",
    nclose(
      faceAuricleLength(positions, auricle)!,
      Math.hypot(0.04, 0.06, 0.004),
      1e-12,
    ),
  );
  TestValidator.equals(
    "empty",
    [
      faceAuricleLength(positions, [0]),
      faceAuricleVertices({ positions, indices, region: [], thickness: 0.01 }),
    ],
    [null, []],
  );
};
