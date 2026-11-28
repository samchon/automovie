import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanTravelCarExit,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  admitCarExitSill
} from "../../../../../packages/motions/src/lexicon/internal/admitCarExitSill";
import {
  stand
} from "../../../../../packages/motions/src/actions/internal/stand";
import {
  verifyCarExitSill
} from "../../../../../packages/motions/src/lexicon/internal/verifyCarExitSill";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * A rotating foot is admitted against a finite material strip in the doorway,
 * with a named failure for a low crossing.
 *
 * Scenarios:
 *
 * 1. At the 30 degree midpoint, a point 0.06 m below and 0.14 m in front of the
 *    ankle drops 0.12196 m, more than the provisional 0.08 m.
 * 2. A strip covering the displayed foot refuses the low crossing. The same strip
 *    away from the actor, or at a safe height, is admitted.
 */
async function materialContact(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const upright: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const foot: IAutoMovieHumanLimbGoal = upright.limbs.leftLeg!;
  const pose = (seconds: number): IAutoMovieMotionHumanPosture => ({
    ...upright,
    limbs: {
      ...upright.limbs,
      leftLeg: {
        ...foot,
        rotation: AutoMovieEngineQuaternion.fromAxisAngle(
          { x: 1, y: 0, z: 0 },
          60 * (1 - seconds),
        ),
        planted: false,
      },
    },
  });
  const pitched = AutoMovieEngineQuaternion.rotateVector(pose(0.5).limbs.leftLeg!.rotation!, {
    x: 0,
    y: -0.06,
    z: 0.14,
  });
  TestValidator.predicate(
    "midpoint toe drops a measured 41.96 mm below ankle-based allowance",
    nclose(-pitched.y - 0.08, (0.06 * Math.sqrt(3)) / 2 + 0.07 - 0.08, 1e-12),
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const through: IAutoMovieMotionObstacleAperture = {
    ...DOOR,
    at: foot.point,
    across: { x: 1, y: 0, z: 0 },
  };
  const params: IAutoMovieMotionHumanTravelCarExit.IParams = {
    through,
    floor: 0,
    sill: { subject: "car", point: "rearSill" },
    bench: { at: frame.position, yaw: 0, depth: 0.6 },
    width: 1,
    turnSeconds: 1,
    clearance: 0.02,
    landingDistance: 0.6,
    duckDegrees: 15,
    stagger: 0.1,
    liftShare: 0.2,
  };
  const check = (x: number, y: number): string | undefined => {
    const param: IAutoMovieAffordance = {
      id: "rearSill",
      kind: "surface",
      extent: null,
      width: 0.18,
      depth: 0.34,
      frame: {
        translation: AutoMovieEngineVector3.add(foot.point, { x, y, z: 0.04 }),
        rotation: frame.rotation,
        scale: { x: 1, y: 1, z: 1 },
      },
    };
    const prop = (): IAutoMovieMotionHumanPropReader => ({
      prop: {
        subject: "car",
        fixed: true,
        points: {},
        frame,
        affordances: [param],
      },
      frame: (): IAutoMovieRigidTransform => frame,
    });
    try {
      verifyCarExitSill(
        {
          body,
          params: {
            ...params,
            through: { ...through, at: { ...through.at, y: through.at.y + y } },
          },
          prop,
          start: 0,
        },
        pose,
        1,
        [0.5],
      );
      return undefined;
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
      return error.reason;
    }
  };
  TestValidator.predicate(
    "posed foot contacts matter only within the named finite strip",
    check(0, -0.08)?.includes("car/rearSill") === true &&
      check(0.4, -0.08) === undefined &&
      check(0, -0.3) === undefined,
  );
  TestValidator.predicate(
    "a different object's patch is not the rear sill",
    check(2, -0.08)?.includes("outside the selected aperture") === true,
  );
}

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines ankle trajectories across a door plane, interior-to-exterior movement and jamb clearance.
 * @evidence contracts/development/testing.md#behavioral-verification Checks two straight inward-to-outward foot paths, then keeps one landing inside and widens the pair beyond its permitted opening.
 * @evidence contracts/development/testing.md#independent-expectations The plane x = 1 intersects the stated path halfway between 0.6 and 1.4. A width 0.8 m with 0.25 m clearance cannot admit the wider fixture.
 */
export async function test_motions_lexicon_travel_car_exit(): Promise<void> {
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
  await materialContact();
}
