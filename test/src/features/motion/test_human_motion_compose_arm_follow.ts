import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanArmFollow,
  AutoMovieMotionHumanBend,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A planned arm that follows a person (`AutoMovieMotionHumanArmFollow`) is
 * the plan exactly while the person keeps still, and follows the person
 * within the audit's travel bound when they move.
 *
 * The average man stands quietly (`stand.posture`); his right arm's plan
 * holds the wrist 0.4 m ahead of the shoulder at chest height, the goal's
 * own solution, from 0.5 s to 2 s of a 2.5 s span, and returns to rest by
 * 2.5 s. The plan perceived the goal still there. A goal that keeps
 * exactly still is this spec's alone: a partner standing in a film still
 * moves through the shared idle, breathing and sway, which on the partner
 * touches moves the touched site 0.4 to 5.8 mm from where the plan saw it,
 * and the follower follows that as it should.
 *
 * Scenarios, the arm read every 1/240 s:
 * 1. The goal keeps still: the written arm is the plan exactly, at every
 *    reading.
 * 2. The goal sways 60 mm side to side at 0.75 Hz on the hold, a person
 *    rocking on their feet (peak 0.28 m/s): no wrist, elbow or fingertip
 *    moves faster than the audit's travel bound (1.92 m/s); from a quarter
 *    second into the hold to a frame before its end (the correction's
 *    release toward the plan starts within its last frame) the wrist is
 *    within the goal's own travel in one frame (1/30 s) plus a millimetre of
 *    where the goal is, the delay one frame of feedback has by its nature;
 *    and after the span the arm is the plan again.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the follower with a still and a moving goal and reads the displayed bones; a correction left on a still goal, a wrist that lags more than a frame, a step past the travel bound or a plan not rejoined fails with its reading.
 * @evidence contracts/development/testing.md#independent-expectations The plan is the goal's own solution; the bounds are the audit's travel bound and one frame of the goal's own motion, a feedback's delay by its nature; nothing is read from the follower.
 * @evidence contracts/development/testing.md#distinguishing-cases A goal that keeps still, where the correction must be exactly zero, and one that sways, where it must follow within its bounds.
 * @evidence contracts/development/testing.md#execution-ownership In memory, one body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the stance, the plan, the goal's two motions and the 2 scenarios with their bounds.
 */
export function test_human_motion_compose_arm_follow(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const body: IHumanBody = motionHumanBody("m-average");
  const side = "right" as const;
  const base: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const stance: IAutoMoviePose = resolveHumanPosture(body, base);
  const bones = poseBones(body, stance);
  const shoulder: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
  const chest: IAutoMovieVector3 = (bones.get("upperChest") ?? bones.get("chest"))!.worldPosition;
  const still: IAutoMovieVector3 = { x: shoulder.x, y: chest.y, z: shoulder.z + 0.4 };
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(body, base, side, 0);
  const planned: AutoMovieMotionHumanArm.IAngles = AutoMovieMotionHumanArm.angles(
    resolveHumanPosture(body, { ...base, limbs: { ...base.limbs, [`${side}Arm`]: { point: still, bend } } }),
    side,
  );
  const span: { start: number; ready: number; relax: number; end: number } = { start: 0, ready: 0.5, relax: 2, end: 2.5 };
  const written = (arm: AutoMovieMotionHumanArm.IAngles): Map<AutoMovieHumanoidBone, { worldPosition: IAutoMovieVector3 }> => {
    const limbs: IHumanPosture["limbs"] = { ...base.limbs };
    delete limbs[`${side}Arm`];
    return poseBones(
      body,
      resolveHumanPosture(body, {
        ...base,
        limbs,
        joints: { ...base.joints, [`${side}UpperArm`]: arm.upper, [`${side}LowerArm`]: arm.lower, [`${side}Hand`]: arm.hand },
      }),
    );
  };
  const follow = (goal: (seconds: number) => IAutoMovieVector3): ((seconds: number) => AutoMovieMotionHumanArm.IAngles) =>
    AutoMovieMotionHumanArmFollow.follower(
      body,
      {
        side,
        rest: AutoMovieMotionHumanArm.angles(stance, side),
        goal: (_: IHumanPosture, seconds: number): IHumanPosture.IGoal => ({ point: goal(seconds), bend }),
        perceived: (): IHumanPosture.IGoal => ({ point: still, bend }),
        weight: (): number => 1,
      },
      span,
      (): AutoMovieMotionHumanArm.IAngles => planned,
      (): IHumanPosture => base,
    );
  const step: number = 1 / 240;

  // 1. A still goal leaves the plan exactly.
  const resting = follow((): IAutoMovieVector3 => still);
  for (let t: number = 0; t <= span.end + 1e-9; t += step) {
    const arm: AutoMovieMotionHumanArm.IAngles = resting(t);
    complaints.equals(`still, at ${t.toFixed(4)} s: the written arm is the plan`, [arm.upper, arm.lower, arm.hand], [planned.upper, planned.lower, planned.hand]);
  }

  // 2. A swaying goal is followed within its bounds.
  const sway = (seconds: number): IAutoMovieVector3 =>
    seconds <= span.ready || seconds >= span.relax
      ? still
      : { ...still, x: still.x + 0.06 * Math.sin(2 * Math.PI * 0.75 * (seconds - span.ready)) };
  const swaying = follow(sway);
  const frame: number = 1 / 30;
  let previous: Map<AutoMovieHumanoidBone, { worldPosition: IAutoMovieVector3 }> | undefined;
  for (let t: number = 0; t <= span.end + 1e-9; t += step) {
    const shown: Map<AutoMovieHumanoidBone, { worldPosition: IAutoMovieVector3 }> = written(swaying(t));
    if (previous !== undefined)
      for (const bone of [`${side}LowerArm`, `${side}Hand`, `${side}MiddleDistal`] as const) {
        const speed: number = distance(shown.get(bone)!.worldPosition, previous.get(bone)!.worldPosition) / step;
        complaints.check(`swaying, at ${t.toFixed(4)} s: ${bone} moves ${speed.toFixed(2)} m/s, at most ${TRAVEL}`, speed <= TRAVEL + 1e-6);
      }
    if (t >= span.ready + 0.25 && t < span.relax - frame) {
      const lag: number = distance(shown.get(`${side}Hand`)!.worldPosition, sway(t));
      const reach: number = distance(sway(t), sway(t - frame)) + 0.001;
      complaints.check(`swaying, at ${t.toFixed(4)} s: the wrist is ${(lag * 1000).toFixed(1)} mm from the goal, at most ${(reach * 1000).toFixed(1)}`, lag <= reach);
    }
    previous = shown;
  }
  const after: AutoMovieMotionHumanArm.IAngles = swaying(span.end);
  complaints.equals("swaying, at the span's end: the arm is the plan again", [after.upper, after.lower, after.hand], [planned.upper, planned.lower, planned.hand]);
  complaints.assert("a followed arm is the plan while its goal keeps still and follows it within its bounds");
}

/** The tangle audit's travel bound, metres per second: 80 mm in a 1/24 s frame. */
const TRAVEL: number = 0.08 * 24;

/** The distance between two points, metres. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
