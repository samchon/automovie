import { AutoMovieArchetypeSea } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Covers projection, tilt composition and conversion back to world axes. */
const TANGENT_ROUNDING: number = 128 * Number.EPSILON;

/**
 * A heaved deck's up axis is the plane normal at its world position.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States authored surface elevation and slope, deck heave and the world-up axis after tilting.
 * @evidence contracts/development/testing.md#behavioral-verification Passes an analytic sea plane to the actual floated transform and reads its translation and rotated local up direction under a yaw.
 * @evidence contracts/development/testing.md#independent-expectations The plane value at X 2, Z 4, time 3 is 3. Its upward normal is the normalized gradient complement `(-2,4,1)`, independent of deck yaw.
 */
export function test_archetypes_core_sea_tangent(): void {
  const sea: AutoMovieArchetypeSea.ISea = {
    heading: 0,
    components: [],
    crest: 4,
    steepest: Math.sqrt(5) / 4,
    elevation: (x, z, seconds): number => x / 2 - z / 4 + seconds,
    slope: () => ({ x: 1 / 2, z: -1 / 4 }),
  };
  const level: IAutoMovieTransform = {
    translation: { x: 2, y: 7, z: 4 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const floated = AutoMovieArchetypeSea.floated(sea, level, 3);
  TestValidator.equals(
    "elevation adds only to the deck's Y",
    floated.translation,
    {
      x: 2,
      y: 10,
      z: 4,
    },
  );
  const length: number = Math.sqrt(21);
  TestValidator.predicate(
    "the yawed deck lies on the same tangent plane",
    vclose(
      AutoMovieEngineQuaternion.rotateVector(floated.rotation, { x: 0, y: 1, z: 0 }),
      { x: -2 / length, y: 4 / length, z: 1 / length },
      TANGENT_ROUNDING,
    ),
  );
}
