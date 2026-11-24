import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
} from "@automovie/interface";
import { crutchSitKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** A leg straight. */
const STRAIGHT: IAutoMovieHumanLimbReference = {
  upper: [0, 0, 0],
  lower: [0, 0, 0],
};

/** A leg held, the hip 30 and the knee 80 degrees. */
const HELD: IAutoMovieHumanLimbReference = {
  upper: [30, 0, 0],
  lower: [80, 0, 0],
};

/** Two hand goals a metre apart. */
const NEAR: IAutoMovieHumanLimbGoal = {
  point: { x: 0, y: 1, z: 0 },
  bend: { x: 0, y: 0, z: 1 },
};
const FAR: IAutoMovieHumanLimbGoal = {
  point: { x: 1, y: 1, z: 0 },
  bend: { x: 0, y: 0, z: 1 },
};

/**
 * The crutch sit's kit helpers: a held leg's angles and a hand goal on a
 * minimum-jerk share between two, clamped to the share's range, and a heading's
 * level forward and side units.
 *
 * Scenarios:
 *
 * 1. Half way the leg is half way, the hip at 15 and the knee at 40; past the end
 *    it is held.
 * 2. Half way the goal is half way; before the start it is the first.
 * 3. Facing +Z (yaw 0) forward is +Z and the left is +X; turned 90 degrees forward
 *    is +X and the right is +Z.
 */
export function test_unit_motions_lexicon_crutch_sit_kit(): void {
  const half: IAutoMovieHumanLimbReference = crutchSitKit.leg(
    0.5,
    STRAIGHT,
    HELD,
  );
  TestValidator.predicate(
    "the leg",
    half.upper[0] === 15 &&
      half.lower[0] === 40 &&
      crutchSitKit.leg(2, STRAIGHT, HELD).lower[0] === 80,
  );
  TestValidator.predicate(
    "the goal",
    vclose(
      crutchSitKit.blend(NEAR, FAR, 0.5).point,
      { x: 0.5, y: 1, z: 0 },
      1e-12,
    ) && vclose(crutchSitKit.blend(NEAR, FAR, -1).point, NEAR.point, 0),
  );
  TestValidator.predicate(
    "the units",
    vclose(crutchSitKit.forward(0), { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(crutchSitKit.lateral(0, "left"), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(crutchSitKit.forward(90), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(crutchSitKit.lateral(90, "right"), { x: 0, y: 0, z: 1 }, 1e-12),
  );
}
