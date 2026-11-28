import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanInteractionMeshLaplacian
} from "../../../../../packages/motions/src/posture/internal/HumanInteractionMeshLaplacian";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a weight's quotient. */
const ROUNDING: number = 1e-15;

/**
 * `HumanInteractionMeshLaplacian.rows` is an interaction mesh's Laplacian (Ho,
 * Komura and Tai 2010, sections 5 and 5.1): each point's row is 1 on itself and
 * minus its neighbours' normalized inverse-distance weights, the skeleton's own
 * bone edges left out (either direction), a point with no neighbour left an
 * empty row; neighbours at no distance share the whole weight.
 *
 * Scenarios:
 *
 * 1. Point 0 at the origin with neighbours 1 at 1 m and 2 at 2 m: weights 1 and ½,
 *    so −2/3 and −1/3; each row sums to zero.
 * 2. With the bone 1–0 the row of 0 keeps only 2, at −1, and the row of 1, whose
 *    one neighbour is 0, is empty.
 * 3. Two neighbours on the point and one away: −½, −½ and 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines normalized inverse-distance rows, excluded bone edges and coincident-neighbor weighting.
 * @evidence contracts/development/testing.md#behavioral-verification Assembles three-point meshes with unequal distances, an excluded edge and two coincident neighbors.
 * @evidence contracts/development/testing.md#independent-expectations Weights 1 and 1/2 normalize to 2/3 and 1/3. A single allowed neighbor receives all weight and coincident neighbors share half each.
 */
export function test_motions_posture_interaction_mesh_laplacian(): void {
  const points: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 },
  ];
  const sum = (row: HumanInteractionMeshLaplacian.Row): number =>
    row.reduce((t: number, e: { value: number }): number => t + e.value, 0);

  // 1. Inverse-distance weights.
  const rows: HumanInteractionMeshLaplacian.Row[] =
    HumanInteractionMeshLaplacian.rows(points, [[1, 2], [0], [0, 1]], []);
  TestValidator.predicate(
    "normalized inverse-distance weights",
    rows[0]!.length === 3 &&
      rows[0]![0]!.point === 0 &&
      rows[0]![0]!.value === 1 &&
      nclose(rows[0]![1]!.value, -2 / 3, ROUNDING) &&
      nclose(rows[0]![2]!.value, -1 / 3, ROUNDING) &&
      rows.every((row: HumanInteractionMeshLaplacian.Row): boolean =>
        nclose(sum(row), 0, ROUNDING),
      ),
  );

  // 2. Bone edges omitted.
  const boned: HumanInteractionMeshLaplacian.Row[] =
    HumanInteractionMeshLaplacian.rows(
      points,
      [[1, 2], [0], [0, 1]],
      [{ from: 1, to: 0, length: 1 }],
    );
  TestValidator.equals(
    "a bone's edge left out",
    [boned[0], boned[1]],
    [
      [
        { point: 0, value: 1 },
        { point: 2, value: -1 },
      ],
      [],
    ],
  );

  // 3. Coincident neighbours.
  const coincident: HumanInteractionMeshLaplacian.Row[] =
    HumanInteractionMeshLaplacian.rows(
      [points[0]!, points[0]!, points[0]!, points[1]!],
      [[1, 2, 3], [], [], []],
      [],
    );
  TestValidator.predicate(
    "coincident neighbours share the weight",
    coincident[0]![1]!.value === -0.5 &&
      coincident[0]![2]!.value === -0.5 &&
      Object.is(coincident[0]![3]!.value, -0),
  );
}
