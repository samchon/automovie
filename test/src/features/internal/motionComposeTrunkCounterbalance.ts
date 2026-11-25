import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance, HumanRefusal } from "@automovie/motions";
import {
  AutoMovieMotionHumanTrunk,
  HumanBalance,
  HumanTrunk,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import type { motionComplaints } from "./motionComplaints";
import { motionComposeTrunk } from "./motionComposeTrunk";
import { motionHumanBody } from "./motionHumanBody";

/**
 * The trunk's counterbalance on the two contrasting rigs of
 * `test_human_motion_compose_trunk_counterbalance`, with the clock of
 * `motionComposeTrunk`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and by whom; the function states its scenarios and bounds.
 * @evidence contracts/development/implementation.md#principled-implementation The independent reach interval is the intersection of the two planted leg spheres with the straight hip path. Only its legal points enter the existing support scan.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One geometry check per heading and gathered complaint text.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every failing cell is named with its body, its parameters and its measured numbers.
 * @evidence contracts/development/implementation.md#efficient-algorithms One body per call; the solved postures the function states.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The clock, the stance's place and the distance readings are `motionComposeTrunk`'s.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The postures live as long as the call; the body is the shared fixture's.
 */
export namespace motionComposeTrunkCounterbalance {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const {
    BALANCE,
    CLOCK,
    RISE,
    FALL,
    ORIGIN,
    gap,
    minimumSupportShift,
    withoutMass,
  } = motionComposeTrunk;
  /**
   * The trunk's counterbalance on one body: under limbs held out ahead the hips
   * move straight back along the heading until the centre of mass stands over
   * the feet again, and come forward as the limbs return.
   *
   * The extended postures are the standing one with both arms held out ahead at
   * 0.92 of their length and the whole posture pitched by 0, 30 and 60 degrees.
   * A posture's pitch turns the body about its root on the floor, so a pitch of
   * 30 degrees stands the hips about half a hip height ahead of the planted
   * feet: a body that falls forward as it is, and that a person holds as a bow
   * with the hips behind the feet. An opted-in counterbalance finds the
   * smallest correction whose mass centre stands over the actual bearing
   * outlines. The test also exercises the same pitch with balance omitted and
   * no access to mass.
   *
   * Whether a pose can be balanced at all is decided here, not by the phrase:
   * the hips are moved back along the heading in 5 mm steps for as long as both
   * hip joints stay within a leg's length (thigh and shank) of their planted
   * ankles, and the pose is balanceable when one of those places puts the
   * centre of mass inside the base of support (`HumanBalance.margin`
   * positive).
   *
   * Scenarios, at headings of 0 and 90 degrees, for the pitches of 0 and 30
   * degrees (scenarios 1 to 5) and of 60 degrees at a heading of 0 (scenario
   * 6):
   *
   * 1. The phrase claims the root.
   * 2. At the middle of its hold a pose outside the base of support moves back
   *    only far enough to stand over the bearing hull. A pose already supported
   *    stays still.
   * 3. The root moves straight back along the heading: not sideways, not up, and
   *    the heading is kept.
   * 4. The phrase is gone at both ends.
   * 5. At each heading at least one pitch puts the centre ahead of the soles, so
   *    the counterbalance is exercised; and the standing body is not moved.
   * 6. The pitch of 60 degrees is refused with a `HumanRefusal` of kind `base` on
   *    the axis `balance` exactly when the scan finds no balanceable place, and
   *    otherwise planned and balanced as scenario 2 reads it.
   *
   * @param name The body.
   */
  export function counterbalance(
    name: motionHumanBody.Name,
    all: motionComplaints.IGatherer,
  ): void {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const reach: number = body.measure.thigh + body.measure.shank;
    for (const yaw of [0, 90] as const) {
      const turned: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanStance.stand.posture(body, ORIGIN, yaw);
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
      const arm = (side: "left" | "right"): IAutoMovieHumanLimbGoal => {
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
      const extend = (pitch: number): IAutoMovieMotionHumanPosture => ({
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
      const balanceable = (posture: IAutoMovieMotionHumanPosture): boolean => {
        const trunk: Bones = HumanTrunk.resolve(body, posture);
        let limit: number = Infinity;
        for (const side of ["left", "right"] as const) {
          const hip: IAutoMovieVector3 = trunk.get(
            `${side}UpperLeg`,
          )!.worldPosition;
          const ankle: IAutoMovieVector3 = posture.limbs[`${side}Leg`]!.point;
          const along: number = yaw === 0 ? hip.z - ankle.z : hip.x - ankle.x;
          const across: number = yaw === 0 ? hip.x - ankle.x : hip.z - ankle.z;
          const vertical: number = hip.y - ankle.y;
          const remainder: number =
            reach * reach - across * across - vertical * vertical;
          if (remainder < along * along) return false;
          // Along(t) = along - t. This is the last t at which its square
          // can still stay inside the sphere's remaining radius squared.
          limit = Math.min(limit, along + Math.sqrt(remainder));
        }
        for (let back: number = 0; back <= limit; back += REACH_SAMPLE) {
          const moved: IAutoMovieMotionHumanPosture = {
            ...posture,
            root: ahead(posture.root, -back, 0),
          };
          if (HumanBalance.margin(body, moved) > 0) return true;
        }
        return false;
      };
      function at(
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPrimitive {
        return AutoMovieMotionHumanTrunk.counterbalance(
          body,
          CLOCK,
          RISE,
          FALL,
          posture,
          BALANCE,
        );
      }
      function read(
        extended: IAutoMovieMotionHumanPosture,
        phrase: IAutoMovieMotionHumanPrimitive,
        cell: string,
      ): boolean {
        const before: number = HumanBalance.margin(body, extended);
        const full: IAutoMovieMotionHumanPosture = phrase.write(
          extended,
          0.625,
        );
        const back: number =
          yaw === 0
            ? extended.root.z - full.root.z
            : extended.root.x - full.root.x;
        all.equals(`${cell} claims the root`, phrase.channels, ["root"]);
        minimumSupportShift(
          all,
          cell,
          before,
          HumanBalance.margin(body, full),
          back,
          (distance: number): number =>
            HumanBalance.margin(body, {
              ...extended,
              root: ahead(extended.root, -distance, 0),
            }),
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
        return before < 0;
      }

      // 6. A pose is refused exactly when no place of the hips balances it.
      // Read at one heading: the scan and the refusal run their whole
      // range, the costliest cell, and the heading's part is scenario 3's.
      if (yaw === 0) {
        const cell: string = `${name}: a counterbalance of a trunk pitched 60 at a heading of 0`;
        const extended: IAutoMovieMotionHumanPosture = extend(60);
        const feasible: boolean = balanceable(extended);
        let phrase: IAutoMovieMotionHumanPrimitive | undefined;
        let refusal: unknown;
        try {
          phrase = at(extended);
        } catch (error) {
          refusal = error;
        }
        if (feasible) {
          all.check(
            `${cell} plans, since a place of the hips within the legs' reach balances it${refusal instanceof Error ? ` (refused: ${refusal.message})` : ""}`,
            refusal === undefined,
          );
          if (phrase !== undefined) read(extended, phrase, cell);
        } else
          all.equals(
            `${cell} is refused on its balance, since no place of the hips within the legs' reach balances it${refusal instanceof Error ? ` (${refusal.message})` : ""}`,
            refusal instanceof HumanRefusal
              ? [refusal.kind, refusal.axis]
              : "no refusal",
            ["base", "balance"],
          );
        const bare: IAutoMovieMotionHumanPrimitive =
          AutoMovieMotionHumanTrunk.counterbalance(
            withoutMass(body),
            CLOCK,
            RISE,
            FALL,
            extended,
          );
        all.equals(
          `${cell} without balance stays where it was`,
          bare.write(extended, 0.625).root,
          extended.root,
        );
      }

      let unbalanced: number = 0;
      for (const pitch of [0, 30] as const) {
        const extended: IAutoMovieMotionHumanPosture = extend(pitch);
        if (
          read(
            extended,
            at(extended),
            `${name}: a counterbalance of a trunk pitched ${pitch} at a heading of ${yaw}`,
          )
        )
          unbalanced++;
      }
      all.check(
        `${name}: at a heading of ${yaw} a pitched trunk puts the centre outside the bearings, so the counterbalance is exercised`,
        unbalanced >= 1,
      );
      const still: IAutoMovieMotionHumanPosture = at(turned).write(
        turned,
        0.625,
      );
      all.check(
        `${name}: a counterbalance at a heading of ${yaw} moves nothing for the standing body`,
        HumanBalance.margin(body, turned) >= 0 &&
          gap(still.root, turned.root) <= 1e-9,
      );
    }
  }
}

/** The original five-millimetre spacing of the independent feasibility scan. */
const REACH_SAMPLE: number = 0.005;
