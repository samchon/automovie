import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanRefusal, logRollTurns } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of Ramanujan's formula, metres. */
const ROUNDING: number = 1e-12;

/**
 * `logRollTurns` advances a log roll: `perimeter` is the chest's cross-section
 * perimeter by Ramanujan's approximation of its ellipse, `pi (3 (a + b) -
 * sqrt((3a + b)(a + 3b)))`, and `count` takes the asked half turns or as many
 * as bring the pelvis nearest the place, rounded to the end's parity.
 *
 * Scenarios, a chest 0.32 m broad and 0.22 m deep, half turns of 0.4 m, the
 * roll toward +X from the origin on the back:
 *
 * 1. The perimeter of the 0.16 by 0.11 m half-axis ellipse.
 * 2. Three asked half turns are three; none asked is refused on `halfTurns`.
 * 3. A place 1 m along takes round(2.5) = 3; ending on the back, the even count
 *    nearer, 2.
 * 4. A place 0.1 m along, under half a half turn, is refused on `to`.
 */
export function test_unit_motions_floor_log_roll_turns(): void {
  const a: number = 0.16;
  const b: number = 0.11;
  TestValidator.predicate(
    "Ramanujan's perimeter",
    nclose(
      logRollTurns.perimeter({ chestBreadth: 0.32, chestDepth: 0.22 }),
      Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))),
      ROUNDING,
    ),
  );
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const travel: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const refused = (run: () => unknown, axis: string): boolean => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === axis;
    }
    return false;
  };
  TestValidator.equals(
    "asked",
    logRollTurns.count({ halfTurns: 3 }, 0, 0.4, origin, travel),
    3,
  );
  TestValidator.predicate(
    "none asked",
    refused(
      () => logRollTurns.count({ halfTurns: 0 }, 0, 0.4, origin, travel),
      "halfTurns",
    ),
  );
  const to: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  TestValidator.equals(
    "to a place",
    [
      logRollTurns.count({ to }, 0, 0.4, origin, travel),
      logRollTurns.count({ to, end: "supine" }, 0, 0.4, origin, travel),
    ],
    [3, 2],
  );
  TestValidator.predicate(
    "too near",
    refused(
      () =>
        logRollTurns.count(
          { to: { x: 0.1, y: 0, z: 0 } },
          0,
          0.4,
          origin,
          travel,
        ),
      "to",
    ),
  );
}
