import { Quaternion, rotationBetween } from "@automovie/engine";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "@automovie/human/body/basis/IHumanBodyUnderwearSurfaceEvaluation";
import { createHumanBodyUnderwearNormalLinearizer } from "@automovie/human/body/basis/createHumanBodyUnderwearNormalLinearizer";
import { areaWeightedNormals } from "@automovie/human/common/mesh/areaWeightedNormals";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A garment normal retains its derivative at parallel and tiny nonzero turns.
 *
 * Scenarios:
 *
 * 1. Parallel, sub-1e-12, exactly 1e-12 and ordinary tilted triangles retain their analytic normal derivative.
 * 2. An antiparallel face reports derivative unavailability rather than inventing a regular half-turn derivative.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual normal linearizer on complete normal-transport operands and asserts nonzero one-ring derivatives across the former angular deadzone, plus explicit antiparallel unavailability.
 * @evidence contracts/testing.md#independent-expectations The triangle (0,0,0),(1,0,0),(0,1,h) has unit normal (0,-h,1)/sqrt(1+h*h); differentiating this expression gives the literal expected Y/Z derivatives. Product transport constructs input normals only and does not supply the derivative oracle.
 * @evidence contracts/testing.md#distinguishing-cases Includes exact parallel, either side of the former small-turn boundary, an ordinary tilt and antiparallel winding. Field/contact acceptance and complete garment fitting are outside this derivative unit.
 * @evidence contracts/testing.md#execution-ownership The named portable synchronous unit supplies numerical evaluation records with geometryAccepted false and calls actual area-normal/quaternion transport, without an envelope, solver, anatomical basis, native host or renderer.
 */
export function test_human_underwear_normal_small_turn(): void {
  const points: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  const normals: number[] = [0, 0, 1, 0, 0, 1, 0, 0, 1];
  const indices: number[] = [0, 1, 2];
  const read: ReturnType<typeof createHumanBodyUnderwearNormalLinearizer> =
    createHumanBodyUnderwearNormalLinearizer({
      points,
      normals,
      indices,
      offsetMetres: 0,
      sourceVertices: [0, 1, 2],
    });
  function evaluation(base: number[]): IHumanBodyUnderwearSurfaceEvaluation {
    const fitted: number[] = areaWeightedNormals(base, indices);
    const direction: IAutoMovieVector3 = {
      x: fitted[0],
      y: fitted[1],
      z: fitted[2],
    };
    const transported: IAutoMovieVector3 = Quaternion.rotateVector(
      rotationBetween({ x: 0, y: 0, z: 1 }, direction),
      { x: 0, y: 0, z: 1 },
    );
    const length: number = Math.hypot(
      transported.x,
      transported.y,
      transported.z,
    );
    const unit: number[] = [
      transported.x / length,
      transported.y / length,
      transported.z / length,
    ];
    return {
      base,
      positions: [...base],
      normals: [...unit, ...unit, ...unit],
      fieldResidualMetres: 0,
      violations: [],
      geometryAccepted: false,
    };
  }
  for (const height of [0, 1e-13, 1e-12, 0.125]) {
    const base: number[] = [...points];
    base[8] = height;
    const result: ReturnType<typeof read> = read(evaluation(base));
    TestValidator.equals(
      "regular normal derivative is available",
      result.unavailable.length,
      0,
    );
    const expectedScale: number = (1 + height * height) ** -1.5;
    for (const derivatives of result.derivatives) {
      const actual: number[] | undefined = derivatives.get(8);
      TestValidator.predicate(
        "triangle normal derivative at height " + height,
        actual !== undefined &&
          nclose(actual[0], 0, 1e-10) &&
          nclose(actual[1], -expectedScale, 1e-10) &&
          nclose(actual[2], -height * expectedScale, 1e-10),
      );
    }
  }
  const antiparallel: number[] = [...points];
  antiparallel[7] = -1;
  const refused: ReturnType<typeof read> = read(evaluation(antiparallel));
  TestValidator.equals(
    "antiparallel derivative is unavailable at all vertices",
    refused.unavailable.length,
    3,
  );
}
