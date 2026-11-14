import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The shapes of getting onto and off a high seat (`HumanMountOn`,
 * `HumanMountOff`): a bar stool, a saddle, a wall. Each length is a share
 * of the body's own thigh, so one value fits every body, and each value is
 * provisional: no measurement of mounting was read.
 *
 * `sit` gets onto such a seat and `rise` gets off it. The seat comes from
 * `HumanObject.seat`, which reads the object's foot rests with it, and
 * `HumanRide.ride` then carries the seated body with a support that moves.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the constants shape, what they scale by, that they are provisional and which actions read them.
 * @evidence contracts/development/design.md#principled-representation Dimensionless shares of the thigh, seconds and degrees, each named for the one quantity it sets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The constants `HumanMountOn` and `HumanMountOff` share, and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No object and no body is named.
 */
export namespace HumanMount {
  /** How far above a high seat the seat socket passes before it sets down or after it leaves sideways, thigh lengths (provisional). */
  export const HOP: number = 0.15;

  /** Seconds a body already on the seat takes to settle into sitting on it, as after getting off is broken off (provisional). */
  export const SETTLE: number = 0.5;

  /** Peak forward trunk inclination while getting onto or off a high seat, degrees (provisional). */
  export const LEAN: number = 20;

  /**
   * The thigh's direction from the hip when a foot hangs from a high seat,
   * in the sitter's frame with `x` outward: level ahead on a seat sat on
   * with both legs ahead, where the seat bears the thigh, and dropped and
   * spread on one sat astride (provisional; the shank hangs plumb under the
   * knee).
   */
  export const HANG: Readonly<
    Record<"ahead" | "astride", readonly [number, number, number]>
  > = {
    ahead: [0.05, 0, 1],
    astride: [0.5, -0.55, 0.67],
  };

  /** Where the ankle of a leg swung over a seat sat astride passes, thigh lengths above and behind the seated socket (provisional). */
  export const OVER: Readonly<{ above: number; behind: number }> = {
    above: 0.6,
    behind: 0.8,
  };

  /** How far ahead of the seated socket the pelvis stands after getting off a high seat forwards, thigh lengths (provisional: clear of the front edge by about a quarter thigh). */
  export const AHEAD: number = 1.25;

  /** How far beyond the near foot's place on a seat sat astride the pelvis stands after getting off sideways, thigh lengths (provisional). */
  export const BESIDE: number = 0.6;

  /**
   * A foot's placement off the floor, on its way to or from a high seat.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The three things a leg goal needs of a level foot: the ankle in world metres, the knee's aim and the heading in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read and written by `HumanMountOn` and `HumanMountOff` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The foot is level by construction, so no pitch can disagree with a rest's tread.
   */
  export interface IFoot {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** A world point the knee bends toward. */
    bend: IAutoMovieVector3;

    /** The foot's heading, degrees about +Y; it stays level. */
    yaw: number;
  }

  /**
   * The distances from a hip joint an ankle can be placed at: from the
   * distance a knee flexed to its 150 degree limit leaves, to 0.995 of the
   * leg's length.
   *
   * @param body The body.
   * @returns The least and the greatest distance, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both ends and their unit.
   * @evidence contracts/development/implementation.md#principled-implementation The law of cosines on the thigh and the shank at the knee's range end, the band `sit` already refuses feet outside of.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the body's own measures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function span(body: IHumanBody): readonly [number, number] {
    const m: IHumanBody["measure"] = body.measure;
    return [
      Math.sqrt(
        m.thigh * m.thigh +
          m.shank * m.shank -
          2 * m.thigh * m.shank * Math.cos((30 * Math.PI) / 180),
      ),
      0.995 * (m.thigh + m.shank),
    ];
  }

  /**
   * Whether an entry foot stands on the floor: planted, with its ankle
   * within half a thigh's radius of its standing height. A foot planted on
   * a rest, hanging or in flight does not.
   *
   * @param body The body.
   * @param foot The foot's displayed entry state.
   * @returns Whether it stands on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule and what it tells apart.
   * @evidence contracts/development/implementation.md#principled-implementation A plant is declared by the action left, and a rest holds the ankle well above its standing height; the margin scales with the body and absorbs a heel raised a little about the toes.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The half thigh radius is a provisional margin, not a measured one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function grounded(
    body: IHumanBody,
    foot: IHumanEntryState.IFoot,
  ): boolean {
    return (
      foot.planted &&
      foot.ankle.y <= body.measure.ankleHeight + 0.5 * body.measure.thighRadius
    );
  }

  /**
   * Where an entry foot is, as a placement to hold or to leave from: its
   * displayed ankle and heading, and the knee's aim the entry posture gave
   * it, or straight ahead of the ankle when that posture set none in the
   * world.
   *
   * @param entry The entry state.
   * @param side The foot.
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and the fallback for the knee's aim.
   * @evidence contracts/development/implementation.md#principled-implementation Continues from the displayed foot, as a law plans from its entry state, so no foot starts from a place the body is not in.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal attached to a bone has no world aim, so the knee is aimed ahead of the ankle; stated here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function held(entry: IHumanEntryState, side: "left" | "right"): IFoot {
    const limb: IHumanPosture.IGoal | undefined =
      entry.posture.limbs[`${side}Leg`];
    const ankle: IAutoMovieVector3 = entry.feet[side].ankle;
    return {
      ankle,
      bend:
        limb !== undefined && limb.on === undefined
          ? limb.bend
          : HumanFrame.point(
              { origin: ankle, yaw: entry.posture.yaw },
              { x: 0, y: 0, z: 1 },
            ),
      yaw: HumanFoot.heading(entry.feet[side].rotation),
    };
  }

  /**
   * A leg goal on a foot's placement.
   *
   * @param body The body.
   * @param side The leg.
   * @param foot The placement.
   * @param planted Whether the foot bears there.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A bearing foot turns about the ball it bears on, the point a rest's tread is placed under, so the ball keeps its place when the ankle cannot hold the foot level.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the shared goal type.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leg(
    body: IHumanBody,
    side: "left" | "right",
    foot: IFoot,
    planted: boolean,
  ): IHumanPosture.IGoal {
    return {
      point: foot.ankle,
      bend: foot.bend,
      rotation: HumanFrame.turn(foot.yaw),
      planted,
      ...(planted ? { contact: HumanFoot.offset(body, side, "ball") } : {}),
    };
  }

  /**
   * A foot a share of the way between two placements: the ankle on the
   * straight line between them, or on the curve through `over` at its
   * middle, raised by `lift sin(pi share)`; the knee's aim and the heading
   * go the same share.
   *
   * @param from Where it leaves.
   * @param to Where it arrives.
   * @param share 0 at `from` to 1 at `to`.
   * @param lift The clearance at the middle, metres.
   * @param over A point the ankle passes at the middle, as a leg swung over a saddle passes above it.
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the path, the clearance and what else is carried the same share.
   * @evidence contracts/development/implementation.md#principled-implementation A quadratic curve whose middle is `over`: the chord plus `4 s (1 - s)` times the offset of `over` from the chord's middle, so it starts and ends on the placements exactly.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is held within 0 and 1, so a caller's eased share past either end stays on the placements.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function between(
    from: IFoot,
    to: IFoot,
    share: number,
    lift: number,
    over?: IAutoMovieVector3,
  ): IFoot {
    const s: number = Math.min(1, Math.max(0, share));
    const line: IAutoMovieVector3 = Vector3.lerp(from.ankle, to.ankle, s);
    const ankle: IAutoMovieVector3 =
      over === undefined
        ? line
        : Vector3.add(
            line,
            Vector3.scale(
              Vector3.subtract(over, Vector3.lerp(from.ankle, to.ankle, 0.5)),
              4 * s * (1 - s),
            ),
          );
    return {
      ankle: { ...ankle, y: ankle.y + lift * Math.sin(Math.PI * s) },
      bend: Vector3.lerp(from.bend, to.bend, s),
      yaw: from.yaw + (to.yaw - from.yaw) * s,
    };
  }
}
