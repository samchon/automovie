import type { IAutoMovieVector3 } from "@automovie/interface";
import { jumpPath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one quintic Hermite evaluation, metres. */
const ROUNDING: number = 1e-12;

/** A finite-difference step, seconds. */
const STEP: number = 1e-6;

/** The finite difference's truncation over that step, metres per second. */
const DIFFERENCE: number = 1e-5;

/**
 * `jumpPath.prepare` draws the root on a quintic Hermite path between two
 * points and velocities: with both velocities and accelerations at rest it is
 * the minimum-jerk path, `p0 + (p1 - p0) s(u)` with `s(1/2) = 1/2`, and given a
 * start velocity it leaves at that velocity.
 *
 * Scenarios:
 *
 * 1. At its start and end the path is at its two points, and it holds them before
 *    and after.
 * 2. At rest at both ends, its middle second is half way.
 * 3. Given a start velocity, its first derivative there is that velocity.
 */
export function test_unit_motions_actions_jump_path_prepare(): void {
  const rest: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const p0: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const p1: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const at: (t: number) => IAutoMovieVector3 = jumpPath.prepare(
    p0,
    rest,
    p1,
    rest,
    2,
  );

  // 1. The ends, held outside.
  TestValidator.predicate("the start", vclose(at(0), p0, ROUNDING));
  TestValidator.predicate("the end", vclose(at(2), p1, ROUNDING));
  TestValidator.predicate("held before", vclose(at(-1), p0, ROUNDING));
  TestValidator.predicate("held after", vclose(at(5), p1, ROUNDING));

  // 2. Half way at the middle.
  TestValidator.predicate(
    "half way",
    vclose(at(1), { x: 0.5, y: 1, z: 1.5 }, ROUNDING),
  );

  // 3. Leaving at the given velocity.
  const v0: IAutoMovieVector3 = { x: 0.5, y: -1, z: 2 };
  const moving: (t: number) => IAutoMovieVector3 = jumpPath.prepare(
    p0,
    v0,
    p1,
    rest,
    2,
  );
  const ahead: IAutoMovieVector3 = moving(STEP);
  TestValidator.predicate(
    "the start velocity",
    vclose(
      {
        x: (ahead.x - p0.x) / STEP,
        y: (ahead.y - p0.y) / STEP,
        z: (ahead.z - p0.z) / STEP,
      },
      v0,
      DIFFERENCE,
    ),
  );
}
