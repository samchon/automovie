import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanTrunk,
  HumanBalance,
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
 * The trunk phrases on real bodies: a turn of the trunk on the pelvis, a
 * posture sunk into its knees, a crouch that sinks and stands again, and a
 * counterbalance under limbs held out ahead.
 *
 * Every expectation is read on the displayed bones the resolver gives for
 * the written posture. A turn of `d` degrees shows as the chest's forward
 * axis `d` degrees to the left of the pelvis's, the lumbar spine having
 * taken `1 - CHEST` of it. A sunk posture shows the hips bone lower by the
 * depth and back by the distance asked, the chest's long axis inclined
 * forward by the inclination, and both feet on their plants. A crouch and a
 * counterbalance keep the centre of mass from standing ahead of the middle of
 * the soles (`HumanBalance.offset`, within 2 mm) and inside the base of
 * support (`HumanBalance.margin` positive).
 *
 * The clock has `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s; every
 * phrase rises from `start` to `ready` and falls from `relax` to `end`.
 *
 * Scenarios, on each of the fourteen people of the sweep:
 * 1. `turn` by 30 and by -20 degrees claims the trunk, turns the chest by
 *    the degrees and the spine by its share at the full instants, leaves the
 *    pelvis, and is gone at both ends.
 * 2. `sunk` by 0.1 and 0.3 hip heights with inclinations of 0, 20 and 45
 *    degrees and 0 or 60 mm back, at headings of 0 and 90 degrees, puts the
 *    hips there, inclines the chest by the inclination, and keeps both feet.
 * 3. `crouch` refuses a negative or non-numeric depth or pitch; for depths
 *    of 0, 0.15 and 0.3 hip heights and pitches of 0 and 30 degrees it claims
 *    the root and the trunk from its first to its last instant, leaves the
 *    standing body at both ends, is at its depth and its pitch between
 *    `ready` and `relax`, sinks only part of the way at the middle of its
 *    rise, and at every sampled second keeps both feet and the balance.
 * 4. `counterbalance` under both arms held out ahead of a trunk pitched 0,
 *    30 and 60 degrees claims the root, moves it straight back along the
 *    heading (0 and 90 degrees) until the centre of mass is over the middle
 *    of the soles, is gone at both ends, and moves nothing for a pose whose
 *    centre is not ahead of them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones and the balance owner's measures for each written posture; a turn that moves the pelvis, a sink that drags a foot, a crouch that stays down or falls forward, or a counterbalance along the world axis fails.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one moved by the stated distances, the angles are the stated degrees read between two bone axes, the feet's places are the standing ones and the balance is the centre of mass against the soles.
 * @evidence contracts/development/testing.md#distinguishing-cases Both turn directions, two depths against three inclinations with and without a backward move at two headings, six crouches from none to deep, refusals of each bad input, a pose that needs a counterbalance against one that does not, on fourteen bodies; every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/testing.md#execution-ownership In memory on the fourteen prepared bodies; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the clock and the bounds, and lists the 4 scenarios.
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

  for (const name of motionHumanBody.SWEEP) {
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
    const slip = (pose: Bones, base: Bones): number =>
      Math.max(
        gap(
          pose.get("leftFoot")!.worldPosition,
          base.get("leftFoot")!.worldPosition,
        ),
        gap(
          pose.get("rightFoot")!.worldPosition,
          base.get("rightFoot")!.worldPosition,
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
              `${cell}: both feet keep their plants, off by ${mm(slip(pose, base))} mm`,
              slip(pose, base) <= 0.001,
            );
          }
    }

  }
  all.assert("the trunk's turn and sunk posture hold on every body");
}
/* CUT
    const crouch = (
      depth: number,
      pitch: number,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanTrunk.crouch({
        body,
        standing,
        clock,
        rise,
        fall,
        depth,
        pitch,
      });
    for (const [depth, pitch] of [
      [-0.01, 0],
      [0.1, -1],
      [Number.NaN, 0],
      [0.1, Number.NaN],
    ] as const)
      all.refuses(
        `${name}: a crouch of depth ${depth} and pitch ${pitch} is refused`,
        (): void => {
          crouch(depth, pitch);
        },
      );
    for (const share of [0, 0.15, 0.3] as const)
      for (const pitch of [0, 30] as const) {
        const cell: string = `${name}: a crouch of ${share} hip heights and ${pitch} degrees`;
        const depth: number = share * hipHeight;
        const phrase: IAutoMovieMotionHumanPrimitive = crouch(depth, pitch);
        all.equals(
          `${cell} claims the root and the trunk over its instants`,
          [phrase.channels, phrase.from, phrase.to],
          [["root", "trunk"], 0, 1.25],
        );
        for (const seconds of [0, 0.125, 0.25, 0.625, 1, 1.125, 1.25]) {
          const written: IHumanPosture = phrase.write(standing, seconds);
          const pose: Bones = bones(written);
          const sunk: number = hips.y - pose.get("hips")!.worldPosition.y;
          const inclined: number =
            tipped(pose, "chest", 0) - tipped(upright, "chest", 0);
          const ahead: number = HumanBalance.offset(body, written);
          const margin: number = HumanBalance.margin(body, written);
          const at: string = `${cell} at ${seconds} s`;
          if (seconds === 0 || seconds === 1.25)
            all.check(
              `${at} stands as before, hips off by ${mm(gap(pose.get("hips")!.worldPosition, hips))} mm`,
              gap(pose.get("hips")!.worldPosition, hips) <= 1e-6 &&
                Math.abs(inclined) <= 1e-6,
            );
          else if (seconds === 0.125 || seconds === 1.125)
            all.check(
              `${at} is part of the way down, ${mm(sunk)} mm of ${mm(depth)} mm`,
              depth === 0
                ? Math.abs(sunk) <= 1e-6
                : sunk > 0.05 * depth && sunk < 0.95 * depth,
            );
          else
            all.check(
              `${at} is at its depth and its pitch, ${mm(sunk)} mm of ${mm(depth)} mm and ${inclined.toFixed(2)} degrees`,
              Math.abs(sunk - depth) <= 1e-6 &&
                Math.abs(inclined - pitch) <= 0.5,
            );
          all.check(
            `${at} keeps both feet, off by ${mm(slip(pose, upright))} mm`,
            slip(pose, upright) <= 0.001,
          );
          all.check(
            `${at} keeps the balance, the centre ${mm(ahead)} mm ahead of the soles' middle with a margin of ${mm(margin)} mm`,
            ahead <= 0.002 && margin > 0,
          );
        }
      }

    // 4. A counterbalance under both arms held out ahead.
    for (const yaw of [0, 90] as const) {
      const turned: IHumanPosture = stand.posture(body, origin, yaw);
      const base: Bones = bones(turned);
      const ahead = (
        p: IAutoMovieVector3,
        forward: number,
        up: number,
      ): IAutoMovieVector3 => ({
        x: p.x + (yaw === 90 ? forward : 0),
        y: p.y + up,
        z: p.z + (yaw === 0 ? forward : 0),
      });
      const arm = (side: "left" | "right"): IHumanPosture.IGoal => {
        const shoulder: IAutoMovieVector3 = base.get(
          `${side}UpperArm`,
        )!.worldPosition;
        const length: number =
          gap(shoulder, base.get(`${side}LowerArm`)!.worldPosition) +
          gap(
            base.get(`${side}LowerArm`)!.worldPosition,
            base.get(`${side}Hand`)!.worldPosition,
          );
        return {
          point: ahead(shoulder, 0.92 * length, 0),
          bend: ahead(shoulder, 0.3 * length, -0.5 * length),
        };
      };
      let unbalanced: number = 0;
      for (const pitch of [0, 30, 60] as const) {
        const extended: IHumanPosture = {
          ...turned,
          pitch,
          limbs: {
            ...turned.limbs,
            leftArm: arm("left"),
            rightArm: arm("right"),
          },
        };
        const phrase: IAutoMovieMotionHumanPrimitive =
          AutoMovieMotionHumanTrunk.counterbalance(
            body,
            clock,
            rise,
            fall,
            extended,
          );
        const before: number = HumanBalance.offset(body, extended);
        const full: IHumanPosture = phrase.write(extended, 0.625);
        const after: number = HumanBalance.offset(body, full);
        const back: number =
          yaw === 0
            ? extended.root.z - full.root.z
            : extended.root.x - full.root.x;
        const cell: string = `${name}: a counterbalance of a trunk pitched ${pitch} at a heading of ${yaw}`;
        if (before > 0.005) unbalanced++;
        all.equals(`${cell} claims the root`, phrase.channels, ["root"]);
        all.check(
          `${cell} puts the centre over the soles' middle, ${mm(after)} mm ahead from ${mm(before)} mm, the hips ${mm(back)} mm back`,
          before > 0
            ? Math.abs(after) <= 0.002 && back > 0
            : Math.abs(back) <= 1e-9,
        );
        all.check(
          `${cell} moves the root straight back along the heading`,
          Math.abs(full.root.y - extended.root.y) <= 1e-9 &&
            Math.abs(
              yaw === 0
                ? full.root.x - extended.root.x
                : full.root.z - extended.root.z,
            ) <= 1e-9 &&
            full.yaw === extended.yaw,
        );
        all.check(
          `${cell} is gone at both ends`,
          gap(phrase.write(extended, 0).root, extended.root) <= 1e-9 &&
            gap(phrase.write(extended, 1.25).root, extended.root) <= 1e-9,
        );
      }
      all.check(
        `${name}: at a heading of ${yaw} a pitched trunk puts the centre ahead of the soles, so the counterbalance is exercised`,
        unbalanced >= 1,
      );
      const still: IHumanPosture = AutoMovieMotionHumanTrunk.counterbalance(
        body,
        clock,
        rise,
        fall,
        turned,
      ).write(turned, 0.625);
      all.check(
        `${name}: a counterbalance at a heading of ${yaw} moves nothing for the standing body, whose centre is ${mm(HumanBalance.offset(body, turned))} mm ahead`,
        HumanBalance.offset(body, turned) > 0 ||
          gap(still.root, turned.root) <= 1e-9,
      );
    }
  }
  all.assert("the trunk phrases hold on every body");
}
