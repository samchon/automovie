import type { IAutoMovieVector3 } from "@automovie/interface";
import { limitMonotoneTangents } from "@automovie/archetypes/internal";
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
 * 2. The same span held keeps its tangents.
 */
export function test_unit_archetypes_internal_limit_monotone_tangents(): void {
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
  const held = tangents();
  limitMonotoneTangents([0, 1], points, [true, false], held);
  TestValidator.equals("held", held, tangents());
}
