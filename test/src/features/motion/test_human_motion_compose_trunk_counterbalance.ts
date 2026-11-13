import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanTrunk,
  HumanBalance,
  HumanRefusal,
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
 * The trunk's counterbalance on real bodies: under limbs held out ahead the
 * hips move straight back along the heading until the centre of mass stands
 * over the feet again, and come forward as the limbs return.
 *
 * The extended postures are the standing one with both arms held out ahead
 * at 0.92 of their length and the whole posture pitched by 0, 30 and 60
 * degrees. A posture's pitch turns the body about its root on the floor, so
 * a pitch of 30 degrees stands the hips about half a hip height ahead of the
 * planted feet: a body that falls forward as it is, and that a person holds
 * as a bow with the hips behind the feet, a place the counterbalance has to
 * find however far back it lies. A pitch of 60 degrees with the hands kept
 * at their places ahead leaves the centre of mass some 0.2 m ahead of the
 * soles' middle wherever the hips go within the legs' reach (measured:
 * 195 mm with the hips 1.19 m back), outside the feet: a pose no standing
 * person holds, which is refused.
 *
 * The balance is `HumanBalance.offset`, the centre of mass ahead of the
 * soles' middle, within 2 mm of it after the shift. The clock has `ready`
 * at 0.25 s, `relax` at 1 s and `end` at 1.25 s.
 *
 * Scenarios, on the average man and the long-armed man, whose arms carry
 * the most mass farthest ahead; each cell costs a balance search of up to
 * some fifty solved postures, so two bodies keep the test under a minute.
 * At headings of 0 and 90 degrees, for the pitches of 0 and 30 degrees
 * (scenarios 1 to 5) and of 60 degrees (scenario 6):
 * 1. The phrase claims the root.
 * 2. At the middle of its hold the centre of mass is over the soles' middle
 *    and the hips have moved back; a pose whose centre is not ahead of the
 *    soles is not moved.
 * 3. The root moves straight back along the heading: not sideways, not up,
 *    and the heading is kept.
 * 4. The phrase is gone at both ends.
 * 5. At each heading at least one pitch puts the centre ahead of the soles,
 *    so the counterbalance is exercised; and the standing body is not moved.
 * 6. The pitch of 60 degrees is refused with a `HumanRefusal` of kind `base`
 *    on the axis `balance`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the balance owner's measure on the written posture; a counterbalance that stops short, moves along the world axis, lifts the body or stays after its end fails.
 * @evidence contracts/development/testing.md#independent-expectations Static balance is the centre of mass over the base of support; the direction is the heading's; none is read from the phrase's solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A pose that needs no shift, one that needs a moderate one and one whose hips start most of a leg's length ahead, at two headings, on two bodies. The crouch's balance is `test_human_motion_compose_trunk_crouch`'s.
 * @evidence contracts/development/testing.md#execution-ownership In memory on two prepared bodies; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the extended postures and what a pitch does to them, the measure and bound, why two bodies are enough and the 5 scenarios.
 */
export function test_human_motion_compose_trunk_counterbalance(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
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

  for (const name of ["m-average", "m-long-armed"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const yaw of [0, 90] as const) {
      const turned: IHumanPosture = stand.posture(body, origin, yaw);
      const base: Bones = poseBones(body, resolveHumanPosture(body, turned));
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
      const extend = (pitch: number): IHumanPosture => ({
        ...turned,
        pitch,
        limbs: {
          ...turned.limbs,
          leftArm: arm("left"),
          rightArm: arm("right"),
        },
      });

      // 6. A body no place of the hips balances is refused. Read at one
      // heading: the search runs its whole range before it refuses, the
      // costliest cell, and the heading's part is scenario 3's.
      if (yaw === 0) {
        let refusal: unknown;
        try {
          AutoMovieMotionHumanTrunk.counterbalance(
            body,
            clock,
            rise,
            fall,
            extend(60),
          );
        } catch (error) {
          refusal = error;
        }
        all.equals(
          `${name}: a counterbalance of a trunk pitched 60 is refused on its balance${refusal instanceof Error ? ` (${refusal.message})` : ""}`,
          refusal instanceof HumanRefusal
            ? [refusal.kind, refusal.axis]
            : "no refusal",
          ["base", "balance"],
        );
      }

      for (const pitch of [0, 30] as const) {
        const extended: IHumanPosture = extend(pitch);
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
  all.assert("the trunk's counterbalance holds on every body");
}
