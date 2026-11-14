import { type IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTrunk,
  HumanBalance,
  HumanRefusal,
  HumanTrunk,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "./motionComplaints";
import { motionComposeTrunk } from "./motionComposeTrunk";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The trunk's counterbalance read on one real body, which the
 * `test_human_motion_compose_trunk_counterbalance_*` specs run one body of
 * the sweep each, on the clock, stance and readings of `motionComposeTrunk`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and by whom; the function states its scenarios and bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the balance owner's measures for written postures; the feasibility is decided by a scan of the hips' places the phrase does not do.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function, a loop over its cells gathering complaints and asserting once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call; the solved postures the function states.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The clock, the stance's place and the distance readings are `motionComposeTrunk`'s.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export namespace motionComposeTrunkCounterbalance {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const { CLOCK, RISE, FALL, ORIGIN, gap, mm } = motionComposeTrunk;
  /**
   * The trunk's counterbalance on one body: under limbs held out ahead the
   * hips move straight back along the heading until the centre of mass
   * stands over the feet again, and come forward as the limbs return.
   *
   * The extended postures are the standing one with both arms held out
   * ahead at 0.92 of their length and the whole posture pitched by 0, 30
   * and 60 degrees. A posture's pitch turns the body about its root on the
   * floor, so a pitch of 30 degrees stands the hips about half a hip height
   * ahead of the planted feet: a body that falls forward as it is, and that
   * a person holds as a bow with the hips behind the feet. The balance is
   * `HumanBalance.offset`, the centre of mass ahead of the soles' middle,
   * within 2 mm of it after the shift.
   *
   * Whether a pose can be balanced at all is decided here, not by the
   * phrase: the hips are moved back along the heading in 5 mm steps for as
   * long as both hip joints stay within a leg's length (thigh and shank) of
   * their planted ankles, and the pose is balanceable when one of those
   * places puts the centre of mass inside the base of support
   * (`HumanBalance.margin` positive).
   *
   * Scenarios, at headings of 0 and 90 degrees, for the pitches of 0 and 30
   * degrees (scenarios 1 to 5) and of 60 degrees at a heading of 0
   * (scenario 6):
   * 1. The phrase claims the root.
   * 2. At the middle of its hold the centre of mass is over the soles'
   *    middle and the hips have moved back; a pose whose centre is not ahead
   *    of the soles is not moved.
   * 3. The root moves straight back along the heading: not sideways, not
   *    up, and the heading is kept.
   * 4. The phrase is gone at both ends.
   * 5. At each heading at least one pitch puts the centre ahead of the
   *    soles, so the counterbalance is exercised; and the standing body is
   *    not moved.
   * 6. The pitch of 60 degrees is refused with a `HumanRefusal` of kind
   *    `base` on the axis `balance` exactly when the scan finds no
   *    balanceable place, and otherwise planned and balanced as scenario 2
   *    reads it.
   *
   * @param name The body.
   */
  export function counterbalance(name: motionHumanBody.Name): void {
    const all: motionComplaints.IGatherer = motionComplaints();
    const body: IHumanBody = motionHumanBody(name);
    const reach: number = body.measure.thigh + body.measure.shank;
    for (const yaw of [0, 90] as const) {
      const turned: IHumanPosture = stand.posture(body, ORIGIN, yaw);
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
      const extend = (pitch: number): IHumanPosture => ({
        ...turned,
        pitch,
        limbs: {
          ...turned.limbs,
          leftArm: arm("left"),
          rightArm: arm("right"),
        },
      });
      // Whether some place of the hips back along the heading, within the
      // legs' reach of their plants, puts the centre inside the base.
      const balanceable = (posture: IHumanPosture): boolean => {
        for (let back: number = 0; ; back += 0.005) {
          const moved: IHumanPosture = {
            ...posture,
            root: ahead(posture.root, -back, 0),
          };
          const trunk: Bones = HumanTrunk.resolve(body, moved);
          const within: boolean = (["left", "right"] as const).every(
            (side: "left" | "right"): boolean =>
              gap(
                trunk.get(`${side}UpperLeg`)!.worldPosition,
                moved.limbs[`${side}Leg`]!.point,
              ) <= reach,
          );
          if (!within) return false;
          if (HumanBalance.margin(body, moved) > 0) return true;
        }
      };
      const read = (pitch: number, cell: string): boolean => {
        const extended: IHumanPosture = extend(pitch);
        const phrase: IAutoMovieMotionHumanPrimitive =
          AutoMovieMotionHumanTrunk.counterbalance(
            body,
            CLOCK,
            RISE,
            FALL,
            extended,
          );
        const before: number = HumanBalance.offset(body, extended);
        const full: IHumanPosture = phrase.write(extended, 0.625);
        const after: number = HumanBalance.offset(body, full);
        const back: number =
          yaw === 0
            ? extended.root.z - full.root.z
            : extended.root.x - full.root.x;
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
        return before > 0.005;
      };

      // 6. A pose is refused exactly when no place of the hips balances it.
      // Read at one heading: the scan and the refusal run their whole
      // range, the costliest cell, and the heading's part is scenario 3's.
      if (yaw === 0) {
        const cell: string = `${name}: a counterbalance of a trunk pitched 60 at a heading of 0`;
        const feasible: boolean = balanceable(extend(60));
        let refusal: unknown;
        try {
          AutoMovieMotionHumanTrunk.counterbalance(
            body,
            CLOCK,
            RISE,
            FALL,
            extend(60),
          );
        } catch (error) {
          refusal = error;
        }
        if (feasible) {
          all.check(
            `${cell} plans, since a place of the hips within the legs' reach balances it${refusal instanceof Error ? ` (refused: ${refusal.message})` : ""}`,
            refusal === undefined,
          );
          if (refusal === undefined) read(60, cell);
        } else
          all.equals(
            `${cell} is refused on its balance, since no place of the hips within the legs' reach balances it${refusal instanceof Error ? ` (${refusal.message})` : ""}`,
            refusal instanceof HumanRefusal
              ? [refusal.kind, refusal.axis]
              : "no refusal",
            ["base", "balance"],
          );
      }

      let unbalanced: number = 0;
      for (const pitch of [0, 30] as const)
        if (
          read(
            pitch,
            `${name}: a counterbalance of a trunk pitched ${pitch} at a heading of ${yaw}`,
          )
        )
          unbalanced++;
      all.check(
        `${name}: at a heading of ${yaw} a pitched trunk puts the centre ahead of the soles, so the counterbalance is exercised`,
        unbalanced >= 1,
      );
      const still: IHumanPosture = AutoMovieMotionHumanTrunk.counterbalance(
        body,
        CLOCK,
        RISE,
        FALL,
        turned,
      ).write(turned, 0.625);
      all.check(
        `${name}: a counterbalance at a heading of ${yaw} moves nothing for the standing body, whose centre is ${mm(HumanBalance.offset(body, turned))} mm ahead`,
        HumanBalance.offset(body, turned) > 0 ||
          gap(still.root, turned.root) <= 1e-9,
      );
    }
    all.assert(`the trunk's counterbalance holds (${name})`);
  }
}
