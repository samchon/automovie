import {
  limitMonotoneTangents
} from "../../../../../packages/archetypes/src/core/internal/limitMonotoneTangents";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `limitMonotoneTangents` scales the tangents of a cubic Hermite path so that
 * it does not overshoot: on a span with chord c, alpha and beta are the end
 * tangents over c, and both ends scale by min(1, 3 / (2 alpha + beta), 3 /
 * (alpha + 2 beta)); a held span is left alone.
 *
 * Scenarios:
 *
 * 1. Over the unit chord from the origin to (1, 0, 0), the tangents (3, 0, 0) and
 *    zero have alpha 3 and beta 0, so the scale is min(1, 1/2, 1) = 1/2: they
 *    become (3/2, 0, 0) and zero.
 * 2. A nonzero trailing tangent gives beta 3 and alpha 0. The other endpoint
 *    constraint sets the same one-half scale on the trailing knot.
 * 3. The same span held keeps its tangents.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines leading, trailing and held-span tangent cases for a unit Hermite chord.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual limiter for nonzero tangents at either endpoint and the held control. Checks returned vectors, including unchanged zero components.
 * @evidence contracts/development/testing.md#independent-expectations A chord of one and a tangent of three give one endpoint constraint of 1/2 and the other of one. The retained nonzero tangent is therefore 1.5.
 */
export function test_archetypes_internal_limit_monotone_tangents(): void {
  const points: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ];
  const tangents = (): IAutoMovieVector3[] => [
    { x: 3, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ];
  const limited = tangents();
  limitMonotoneTangents([0, 1], points, [false, false], limited);
  TestValidator.equals("limited", limited, [
    { x: 1.5, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ]);
  const trailing: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ];
  limitMonotoneTangents([0, 1], points, [false, false], trailing);
  TestValidator.equals("limited trailing knot", trailing, [
    { x: 0, y: 0, z: 0 },
    { x: 3 / 2, y: 0, z: 0 },
  ]);
  const held = tangents();
  limitMonotoneTangents([0, 1], points, [true, false], held);
  TestValidator.equals("held", held, tangents());
}
