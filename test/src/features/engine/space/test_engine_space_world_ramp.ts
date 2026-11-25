import { worldRamp } from "@automovie/engine";
import type {
  IAutoMovieWorldRamp,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * A ramp's rectangular footprint and plane come from its authored centerline.
 *
 * Scenarios:
 *
 * 1. A Z-directed ramp has the four expected corners and the requested rise.
 * 2. Coincident endpoints or zero width independently refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the fixture's footprint and plane and separates the two malformed inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the emitted polygon and plane. Swapped footprint corners or slope axes, a wrong datum, and missing endpoint or width refusals fail.
 * @evidence contracts/development/testing.md#independent-expectations A 4-m width straddles X -4 by 2 m, and a 2-m rise over 8 m from Z -4 makes slope Z 0.25 and origin height 1. The axis-aligned inputs, length and outputs are exact binary values.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes slope axes, plane origin, degenerate endpoint span and degenerate width.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous test owns typed centerline inputs and consumes the constructor's surface record.
 */
export function test_engine_space_world_ramp(): void {
  const input: IAutoMovieWorldRamp.IInput = {
    id: "ramp",
    from: { x: -4, z: -4 },
    to: { x: -4, z: 4 },
    width: 4,
    baseHeight: 0,
    rise: 2,
    walkable: true,
  };
  const ramp: IAutoMovieWorldSurface = worldRamp(input);
  const corners: readonly (readonly [number, number])[] = [
    [-6, -4],
    [-6, 4],
    [-2, 4],
    [-2, -4],
  ];
  TestValidator.predicate(
    "the ramp has the specified corners, slope and origin height",
    ramp.walkable &&
      ramp.polygon.length === corners.length &&
      corners.every(
        ([x, z], index): boolean =>
          nclose(ramp.polygon[index]!.x, x, 0) &&
          nclose(ramp.polygon[index]!.z, z, 0),
      ) &&
      ramp.height.kind === "plane" &&
      nclose(ramp.height.slopeX, 0, 0) &&
      nclose(ramp.height.slopeZ, 0.25, 0) &&
      nclose(ramp.height.originHeight, 1, 0),
  );
  for (const [label, overrides] of [
    ["coincident endpoints", { to: input.from }],
    ["zero width", { width: 0 }],
  ] satisfies readonly [string, Partial<IAutoMovieWorldRamp.IInput>][])
    TestValidator.predicate(
      label,
      throwsError(
        () => worldRamp({ ...input, ...overrides }),
        "requires finite distinct endpoints",
      ),
    );
}
