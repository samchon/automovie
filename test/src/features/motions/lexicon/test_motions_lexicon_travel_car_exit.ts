import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { admitCarExitSill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A rear opening 0.8 m wide in the plane x = 1, outward along +X. */
const DOOR: IAutoMovieMotionObstacleAperture = {
  id: "rearDoor",
  at: { x: 1, y: 0.5, z: 0 },
  across: { x: 0, y: 0, z: 1 },
  width: 0.8,
  height: 1.1,
};

/** A seated foot at an ankle. */
const foot = (
  ankle: IAutoMovieVector3,
): admitCarExitSill.IInput["starts"]["left"] => ({
  ankle,
  bend: { ...ankle, y: ankle.y + 0.4 },
  yaw: 90,
});

/** A landing posture with its leg goals at two ankles. */
const landing = (
  left: IAutoMovieVector3,
  right: IAutoMovieVector3,
): IAutoMovieMotionHumanPosture => ({
  root: { x: 1.5, y: 0.9, z: 0 },
  yaw: 90,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {
    leftLeg: { point: left, bend: left },
    rightLeg: { point: right, bend: right },
  },
});

/**
 * The `HumanTravelCarExit` law's own admission (`admitCarExitSill`): each ankle
 * crosses the sill where its straight course from the seat to its landing meets
 * the opening's plane; both feet start inside and land outside, and the
 * crossing ankles keep the clearance from both jambs.
 *
 * Scenarios:
 *
 * 1. Feet at x = 0.6, 0.1 m either side of the middle, landing at x = 1.4 cross
 *    the sill halfway, at x = 1.
 * 2. A landing foot still inside, or feet so wide that with a 0.25 m clearance
 *    they need more than the 0.8 m opening, are refused.
 */
export function test_motions_lexicon_travel_car_exit(): void {
  const input = (
    gap: number,
    landed: IAutoMovieMotionHumanPosture,
    spread: number,
  ): admitCarExitSill.IInput => ({
    starts: {
      left: foot({ x: 0.6, y: 0.3, z: spread }),
      right: foot({ x: 0.6, y: 0.3, z: -spread }),
    },
    landing: landed,
    through: DOOR,
    gap,
    outward: (p: IAutoMovieVector3): number => p.x - 1,
    along: (p: IAutoMovieVector3): number => p.z,
  });
  const out: IAutoMovieMotionHumanPosture = landing(
    { x: 1.4, y: 0.1, z: 0.1 },
    { x: 1.4, y: 0.1, z: -0.1 },
  );
  const sill: admitCarExitSill.IAnkles = admitCarExitSill(input(0.1, out, 0.1));
  TestValidator.predicate(
    "the sill crossings",
    vclose(sill.left, { x: 1, y: 0.2, z: 0.1 }, 1e-12) &&
      vclose(sill.right, { x: 1, y: 0.2, z: -0.1 }, 1e-12),
  );
  TestValidator.predicate(
    "still inside, or too near a jamb",
    throwsError(() =>
      admitCarExitSill(
        input(
          0.1,
          landing({ x: 0.9, y: 0.1, z: 0.1 }, { x: 1.4, y: 0.1, z: -0.1 }),
          0.1,
        ),
      ),
    ) &&
      throwsError(() =>
        admitCarExitSill(
          input(
            0.25,
            landing({ x: 1.4, y: 0.1, z: 0.2 }, { x: 1.4, y: 0.1, z: -0.2 }),
            0.2,
          ),
        ),
      ),
  );
}
