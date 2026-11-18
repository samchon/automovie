import type { IAutoMovieAngleRange } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bilinearAngleBoxCandidates } from "../../../../packages/engine/src/math/bilinearAngleBoxCandidates";

/**
 * The compact prepared box preserves the ordinary candidate list when
 * resolving nearest whole turns.
 *
 * Scenarios:
 * 1. Compare fresh direct and prepared candidates for a wrist box and an
 *    equally narrow box displaced by whole turns.
 * 2. Include a signed-zero boundary, a box at the 179-degree proof limit,
 *    and wider 180-degree fallback with reference angles around a half turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the degree-domain fixtures and bitwise ordered candidate requirement.
 * @evidence contracts/development/testing.md#behavioral-verification Runs direct and reused scalar preparation on compact, displaced and ordinary fallback boxes, preserving list order and zero signs.
 * @evidence contracts/development/testing.md#independent-expectations The ordinary tuple entry enumerates every bounded alias with exact index admission. The tested prepared branch may omit that arithmetic only where its bounded proof gives the same rows.
 * @evidence contracts/development/testing.md#distinguishing-cases Interior, straddling zero and displaced domains combine with zero, rank-one, equal-singular and general matrices and references around pi; a wider box exercises fallback.
 * @evidence contracts/development/testing.md#execution-ownership In-memory math scenario with no rig, external process or global mutation.
 */
export function test_math_bilinear_box_alias_admission(): void {
  const boxes: readonly (readonly [
    IAutoMovieAngleRange,
    IAutoMovieAngleRange,
  ])[] = [
    [
      { min: -80, max: 70 },
      { min: -30, max: 20 },
    ],
    [
      { min: 280, max: 430 },
      { min: -750, max: -700 },
    ],
    [
      { min: -0, max: 0 },
      { min: 0, max: 179 },
    ],
    [
      { min: -90, max: 90 },
      { min: -180, max: 0 },
    ],
  ];
  const matrices: readonly (readonly [number, number, number, number])[] = [
    [0, 0, -0, 0],
    [-0, 0, -1, 0],
    [0, -1, 1, 0],
    [0, 1, 1, 0],
    [1, -0.8, 0.04, -0.9],
    [Number.MIN_VALUE, 1, -1, -Number.MIN_VALUE],
  ];
  const references: readonly number[] = [
    -1024, -540, -180.00000000000003, -180, -0, 0, 70, 179, 179.99999999999997,
    180, 180.00000000000003, 540, 1024,
  ];
  for (const box of boxes) {
    const prepared: bilinearAngleBoxCandidates.IPrepared =
      bilinearAngleBoxCandidates.prepare(box);
    for (const matrix of matrices)
      for (const x of references) {
        for (const y of references) {
          const ordinary: number[] | undefined = bilinearAngleBoxCandidates(
            matrix,
            box,
            [x, y],
          )?.flat();
          const compact: number[] | null = prepared.fromScalarsFlat(
            ...matrix,
            x,
            y,
          );
          TestValidator.predicate(
            `same ordered candidates in box ${JSON.stringify(box)} at ${x},${y}`,
            ordinary !== undefined &&
              compact !== null &&
              ordinary.length === compact.length &&
              ordinary.every((value, index) =>
                Object.is(value, compact[index]),
              ),
          );
        }
      }
  }
}
