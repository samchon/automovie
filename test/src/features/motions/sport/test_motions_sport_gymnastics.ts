import { AutoMovieEngineGravity, AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import {
  GymnasticsFlight
} from "../../../../../packages/motions/src/sport/internal/GymnasticsFlight";
import {
  GymnasticsPalmRise
} from "../../../../../packages/motions/src/sport/internal/GymnasticsPalmRise";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** How late the touchdown bisection may answer, seconds: its stated bracket. */
const BRACKET: number = 1e-4;

/**
 * The band of a standing adult's centre of mass height as a share of stature,
 * about 0.55 to 0.57 (Winter, Biomechanics and Motor Control of Human Movement,
 * 4th ed., 2009, Table 4.1), widened for the rig's own segments.
 */
const STANDING: readonly [number, number] = [0.53, 0.6];

/** Standing at the origin facing +Z: a root is the offset from rest. */
const STAND: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * The gymnastics laws' shared flight and palm staging.
 *
 * Scenarios:
 *
 * 1. Launched from (1, 1, 0) at (2, 4, -1) m/s, the centre is at (2, 3 - g / 8,
 *    -0.5) after 0.5 s; dropped from 1 m it lands at `sqrt(2 / g)` s, and a
 *    height it never reaches has no fall.
 * 2. A lowest point falling as `1 - t` reaches 0.25 m at 0.75 s: the touchdown is
 *    at or after it by at most `BRACKET`.
 * 3. A quarter turn about the origin heads a posture 90 degrees and carries a
 *    world hand goal from +X to -Z; a posture with a roll is refused.
 * 4. The average man's standing centre lies at 0.53 to 0.60 of his stature, and a
 *    tucked posture placed on (1, 2, 3) has its centre there, its joints kept.
 * 5. His lowest point rises exactly 0.5 m with his root, and frozen with the knee
 *    at 40 degrees his pose carries those 40 degrees, his limb goals cleared.
 * 6. A palm laid under a forearm standing straight up rises about its knuckles by
 *    `min(knuckle range, 90 - (wrist range - 5))`, the fingers extending by as
 *    much; the knuckle reads 8 cm along the hand's own +Z however it is
 *    turned.
 */
export async function test_motions_sport_gymnastics(): Promise<void> {
  // 1. The parabola and its fall.
  const g: number = AutoMovieEngineGravity.STANDARD;
  TestValidator.predicate(
    "the flight",
    vclose(
      GymnasticsFlight.at({ x: 1, y: 1, z: 0 }, { x: 2, y: 4, z: -1 }, 0.5),
      { x: 2, y: 3 - g / 8, z: -0.5 },
      1e-12,
    ) &&
      nclose(GymnasticsFlight.fall(1, 0, 0)!, Math.sqrt(2 / g), 1e-12) &&
      GymnasticsFlight.fall(0, 1, 10) === null,
  );

  // 2. The touchdown.
  const found: number = GymnasticsFlight.touchdown(
    0,
    1,
    (t: number): number => 1 - t,
    0.25,
  );
  TestValidator.predicate(
    "the touchdown within its bracket",
    found >= 0.75 && found - 0.75 <= BRACKET,
  );

  // 3. A rigid turn.
  const reaching: IAutoMovieMotionHumanPosture = {
    ...STAND,
    root: { x: 0, y: 1, z: 0 },
    limbs: {
      leftArm: { point: { x: 1, y: 1, z: 0 }, bend: { x: 1, y: 1.2, z: 0 } },
    },
  };
  const turned: IAutoMovieMotionHumanPosture = GymnasticsFlight.turned(
    reaching,
    { x: 0, y: 0, z: 0 },
    90,
    0,
  );
  TestValidator.predicate(
    "turned about the pivot",
    turned.yaw === 90 &&
      vclose(turned.limbs.leftArm!.point, { x: 0, y: 1, z: -1 }, 1e-12) &&
      throwsError(() =>
        GymnasticsFlight.turned(
          { ...reaching, roll: 5 },
          { x: 0, y: 0, z: 0 },
          90,
          0,
        ),
      ),
  );

  // Whole body: the centre, the lowest point and the frozen pose resolve the
  // posture over the full rig, its ROM, colliders and mass model.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");

  // 4. The centre of mass.
  const share: number =
    GymnasticsFlight.centre(body, body.massModel, STAND).y /
    body.measure.stature;
  const tucked: IAutoMovieMotionHumanPosture = {
    ...STAND,
    yaw: 20,
    joints: {
      leftUpperLeg: [90, 0, 0],
      rightUpperLeg: [90, 0, 0],
      leftLowerLeg: [90, 0, 0],
      rightLowerLeg: [90, 0, 0],
    },
  };
  const at: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const placed: IAutoMovieMotionHumanPosture = GymnasticsFlight.placed(
    body,
    body.massModel,
    tucked,
    at,
  );
  TestValidator.predicate(
    "the centre standing and placed",
    share >= STANDING[0] &&
      share <= STANDING[1] &&
      vclose(GymnasticsFlight.centre(body, body.massModel, placed), at, 1e-9) &&
      placed.joints === tucked.joints,
  );

  // 5. The lowest point and the frozen pose.
  const lowest: (posture: IAutoMovieMotionHumanPosture) => number =
    GymnasticsFlight.prepareLowest(body);
  const frozen: ReturnType<typeof GymnasticsFlight.freeze> =
    GymnasticsFlight.freeze(body, {
      ...STAND,
      joints: { rightLowerLeg: [40, 0, 0] },
    });
  const knee: IAutoMovieJointPose | undefined = frozen.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "rightLowerLeg",
  );
  TestValidator.predicate(
    "the lowest point and the frozen knee",
    nclose(
      lowest({ ...STAND, root: { x: 0, y: 0.5, z: 0 } }) - lowest(STAND),
      0.5,
      1e-9,
    ) &&
      knee !== undefined &&
      nclose(knee.flexion ?? 0, 40, 1e-6) &&
      Object.keys(frozen.posture.limbs).length === 0,
  );

  // 6. The palm.
  const wrist: number = -AutoMovieEngineDefaultHumanoidRom.leftHand!.flexion!.min;
  const range: number = -AutoMovieEngineDefaultHumanoidRom.leftIndexProximal!.flexion!.min;
  const expected: number = Math.min(range, Math.max(0, 90 - (wrist - 5)));
  const rise: GymnasticsPalmRise.IRise = GymnasticsPalmRise(
    "left",
    {
      point: { x: 0, y: 0, z: 0 },
      bend: { x: 0, y: 0.3, z: -0.2 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    { x: 0, y: 0.6, z: 0 },
    { x: 0, y: 0, z: 0.08 },
    { x: 0, y: 0, z: 1 },
  );
  const hand = (worldPosition: IAutoMovieVector3): IAutoMovieResolvedBone => ({
    bone: "leftHand",
    localRotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    worldPosition,
    worldRotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  });
  TestValidator.predicate(
    "the palm's rise and its knuckle",
    expected > 0 &&
      nclose(rise.joints.leftIndexProximal![0], -expected, 1e-9) &&
      vclose(
        GymnasticsPalmRise.knuckle(
          hand({ x: 1, y: 1, z: 0 }),
          hand({ x: 1.08, y: 1, z: 0 }),
        ),
        { x: 0, y: 0, z: 0.08 },
        1e-12,
      ),
  );
}
