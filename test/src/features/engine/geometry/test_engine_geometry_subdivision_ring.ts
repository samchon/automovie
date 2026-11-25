import {
  stepSubdivisionRing,
  subdivisionRingEigenbasis,
} from "@automovie/engine";
import type { IAutoMovieSubdivisionRing } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `stepSubdivisionRing(ring)` refines a quad one-ring to its centre child's
 * one-ring; `subdivisionRingEigenbasis(ring)` reads the limit point and tangent
 * plane from the ring matrix's dominant left eigenvectors.
 *
 * Fixture: the regular valence-4 ring with centre (0, 0, 1), edge neighbours
 * (1,0,0), (0,1,0), (-1,0,0), (0,-1,0) and diagonals (1,1,0), (-1,1,0),
 * (-1,-1,0), (1,-1,0).
 *
 * Scenarios:
 *
 * 1. Smooth: child diagonal 0 is (C + E0 + D0 + E1) / 4 = (0.5, 0.5, 0.25), edge 0
 *    is (0.5, 0, 0.375), the centre (0, 0, 0.5625); sharpness [2, 0, 2, 0]
 *    decays to [1, 0, 1, 0].
 * 2. Creased along edges 0 and 2 (sharpness 10): those edge points are the
 *    midpoints (0.5, 0, 0.5), and the centre takes 3/4 C + 1/8 (E0 + E2) = (0,
 *    0, 0.75).
 * 3. The smooth ring's limit is (16 C + 4 sum E + sum D) / 36 = (0, 0, 4/9) within
 *    1e-12, and its tangents span the xy plane: their unit cross product is (0,
 *    0, +-1) within 1e-9.
 */
export function test_engine_geometry_subdivision_ring(): void {
  const ring = (sharpness: number[]): IAutoMovieSubdivisionRing => ({
    centre: [0, 0, 1],
    edges: [1, 0, 0, 0, 1, 0, -1, 0, 0, 0, -1, 0],
    diagonals: [1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0],
    sharpness,
  });

  // 1.
  const child: IAutoMovieSubdivisionRing = stepSubdivisionRing(
    ring([0, 0, 0, 0]),
  );
  TestValidator.equals(
    "diagonal",
    child.diagonals.slice(0, 3),
    [0.5, 0.5, 0.25],
  );
  TestValidator.equals("edge", child.edges.slice(0, 3), [0.5, 0, 0.375]);
  TestValidator.equals("centre", child.centre, [0, 0, 0.5625]);
  TestValidator.equals(
    "decay",
    stepSubdivisionRing(ring([2, 0, 2, 0])).sharpness,
    [1, 0, 1, 0],
  );

  // 2.
  const creased: IAutoMovieSubdivisionRing = stepSubdivisionRing(
    ring([10, 0, 10, 0]),
  );
  TestValidator.equals("crease edge", creased.edges.slice(0, 3), [0.5, 0, 0.5]);
  TestValidator.equals("crease centre", creased.centre, [0, 0, 0.75]);

  // 3.
  const basis = subdivisionRingEigenbasis(ring([0, 0, 0, 0]));
  TestValidator.predicate(
    "limit",
    Math.abs(basis.limit[0]!) <= 1e-12 &&
      Math.abs(basis.limit[1]!) <= 1e-12 &&
      Math.abs(basis.limit[2]! - 4 / 9) <= 1e-12,
  );
  const [a, b] = basis.tangents;
  const n: number[] = [
    a![1]! * b![2]! - a![2]! * b![1]!,
    a![2]! * b![0]! - a![0]! * b![2]!,
    a![0]! * b![1]! - a![1]! * b![0]!,
  ];
  const length: number = Math.hypot(n[0]!, n[1]!, n[2]!);
  TestValidator.predicate(
    "tangent plane",
    Math.abs(n[0]! / length) <= 1e-9 &&
      Math.abs(n[1]! / length) <= 1e-9 &&
      Math.abs(Math.abs(n[2]! / length) - 1) <= 1e-9,
  );
}
