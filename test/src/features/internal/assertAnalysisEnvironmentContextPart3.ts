import {
  autoMovieHemisphereDirections,
  autoMovieRayObstructed,
  autoMovieSkyward,
  autoMovieSolidBlocks,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "./predicates";

/** Execute the next ordered assertions of test_analysis_environment_context.
 *
 * Scenarios:
 * 1. the parallel test reads the slope against the unit normal, not the authored length.
 * 2. a ray is obstructed when any one solid stops it.
 * 3. the reference ground decides which directions are sky.
 * 4. cosine-weighted directions stay unit length inside their own hemisphere.
 *
 * Positive rescaling of a half-space preserves its analytic inequality; the authored box planes determine ray obstruction, and the sign of the ground-up dot product determines the horizon. Sample directions must have unit norm within 1e-9 and positive normal projection. These invariants and deterministic replay do not establish cosine-distribution integration accuracy.
 * Unit/short plane normals share the same blocker; missing, present and empty unions distinguish obstruction. Up/down/grazing rays distinguish the horizon, while positive/negative/oblique normals and a singleton distinguish sampling orientation. Fractional/zero counts and zero/nonfinite normals must throw; other context schema cases belong to earlier parts.
 */
export function assertAnalysisEnvironmentContextPart3(
  context: IAutoMovieEnvironmentContext,
  neighbour: { id: string; planes: IAutoMovieHalfSpacePlane[] },
  cube: { id: string; planes: IAutoMovieHalfSpacePlane[] },
  rising: IAutoMovieVector3,
): void {
  const slab: (scale: number) => boolean = (scale: number): boolean =>
    autoMovieSolidBlocks({
      origin: { x: 0, y: 0, z: 0 },
      direction: rising,
      planes: [
        { normal: { x: 0, y: 0, z: -scale }, offset: -scale * 1e-12 },
        { normal: { x: 0, y: 0, z: 1 }, offset: 10 },
        { normal: { x: 1, y: 0, z: 0 }, offset: 10 },
        { normal: { x: -1, y: 0, z: 0 }, offset: 10 },
        { normal: { x: 0, y: 1, z: 0 }, offset: 10 },
        { normal: { x: 0, y: -1, z: 0 }, offset: 10 },
      ],
      maxDistance: Infinity,
    });
  TestValidator.equals(
    "the parallel test reads the slope against the unit normal, not the authored length",
    { unit: slab(1), short: slab(1e-6) },
    { unit: true, short: true },
  );
  TestValidator.equals(
    "a ray is obstructed when any one solid stops it",
    {
      none: autoMovieRayObstructed({
        origin: { x: -1, y: 0.5, z: 0.5 },
        direction: { x: -1, y: 0, z: 0 },
        solids: [cube, neighbour],
        maxDistance: Infinity,
      }),
      one: autoMovieRayObstructed({
        origin: { x: -1, y: 0.5, z: 0.5 },
        direction: { x: 1, y: 0, z: 0 },
        solids: [cube, neighbour],
        maxDistance: Infinity,
      }),
      empty: autoMovieRayObstructed({
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 0, y: 1, z: 0 },
        solids: [],
        maxDistance: Infinity,
      }),
    },
    { none: false, one: true, empty: false },
  );
  TestValidator.equals(
    "the reference ground decides which directions are sky",
    {
      up: autoMovieSkyward({ x: 0, y: 1, z: 0 }, context.ground),
      down: autoMovieSkyward({ x: 0, y: -1, z: 0 }, context.ground),
      grazing: autoMovieSkyward({ x: 1, y: 0, z: 0 }, context.ground),
    },
    { up: true, down: false, grazing: false },
  );

  const sampled: (normal: IAutoMovieVector3, count: number) => boolean = (
    normal: IAutoMovieVector3,
    count: number,
  ): boolean => {
    const directions: IAutoMovieVector3[] = autoMovieHemisphereDirections({
      normal,
      count,
    });
    return (
      directions.length === count &&
      directions.every(
        (direction: IAutoMovieVector3): boolean =>
          nclose(Math.hypot(direction.x, direction.y, direction.z), 1, 1e-9) &&
          direction.x * normal.x +
            direction.y * normal.y +
            direction.z * normal.z >
            0,
      )
    );
  };
  TestValidator.equals(
    "cosine-weighted directions stay unit length inside their own hemisphere",
    namedFacts([
      ["positive z normal", (): boolean => sampled({ x: 0, y: 0, z: 1 }, 64)],
      ["negative z normal", (): boolean => sampled({ x: 0, y: 0, z: -1 }, 64)],
      ["oblique normal", (): boolean => sampled({ x: 1, y: 2, z: -2 }, 32)],
      ["single direction", (): boolean => sampled({ x: 0, y: 1, z: 0 }, 1)],
      [
        "deterministic",
        (): boolean => {
          const first: IAutoMovieVector3[] = autoMovieHemisphereDirections({
            normal: { x: 0, y: 1, z: 0 },
            count: 8,
          });
          const second: IAutoMovieVector3[] = autoMovieHemisphereDirections({
            normal: { x: 0, y: 1, z: 0 },
            count: 8,
          });
          return JSON.stringify(first) === JSON.stringify(second);
        },
      ],
      [
        "fractional count",
        (): boolean =>
          throwsError(
            (): IAutoMovieVector3[] =>
              autoMovieHemisphereDirections({
                normal: { x: 0, y: 1, z: 0 },
                count: 1.5,
              }),
            "positive safe integer",
          ),
      ],
      [
        "zero count",
        (): boolean =>
          throwsError(
            (): IAutoMovieVector3[] =>
              autoMovieHemisphereDirections({
                normal: { x: 0, y: 1, z: 0 },
                count: 0,
              }),
            "positive safe integer",
          ),
      ],
      [
        "zero normal",
        (): boolean =>
          throwsError(
            (): IAutoMovieVector3[] =>
              autoMovieHemisphereDirections({
                normal: { x: 0, y: 0, z: 0 },
                count: 4,
              }),
            "non-zero normal",
          ),
      ],
      [
        "non-finite normal",
        (): boolean =>
          throwsError(
            (): IAutoMovieVector3[] =>
              autoMovieHemisphereDirections({
                normal: { x: Number.NaN, y: 1, z: 0 },
                count: 4,
              }),
            "finite, non-zero normal",
          ),
      ],
    ]),
    {
      "positive z normal": true,
      "negative z normal": true,
      "oblique normal": true,
      "single direction": true,
      deterministic: true,
      "fractional count": true,
      "zero count": true,
      "zero normal": true,
      "non-finite normal": true,
    },
  );
}
