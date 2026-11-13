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
 * The trunk's crouch on real bodies: the hips sink and the trunk inclines
 * over them, the body stands again, and the feet and the balance hold all
 * the way.
 *
 * Every expectation is read on the displayed bones the resolver gives for
 * the written posture. A foot's plant is the ball of the foot, the toes'
 * joint: the stance's leg goal holds its contact there (`stand.legs`), and
 * the heel may rise about it when the shank leans past the ankle's range
 * (`HumanFoot.heelOff`), so the toes bone is read and not the ankle. The
 * balance is the centre of mass against the soles: not ahead of their
 * middle (`HumanBalance.offset`, within 2 mm) and inside the base of support
 * (`HumanBalance.margin` positive).
 *
 * The clock has `ready` at 0.25 s, `relax` at 1 s and `end` at 1.25 s; the
 * crouch sinks from `start` to `ready` and stands from `relax` to `end`.
 *
 * Scenarios, on the average man and the small woman, the two ends of the
 * stature, which is what a depth in hip heights scales with; six crouches
 * at seven instants each make 42 solved postures a body, with a balance
 * solve per crouch, so two bodies keep the test under a minute:
 * 1. `crouch` refuses a negative or non-numeric depth or pitch.
 * 2. For depths of 0, 0.15 and 0.3 hip heights and pitches of 0 and 30
 *    degrees it claims the root and the trunk from its first to its last
 *    instant, leaves the standing body at both ends, is at its depth and its
 *    pitch between `ready` and `relax`, and sinks only part of the way at the
 *    middle of its rise.
 * 3. At every sampled second both feet keep their plants within 1 mm and the
 *    body keeps its balance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones and the balance owner's measures for each written posture; a crouch that stays down, drags a planted foot or falls forward fails.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one lowered by the stated depth, the pitch is the stated degrees read between two bone axes, the plants are the standing ones and the balance is the centre of mass against the soles.
 * @evidence contracts/development/testing.md#distinguishing-cases Six crouches from none to deep with and without a pitch, both ends, both middles and the held span, refusals of each bad input, on two bodies. The turn and the sunk posture are `test_human_motion_compose_trunk`'s, the counterbalance `test_human_motion_compose_trunk_counterbalance`'s.
 * @evidence contracts/development/testing.md#execution-ownership In memory on two prepared bodies; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, which point a plant is, the clock, the bounds, why two bodies are enough and the 3 scenarios.
 */
export function test_human_motion_compose_trunk_crouch(): void {
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
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(2);

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    // Degrees the chest's long axis tips ahead of world +Y.
    const tipped = (pose: Bones): number => {
      const u: IAutoMovieVector3 = Quaternion.rotateVector(
        pose.get("chest")!.worldRotation,
        { x: 0, y: 1, z: 0 },
      );
      return Math.atan2(u.z, u.y) * DEG;
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
    const standing: IHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const upright: Bones = bones(standing);
    const hips: IAutoMovieVector3 = upright.get("hips")!.worldPosition;
    const hipHeight: number = body.measure.hipHeight;
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

    // 1. Refusals.
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

    // 2 and 3. The crouch over its clock.
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
          const inclined: number = tipped(pose) - tipped(upright);
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
            `${at} keeps both feet on their plants, the farther ball off by ${mm(slip(pose, upright))} mm`,
            slip(pose, upright) <= 0.001,
          );
          all.check(
            `${at} keeps the balance, the centre ${mm(ahead)} mm ahead of the soles' middle with a margin of ${mm(margin)} mm`,
            ahead <= 0.002 && margin > 0,
          );
        }
      }
  }
  all.assert("the trunk's crouch holds on every body");
}
