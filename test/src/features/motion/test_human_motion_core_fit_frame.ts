import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanLimbFitFrame,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A limb fit is remembered in the root's floor frame: the same posture
 * moved along the floor and turned about the vertical gives the same pose,
 * moved, and reads the remembered fit instead of solving again.
 *
 * Scenarios, on the average man and the small woman, each standing with the
 * right hand reaching a point ahead and to the side:
 * 1. The posture at the origin facing +Z, and the same posture moved 5 m and
 *    turned 37 degrees (root, legs and the hand's goal together): every
 *    joint's world position of the second, moved back, lies within 1e-9 m of
 *    the first's.
 * 2. The second resolution is a memory hit and adds no miss
 *    (`HumanLimbFitFrame.statistics`).
 * 3. Turned by 180 degrees and by -90 degrees, the same holds: the frame has
 *    no preferred heading.
 * 4. A goal attached to a bone stays keyed in the world: the same posture
 *    moved resolves with no hit for that limb (the count of misses grows).
 * 5. Moving the hand's goal by 5 cm in the frame is a miss, not a hit: the
 *    key still reads the goal.
 * 6. Scenarios 1 to 3 again with the hand's goal carrying a rotation and a
 *    contact (a palm the hand turns about): the rotation turns with the
 *    frame and the contact, in the hand's own rest frame, is kept, so the
 *    moved fit is again a hit within 1e-9 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves postures through the public resolver and reads the world joints and the memory's counts: a frame that changes the fit, a key that misses a moved copy, a world-attached goal shared wrongly, or a key blind to the goal is caught.
 * @evidence contracts/development/testing.md#independent-expectations Rigid invariance of a limb fit under a floor translation and a turn about +Y is geometry; the 1e-9 m bound is #3463's acceptance; hits and misses are the memory's own contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, three headings, goals with and without a rotation and a contact, an attached goal kept in the world and a moved goal that must miss; instanced members belong to `test_human_motion_ensemble_instance`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; no performance and no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_human_motion_core_fit_frame(): void {
  const findings: string[] = [];
  const turn = (
    p: IAutoMovieVector3,
    degrees: number,
    by: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const h: number = (degrees * Math.PI) / 180;
    return {
      x: by.x + p.x * Math.cos(h) + p.z * Math.sin(h),
      y: p.y,
      z: by.z - p.x * Math.sin(h) + p.z * Math.cos(h),
    };
  };
  const reaching = (
    body: IHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
    attached: boolean = false,
    nudge: number = 0,
    pivoting: boolean = false,
  ): IHumanPosture => {
    const base: IHumanPosture = stand.posture(body, at, yaw);
    const reach: number = 0.8 * (body.measure.upperArm + body.measure.forearm);
    const goal: IHumanPosture.IGoal = {
      point: turn(
        {
          x: -0.25,
          y: body.measure.shoulderHeight - 0.1,
          z: reach * 0.7 + nudge,
        },
        yaw,
        at,
      ),
      bend: turn(
        { x: -0.6, y: body.measure.shoulderHeight - 0.3, z: 0 },
        yaw,
        at,
      ),
      ...(attached ? { on: CHEST } : {}),
      ...(pivoting
        ? {
            rotation: Quaternion.multiply(
              Quaternion.fromAxisAngle(UP, yaw),
              PALM_TURN,
            ),
            contact: PALM,
          }
        : {}),
    };
    return { ...base, limbs: { ...base.limbs, rightArm: goal } };
  };
  const world = (
    body: IHumanBody,
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, pose);

  for (const [name, pivoting] of [
    ["m-average", false],
    ["f-small", false],
    ["m-average", true],
    ["f-small", true],
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const first: IAutoMoviePose = resolveHumanPosture(
      body,
      reaching(body, origin, 0, false, 0, pivoting),
    );
    const reference: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = world(
      body,
      first,
    );
    for (const [yaw, at] of [
      [37, { x: 5, y: 0, z: 0 }],
      [180, { x: -3, y: 0, z: 2 }],
      [-90, { x: 1, y: 0, z: -4 }],
    ] as const) {
      const before: HumanLimbFitFrame.IStatistics =
        HumanLimbFitFrame.statistics(body);
      const moved: IAutoMoviePose = resolveHumanPosture(
        body,
        reaching(body, at, yaw, false, 0, pivoting),
      );
      const after: HumanLimbFitFrame.IStatistics =
        HumanLimbFitFrame.statistics(body);
      if (after.misses !== before.misses)
        findings.push(
          `${name}${pivoting ? " pivoting" : ""} turned ${yaw}: ${after.misses - before.misses} fits solved again`,
        );
      if (!(after.hits > before.hits))
        findings.push(`${name}${pivoting ? " pivoting" : ""} turned ${yaw}: no fit read from the memory`);
      let worst: number = 0;
      for (const [bone, b] of world(body, moved)) {
        const a: IAutoMovieResolvedBone | undefined = reference.get(bone);
        if (a === undefined) continue;
        const expected: IAutoMovieVector3 = turn(a.worldPosition, yaw, at);
        worst = Math.max(
          worst,
          Math.hypot(
            b.worldPosition.x - expected.x,
            b.worldPosition.y - expected.y,
            b.worldPosition.z - expected.z,
          ),
        );
      }
      if (worst > 1e-9)
        findings.push(
          `${name}${pivoting ? " pivoting" : ""} turned ${yaw}: a joint lies ${worst.toExponential(2)} m from the moved fit`,
        );
    }

    if (pivoting) continue;

    // 4. An attached goal stays in the world.
    resolveHumanPosture(body, reaching(body, origin, 0, true));
    const held: HumanLimbFitFrame.IStatistics =
      HumanLimbFitFrame.statistics(body);
    resolveHumanPosture(body, reaching(body, { x: 7, y: 0, z: 7 }, 0, true));
    if (!(HumanLimbFitFrame.statistics(body).misses > held.misses))
      findings.push(`${name}: an attached goal was shared across places`);

    // 5. A moved goal misses.
    const known: HumanLimbFitFrame.IStatistics =
      HumanLimbFitFrame.statistics(body);
    resolveHumanPosture(body, reaching(body, origin, 0, false, 0.05));
    if (!(HumanLimbFitFrame.statistics(body).misses > known.misses))
      findings.push(`${name}: a goal moved by 5 cm read the remembered fit`);
  }
  TestValidator.equals(
    "a limb fit remembered in the root's frame",
    findings,
    [],
  );
}

/** The bone an attached goal rides in scenario 4. */
const CHEST: AutoMovieHumanoidBone = "chest";

/** The vertical, about which every heading turns. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The hand's rotation from its rest in scenario 6, at heading 0: pitched 35 degrees about the body's cross axis (`Quaternion.fromAxisAngle` reads degrees). */
const PALM_TURN: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
  { x: 1, y: 0, z: 0 },
  -35,
);

/** The palm the hand turns about in scenario 6, in its rest frame from the wrist. */
const PALM: IAutoMovieVector3 = { x: 0, y: -0.08, z: 0.02 };
