import { AutoMovieEngineWorld } from "@automovie/engine";
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
 * 3. Power-of-two centerlines retain their width and unit rise when squared
 *    separation would overflow or underflow.
 * 4. A footprint lost to rounding or an overflowing end height refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the footprint, plane, extreme spans, and separate geometry and height refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the ramp builder with typed centerlines and checks its walkable flag, corners, and plane coefficients. Degenerate endpoints and width, rounded-away width, and an overflowing top are checked as distinct invalid inputs.
 * @evidence contracts/development/testing.md#independent-expectations A 4 m width centered at X -4 has sides at -6 and -2. A 2 m rise over 8 m from Z -4 sets the Z slope to 0.25 and origin height to 1 m. The 2^-800 and 2^800 X spans with a unit rise have exact reciprocal slopes and a 2 m width at Z ±1.
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
  const ramp: IAutoMovieWorldSurface = AutoMovieEngineWorld.ramp(input);
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
  for (const span of [2 ** -800, 2 ** 800]) {
    const extreme: IAutoMovieWorldSurface = AutoMovieEngineWorld.ramp({
      ...input,
      from: { x: 0, z: 0 },
      to: { x: span, z: 0 },
      width: 2,
      rise: 1,
    });
    TestValidator.predicate(
      `centerline ${span} retains its exact width and reciprocal slope`,
      extreme.height.kind === "plane" &&
        nclose(extreme.height.originHeight, 0, 0) &&
        nclose(extreme.height.slopeX, 1 / span, 0) &&
        nclose(extreme.height.slopeZ, 0, 0) &&
        extreme.polygon.length === 4 &&
        nclose(extreme.polygon[0]!.z, 1, 0) &&
        nclose(extreme.polygon[1]!.x, span, 0) &&
        nclose(extreme.polygon[1]!.z, 1, 0) &&
        nclose(extreme.polygon[2]!.z, -1, 0) &&
        nclose(extreme.polygon[3]!.z, -1, 0),
    );
  }

  for (const [label, overrides] of [
    ["coincident endpoints", { to: input.from }],
    ["zero width", { width: 0 }],
  ] satisfies readonly [string, Partial<IAutoMovieWorldRamp.IInput>][])
    TestValidator.predicate(
      label,
      throwsError(
        () => AutoMovieEngineWorld.ramp({ ...input, ...overrides }),
        "requires finite distinct endpoints",
      ),
    );
  for (const [label, overrides] of [
    [
      "the width rounds away at both endpoints",
      { from: { x: 2 ** 55, z: -4 }, to: { x: 2 ** 55, z: 4 } },
    ],
    ["the top height overflows", { baseHeight: 2 ** 1023, rise: 2 ** 1023 }],
  ] satisfies readonly [string, Partial<IAutoMovieWorldRamp.IInput>][])
    TestValidator.predicate(
      label,
      throwsError(
        () => AutoMovieEngineWorld.ramp({ ...input, ...overrides }),
        "requires representable footprint",
      ),
    );
}
