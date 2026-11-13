import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanTrunk,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The trunk phrases on real bodies: a turn of the trunk on the pelvis, and
 * a posture sunk into its knees.
 *
 * Every expectation is read on the displayed bones the resolver gives for
 * the written posture. A turn of `d` degrees shows as the chest's forward
 * axis `d` degrees to the left of the pelvis's, the lumbar spine having
 * taken `1 - CHEST` of it. A sunk posture shows the hips bone lower by the
 * depth and back by the distance asked, the chest's long axis inclined
 * forward by the inclination, and both feet on their plants. A foot's plant
 * is the ball of the foot, the toes' joint: the stance's leg goal holds its
 * contact there (`stand.legs`), and the heel may rise about it when the
 * shank leans past the ankle's range (`HumanFoot.heelOff`), as it does in a
 * sink with the hips kept over the feet, so the toes bone is read and not
 * the ankle.
 *
 * The clock has `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s; a
 * turn rises from `start` to `ready` and falls from `relax` to `end`.
 *
 * Scenarios, on the average man, the small woman, the short-legged man and
 * the long-legged woman: the ends of the stature and of the legs' share of
 * it, the two measures a turn's share and a sink's knees read. Four bodies
 * of 34 solved postures each keep the test under a minute:
 * 1. `turn` by 30 and by -20 degrees claims the trunk, turns the chest by
 *    the degrees and the spine by its share at the full instants, leaves the
 *    pelvis, and is gone at both ends.
 * 2. `sunk` by 0.1 and 0.3 hip heights with inclinations of 0, 20 and 45
 *    degrees and 0 or 60 mm back, at headings of 0 and 90 degrees, puts the
 *    hips there, inclines the chest by the inclination, and keeps both feet
 *    on their plants within 1 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones for each written posture; a turn that moves the pelvis or a sink that drags a planted foot fails.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one moved by the stated distances, the angles are the stated degrees read between two bone axes, and the plants are the standing ones.
 * @evidence contracts/development/testing.md#distinguishing-cases Both turn directions, two depths against three inclinations with and without a backward move at two headings, on four bodies; every failing cell is named with its body, its parameters and its measured numbers. The crouch is `test_human_motion_compose_trunk_crouch`'s and the counterbalance `test_human_motion_compose_trunk_counterbalance`'s.
 * @evidence contracts/development/testing.md#execution-ownership In memory on four prepared bodies; slow because preparing a body takes seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, which point a plant is, the clock and the bounds, why four bodies are enough, and lists the 2 scenarios.
 */
export function test_human_motion_compose_trunk(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const DEG: number = 180 / Math.PI;
  const all: motionComplaints.IGatherer = motionComplaints();
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.25,
    wait: 0.125,
    attack: 0.25,
    follow: 0.25,
    hold: 0.125,
    retract: 0.25,
  });
  const rise = ["start", "ready"] as const;
  const fall = ["relax", "end"] as const;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(2);

  for (const name of [
    "m-average",
    "f-small",
    "m-short-legged",
    "f-long-legged",
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    const axis = (
      pose: Bones,
      bone: AutoMovieHumanoidBone,
      v: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(pose.get(bone)!.worldRotation, v);
    // Degrees a bone's forward axis points to the left of world +Z.
    const facing = (pose: Bones, bone: AutoMovieHumanoidBone): number => {
      const f: IAutoMovieVector3 = axis(pose, bone, { x: 0, y: 0, z: 1 });
      return Math.atan2(f.x, f.z) * DEG;
    };
    // Degrees a bone's long axis tips ahead of world +Y along a heading.
    const tipped = (
      pose: Bones,
      bone: AutoMovieHumanoidBone,
      yaw: number,
    ): number => {
      const u: IAutoMovieVector3 = axis(pose, bone, { x: 0, y: 1, z: 0 });
      return Math.atan2(yaw === 90 ? u.x : u.z, u.y) * DEG;
    };
    // How far the farther ball of a foot is from its standing plant.
    const slip = (pose: Bones, base: Bones): number =>
      Math.max(
        gap(
          pose.get("leftToes")!.worldPosition,
          base.get("leftToes")!.worldPosition,
        ),
        gap(
          pose.get("rightToes")!.worldPosition,
          base.get("rightToes")!.worldPosition,
        ),
      );
    const standing: IHumanPosture = stand.posture(body, origin, 0);
    const upright: Bones = bones(standing);
    const hips: IAutoMovieVector3 = upright.get("hips")!.worldPosition;
    const hipHeight: number = body.measure.hipHeight;

    // 1. A turn of the trunk on the pelvis.
    for (const degrees of [30, -20] as const) {
      const turn: IAutoMovieMotionHumanPrimitive =
        AutoMovieMotionHumanTrunk.turn(clock, rise, fall, degrees);
      all.equals(
        `${name}: a turn of ${degrees} claims the trunk`,
        turn.channels,
        ["trunk"],
      );
      for (const seconds of [0.25, 0.625, 1] as const) {
        const pose: Bones = bones(turn.write(standing, seconds));
        const chest: number = facing(pose, "chest");
        const spine: number = facing(pose, "spine");
        all.check(
          `${name}: a turn of ${degrees} at ${seconds} s turns the chest by it and the spine by its share, chest ${chest.toFixed(2)} spine ${spine.toFixed(2)} pelvis ${facing(pose, "hips").toFixed(2)}`,
          Math.abs(chest - degrees) <= 1 &&
            Math.abs(spine - (1 - AutoMovieMotionHumanTrunk.CHEST) * degrees) <=
              1 &&
            Math.abs(facing(pose, "hips")) <= 1e-6 &&
            gap(pose.get("hips")!.worldPosition, hips) <= 1e-9,
        );
      }
      for (const seconds of [0, 1.25] as const) {
        const chest: number = facing(
          bones(turn.write(standing, seconds)),
          "chest",
        );
        all.check(
          `${name}: a turn of ${degrees} is gone at ${seconds} s, chest ${chest.toFixed(3)}`,
          Math.abs(chest - facing(upright, "chest")) <= 1e-6,
        );
      }
    }

    // 2. A posture sunk into its knees.
    for (const yaw of [0, 90] as const) {
      const turned: IHumanPosture = stand.posture(body, origin, yaw);
      const base: Bones = bones(turned);
      const was: IAutoMovieVector3 = base.get("hips")!.worldPosition;
      for (const share of [0.1, 0.3] as const)
        for (const inclination of [0, 20, 45] as const)
          for (const back of [0, 0.06] as const) {
            const cell: string = `${name}: sunk by ${share} hip heights, inclined ${inclination}, ${back * 1000} mm back, heading ${yaw}`;
            const pose: Bones = bones(
              AutoMovieMotionHumanTrunk.sunk(
                body,
                turned,
                share * hipHeight,
                inclination,
                back,
              ),
            );
            const off: number = gap(pose.get("hips")!.worldPosition, {
              x: was.x - (yaw === 90 ? back : 0),
              y: was.y - share * hipHeight,
              z: was.z - (yaw === 0 ? back : 0),
            });
            const inclined: number =
              tipped(pose, "chest", yaw) - tipped(base, "chest", yaw);
            all.check(
              `${cell}: the hips are there, off by ${mm(off)} mm`,
              off <= 1e-6,
            );
            all.check(
              `${cell}: the chest is inclined by ${inclined.toFixed(2)} degrees`,
              Math.abs(inclined - inclination) <= 0.5,
            );
            all.check(
              `${cell}: both feet keep their plants, the farther ball off by ${mm(slip(pose, base))} mm`,
              slip(pose, base) <= 0.001,
            );
          }
    }
  }
  all.assert("the trunk's turn and sunk posture hold on every body");
}
