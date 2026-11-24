import { AutoMovieArchetypeFrame } from "@automovie/archetypes";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `AutoMovieArchetypeFrame.facing` builds a frame whose +Y is `out` and +X
 * the part of `along` perpendicular to it, +Z completing a right-handed basis.
 *
 * Scenarios:
 *
 * 1. out (0, 0, 2), along (1, 1, 0): +Y = +Z, +X = (1, 1, 0)/√2 with its +Z
 *    part (none) removed, +Z = X × Y.
 * 2. With no `along` and out along +X, the hint is world +Z, so +X = +Z.
 */
export function test_unit_archetypes_core_frame_facing(): void {
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
    vclose(AutoMovieArchetypeFrame.axis(sideways, "x"), { x: 0, y: 0, z: 1 }, 1e-12),
  );
}