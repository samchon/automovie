import { AutoMovieArchetypeFrame } from "@automovie/archetypes";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../../internal/predicates";

/**
 * `AutoMovieArchetypeFrame.facing` builds a frame whose +Y is `out` and +X the
 * part of `along` perpendicular to it, +Z completing a right-handed basis.
 *
 * Scenarios:
 *
 * 1. Out (0, 0, 2), along (1, 1, 0): +Y = +Z, +X = (1, 1, 0)/√2 with its +Z part
 *    (none) removed, +Z = X × Y.
 * 2. With no `along` and out along +X, the hint is world +Z, so +X = +Z.
 * 3. A subnormal along component perpendicular to +Z still sets +X.
 * 4. Zero, parallel and antiparallel directions, or a nonfinite origin, refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the dominant normal, projected hint, default axis, subnormal direction and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public facing operation and reads the returned origin and rotated axes. Exercises the default route and malformed frames directly.
 * @evidence contracts/development/testing.md#independent-expectations A diagonal in the perpendicular plane has equal 1/sqrt(2) components. The cross product supplies the right-handed third axis. The default off the X axis, subnormal separation and represented parallel refusals distinguish normalization branches.
 */
export function test_archetypes_core_frame_facing(): void {
  const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.facing(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 2 },
    { x: 1, y: 1, z: 0 },
  );
  const x: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(frame, "x");
  const y: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(frame, "y");
  const z: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(frame, "z");
  TestValidator.predicate(
    "the out and along axes",
    vclose(y, { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(x, { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 }, 1e-12) &&
      vclose(z, { x: Math.SQRT1_2, y: -Math.SQRT1_2, z: 0 }, 1e-12) &&
      vclose(frame.translation, { x: 0, y: 1, z: 0 }),
  );
  const sideways: IAutoMovieTransform = AutoMovieArchetypeFrame.facing(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.predicate(
    "the default hint off the X axis",
    vclose(
      AutoMovieArchetypeFrame.axis(sideways, "x"),
      { x: 0, y: 0, z: 1 },
      1e-12,
    ),
  );

  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const front: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const across: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const nearParallel: IAutoMovieTransform = AutoMovieArchetypeFrame.facing(
    origin,
    front,
    { x: 1e-320, y: 0, z: 1 },
  );
  TestValidator.predicate(
    "subnormal direction sets the across axis",
    vclose(AutoMovieArchetypeFrame.axis(nearParallel, "x"), across, 1e-12),
  );

  const invalid: [
    name: string,
    at: IAutoMovieVector3,
    out: IAutoMovieVector3,
    along: IAutoMovieVector3,
  ][] = [
    ["zero out", origin, origin, across],
    ["zero along", origin, front, origin],
    ["parallel", origin, front, front],
    ["antiparallel", origin, front, { x: 0, y: 0, z: -2 }],
    ["nonfinite origin", { ...origin, x: Number.NaN }, front, across],
  ];
  const admitted: string[] = [];
  for (const [name, at, out, along] of invalid)
    if (
      !throwsError((): IAutoMovieTransform =>
        AutoMovieArchetypeFrame.facing(at, out, along),
      )
    )
      admitted.push(name);
  TestValidator.equals("all invalid frames refused", admitted, []);
}
