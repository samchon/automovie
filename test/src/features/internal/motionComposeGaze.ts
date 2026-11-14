import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanGaze,
  HumanGaze,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The gaze primitives on real bodies: the eyes, and the head when it may
 * join, brought onto a point.
 *
 * The contract (Freedman 2008 for the split): each eye's forward axis meets
 * the target while the target is inside what the recruited segments can
 * hold; the eyes hold the first `HumanGaze.EYES` degrees alone, so a nearer
 * target leaves the head still and a farther one leaves the eyes at most
 * that far off the head's facing on each axis (plus the eyes' convergence on
 * a target 2 m away, under 1.5 degrees); the head and neck take at most
 * `HumanGaze.HEAD`; the trunk is never turned by this primitive, so a target
 * behind the shoulder stays visibly short; the limbs are not touched.
 *
 * A target is placed 2 m from the midpoint of the standing eyes at a yaw
 * (positive to the performer's left, +X for a body facing +Z) and a pitch
 * (positive down). An eye's error is the angle between its displayed forward
 * axis and the line from its displayed place to the target.
 *
 * Scenarios, on one body of the sweep (the `test_human_motion_compose_gaze_*`
 * specs run one body each):
 * 1. `look` at full weight with the head recruited puts both eyes on targets
 *    at (0, 0), (10, 0), (-12, 8), (40, 0), (-50, 20), (0, -25) and (60, 30)
 *    within 0.5 degrees, keeps the head still for the three within the eyes'
 *    share and turns it toward the others while the eyes stay within their
 *    share of the head's facing, and never turns the chest or moves a limb.
 * 2. With the eyes alone the head stays still for every target; the eyes
 *    reach (40, 0) and fall short of (-50, 20), which is beyond their range.
 * 3. A target at (150, 0) stays short by more than 20 degrees with the head
 *    recruited, the head turned no more than its share.
 * 4. The weight scales the shift: none at 0, the head part of the way at
 *    0.5, and a weight outside [0, 1] reads as the nearer end.
 * 5. `look` claims the head over its span and reads its target with the
 *    posture and the second written; `glance` writes from its rise's first
 *    instant to its fall's last, is on the target between, is gone at both
 *    ends, recruits the head by default and only the eyes when asked.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reads the owner's results on a real body through the public functions and the resolver, as the scenarios state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body's cells, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its numbers; no cell is sampled away for time.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export function motionComposeGaze(name: motionHumanBody.Name): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const RAD: number = Math.PI / 180;
  const all: motionComplaints.IGatherer = motionComplaints();
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const angle = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.acos(
      Math.min(
        1,
        Math.max(
          -1,
          (a.x * b.x + a.y * b.y + a.z * b.z) /
            (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z)),
        ),
      ),
    ) / RAD;
  const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    const standing: IHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const upright: Bones = bones(standing);
    const facing = (
      pose: Bones,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(pose.get(bone)!.worldRotation, FORWARD);
    // Degrees a bone has turned from where the standing body has it.
    const turned = (pose: Bones, bone: AutoMovieHumanoidBone): number =>
      Math.max(
        angle(facing(pose, bone), facing(upright, bone)),
        angle(
          Quaternion.rotateVector(pose.get(bone)!.worldRotation, UP),
          Quaternion.rotateVector(upright.get(bone)!.worldRotation, UP),
        ),
      );
    // Degrees the head faces to the side of the pelvis, about the vertical.
    const swung = (pose: Bones): number =>
      Math.abs(
        Math.atan2(facing(pose, "head").x, facing(pose, "head").z) / RAD,
      );
    const middle: IAutoMovieVector3 = {
      x:
        (upright.get("leftEye")!.worldPosition.x +
          upright.get("rightEye")!.worldPosition.x) /
        2,
      y:
        (upright.get("leftEye")!.worldPosition.y +
          upright.get("rightEye")!.worldPosition.y) /
        2,
      z:
        (upright.get("leftEye")!.worldPosition.z +
          upright.get("rightEye")!.worldPosition.z) /
        2,
    };
    const place = (yaw: number, pitch: number): IAutoMovieVector3 => ({
      x: middle.x + 2 * Math.cos(pitch * RAD) * Math.sin(yaw * RAD),
      y: middle.y - 2 * Math.sin(pitch * RAD),
      z: middle.z + 2 * Math.cos(pitch * RAD) * Math.cos(yaw * RAD),
    });
    // The worse eye's angle off the line to the target, degrees.
    const miss = (pose: Bones, target: IAutoMovieVector3): number =>
      Math.max(
        ...(["leftEye", "rightEye"] as const).map((eye): number => {
          const at: IAutoMovieVector3 = pose.get(eye)!.worldPosition;
          return angle(facing(pose, eye), {
            x: target.x - at.x,
            y: target.y - at.y,
            z: target.z - at.z,
          });
        }),
      );
    // The worse eye's angle off the head's facing, degrees.
    const eccentricity = (pose: Bones): number =>
      Math.max(
        angle(facing(pose, "leftEye"), facing(pose, "head")),
        angle(facing(pose, "rightEye"), facing(pose, "head")),
      );
    const look = (
      target: IAutoMovieVector3,
      recruit: AutoMovieMotionHumanGaze.Recruit,
      weight: number,
    ): IHumanPosture =>
      AutoMovieMotionHumanGaze.look({
        body,
        recruit,
        from: 0.5,
        to: 2,
        target: (): IAutoMovieVector3 => target,
        weight: (): number => weight,
      }).write(standing, 1);
    const untouched = (posture: IHumanPosture, pose: Bones): boolean =>
      JSON.stringify(posture.limbs) === JSON.stringify(standing.limbs) &&
      turned(pose, "chest") <= 1e-3 &&
      turned(pose, "spine") <= 1e-3 &&
      posture.yaw === standing.yaw;

    // 1. Head recruited, and 2. the eyes alone.
    for (const [yaw, pitch] of [
      [0, 0],
      [10, 0],
      [-12, 8],
      [40, 0],
      [-50, 20],
      [0, -25],
      [60, 30],
    ] as const) {
      const cell: string = `${name}: a look at (${yaw}, ${pitch})`;
      const target: IAutoMovieVector3 = place(yaw, pitch);
      const near: boolean =
        Math.abs(yaw) <= HumanGaze.EYES && Math.abs(pitch) <= HumanGaze.EYES;
      const joined: IHumanPosture = look(target, "head", 1);
      const pose: Bones = bones(joined);
      const head: number = turned(pose, "head");
      all.check(
        `${cell} with the head puts the eyes on it, off by ${miss(pose, target).toFixed(3)} degrees`,
        miss(pose, target) <= 0.5,
      );
      all.check(
        `${cell} with the head turns the head ${head.toFixed(2)} degrees and leaves the eyes ${eccentricity(pose).toFixed(2)} degrees off it`,
        near
          ? head <= 1e-3
          : head > 1 &&
              head <= Math.hypot(Math.abs(yaw), Math.abs(pitch)) &&
              eccentricity(pose) <= Math.SQRT2 * HumanGaze.EYES + 1.5,
      );
      all.check(
        `${cell} with the head turns no trunk and moves no limb`,
        untouched(joined, pose),
      );
      const alone: IHumanPosture = look(target, "eyes", 1);
      const eyed: Bones = bones(alone);
      const reachable: boolean = Math.abs(yaw) <= 44 && Math.abs(pitch) <= 29;
      all.check(
        `${cell} with the eyes alone keeps the head and the trunk, the eyes off by ${miss(eyed, target).toFixed(3)} degrees`,
        turned(eyed, "head") <= 1e-3 &&
          turned(eyed, "neck") <= 1e-3 &&
          untouched(alone, eyed) &&
          (reachable ? miss(eyed, target) <= 0.5 : true) &&
          (Math.abs(yaw) >= 50 ? miss(eyed, target) > 3 : true),
      );
    }

    // 3. A target behind the shoulder.
    const behind: IAutoMovieVector3 = place(150, 0);
    const short: IHumanPosture = look(behind, "head", 1);
    const shortPose: Bones = bones(short);
    all.check(
      `${name}: a look behind the shoulder stays short by ${miss(shortPose, behind).toFixed(1)} degrees with the head turned ${swung(shortPose).toFixed(1)} to the side`,
      miss(shortPose, behind) > 20 &&
        swung(shortPose) <= HumanGaze.HEAD.yaw + 0.5 &&
        swung(shortPose) > 30 &&
        untouched(short, shortPose),
    );

    // 4. The weight.
    const far: IAutoMovieVector3 = place(40, 0);
    const full: number = turned(bones(look(far, "head", 1)), "head");
    const half: number = turned(bones(look(far, "head", 0.5)), "head");
    all.check(
      `${name}: a weight scales the shift, the head turned ${half.toFixed(2)} of ${full.toFixed(2)} degrees at half`,
      turned(bones(look(far, "head", 0)), "head") <= 1e-3 &&
        miss(bones(look(far, "head", 0)), far) > 30 &&
        half > 0.25 * full &&
        half < 0.75 * full &&
        Math.abs(turned(bones(look(far, "head", 2)), "head") - full) <= 1e-3 &&
        turned(bones(look(far, "head", -1)), "head") <= 1e-3,
    );

    // 5. The span, the target's arguments and the glance.
    const asked: [IHumanPosture, number][] = [];
    const seen: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanGaze.look({
      body,
      recruit: "head",
      from: 0.5,
      to: 2,
      target: (posture: IHumanPosture, seconds: number): IAutoMovieVector3 => {
        asked.push([posture, seconds]);
        return far;
      },
      weight: (): number => 1,
    });
    seen.write(standing, 1.5);
    all.check(
      `${name}: a look claims the head over its span and reads its target with the posture and the second`,
      JSON.stringify([seen.channels, seen.from, seen.to]) ===
        JSON.stringify([["head"], 0.5, 2]) &&
        asked.length >= 1 &&
        asked.every(
          ([posture, seconds]: [IHumanPosture, number]): boolean =>
            posture === standing && seconds === 1.5,
        ),
    );
    const glance: IAutoMovieMotionHumanPrimitive =
      AutoMovieMotionHumanGaze.glance(
        body,
        clock,
        ["ready", "strokeStart"],
        ["strokeEnd", "relax"],
        (): IAutoMovieVector3 => far,
      );
    const eyes: IAutoMovieMotionHumanPrimitive =
      AutoMovieMotionHumanGaze.glance(
        body,
        clock,
        ["ready", "strokeStart"],
        ["strokeEnd", "relax"],
        (): IAutoMovieVector3 => far,
        "eyes",
      );
    const on: Bones = bones(glance.write(standing, 0.625));
    all.check(
      `${name}: a glance is on its target between its windows, off by ${miss(on, far).toFixed(3)} degrees, and gone at both ends`,
      JSON.stringify([glance.channels, glance.from, glance.to]) ===
        JSON.stringify([["head"], 0.25, 1]) &&
        miss(on, far) <= 0.5 &&
        turned(on, "head") > 10 &&
        [0.25, 1].every(
          (seconds: number): boolean =>
            turned(bones(glance.write(standing, seconds)), "head") <= 1e-3 &&
            miss(bones(glance.write(standing, seconds)), far) > 30,
        ),
    );
    all.check(
      `${name}: a glance of the eyes alone keeps the head and is on its target`,
      turned(bones(eyes.write(standing, 0.625)), "head") <= 1e-3 &&
        miss(bones(eyes.write(standing, 0.625)), far) <= 0.5,
    );
  }
  all.assert(`the gaze holds on every body (${name})`);
}
