import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Putting on a hat or a pair of glasses with both hands while standing.
 *
 * The goals are places on the performer's own head, read on the posture so
 * the hands follow the head: a hat's brim is held by both palms at the sides
 * of the head's girth (`HAT`, provisional), on the head's own surface, and
 * set onto it; a pair of glasses is held by both index fingertips at the
 * temples' arms just before the ears and slid back onto them, the fingers
 * pointing back along the temples. Both hands rise to a place a
 * quarter of the forearm before the item's final place in front of the
 * face (the item held up), then move it onto the head in a stroke, hold it a
 * moment and return. The reach takes the aimed movement time (McIntosh et
 * al. 2018), the stroke a beat, both provisional. The shoulder's elevation
 * stays within the functional ranges of daily tasks (flexion 121, abduction
 * 128 degrees, Namdari et al. 2012, J Shoulder Elbow Surg 21:1177), which the
 * capture checks. Events: the phrase's `ready` (item held up), `strokeStart`,
 * `stroke` (item on), `relax` (hands off).
 *
 * Not yet: the jacket through rigid sleeve sockets, shoes and socks while
 * seated, zips and buttons (garment sockets as props); no item is a prop, so
 * nothing is drawn on the head.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the item places, the stroke, the timing, the range bound's source and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of two arm strokes on the performer's own head regions over a standing base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the item places and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a head region of the performer's own body.
 */
export namespace dress {
  /** The action's name. */
  export const name: HumanActionName = "dress";

  /** Cancel table: the hands come down and the body stands or walks. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [{ window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /** An item put on. */
  export type Item = "hat" | "glasses";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation A closed item and a manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The item. */
    item: Item;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * The hat's brim held at the head's front quarters: the direction out and
   * ahead from the crown's axis, and how far down from the crown in head
   * radii (provisional). A brim rests on the head's widest girth, just above
   * the ears and a radius below the crown; the palms lie on the head's own
   * surface there, half way between the brow and the ears, which keeps the
   * elbows ahead of the chest and below the hands.
   */
  export const HAT: Readonly<{ out: number; ahead: number; down: number }> = {
    out: Math.SQRT1_2,
    ahead: Math.SQRT1_2,
    down: 1,
  };

  /**
   * A hand's place for an item on a posture, and the surface laid there.
   *
   * @param body The body.
   * @param posture The posture.
   * @param item The item.
   * @param side The hand.
   * @returns The point, the normal the hand's surface is laid against, the
   *   surface and where its forward points: a palm flat on the head with the
   *   fingers ahead, or an index finger pointing back along the temple with
   *   the palm toward the head.
   */
  export function place(
    body: IHumanBody,
    posture: IHumanPosture,
    item: Item,
    side: HumanHand.Side,
  ): {
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    surface: HumanHand.Surface;
    forward: IAutoMovieVector3;
  } {
    const outward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: side === "left" ? 1 : -1, y: 0, z: 0 },
    );
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const r: number = body.measure.headRadius;
    if (item === "hat") {
      const crown = HumanTrunk.region(body, posture, "crown");
      const radial: IAutoMovieVector3 = Vector3.add(
        Vector3.scale(outward, HAT.out),
        Vector3.scale(forward, HAT.ahead),
      );
      // The head's own surface along that direction at the brim's level.
      const level: IAutoMovieVector3 = {
        ...crown.point,
        y: crown.point.y - HAT.down * r,
      };
      const direction: IAutoMovieVector3 = Vector3.normalize(radial);
      return {
        ...HumanTrunk.surface(
          body,
          posture,
          Vector3.add(level, Vector3.scale(direction, 4 * r)),
          Vector3.scale(direction, -1),
        ),
        surface: "palm",
        forward,
      };
    }
    // The fingertip slides back along the temple onto the ear, the palm
    // toward the head, so the elbow stays ahead of the shoulder and low.
    const ear: AutoMovieHumanoidRegion =
      side === "left" ? "earLeft" : "earRight";
    const at = HumanTrunk.region(body, posture, ear);
    return {
      point: at.point,
      normal: forward,
      surface: "indexTip",
      forward: Vector3.scale(at.normal, -1),
    };
  }

  /**
   * Plan putting an item on.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const item: Item = context.params.item;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const yaw: number = context.entry.posture.yaw;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const lead: number = 0.25 * body.measure.forearm;
    const bones = poseBones(body, context.entry.pose);
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      0.6 * (body.measure.upperArm + body.measure.forearm),
      0.03,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: AutoMovieMotionHumanTiming.PAUSES.beat,
        hold: AutoMovieMotionHumanTiming.PAUSES.brief,
        retract: reach,
      }),
      modifiers,
    );
    const arm = (side: HumanHand.Side) => {
      const surface: HumanHand.Surface = item === "hat" ? "palm" : "indexTip";
      return AutoMovieMotionHumanArm.stroke({
        body,
        clock,
        side,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          bones,
          { origin: context.entry.posture.root, yaw },
          side,
          surface,
        ),
        path: (posture: IHumanPosture, _: number, progress: number) => {
          const at = place(body, posture, item, side);
          return AutoMovieMotionHumanTarget.hand(
            body,
            posture,
            side,
            {
              point: Vector3.add(
                at.point,
                Vector3.scale(forward, lead * (1 - progress)),
              ),
              normal: at.normal,
            },
            {
              surface: at.surface,
              shape: item === "hat" ? "relaxed" : "point",
              forward: at.forward,
            },
          );
        },
      });
    };
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      contact: "stroke",
      primitives: [arm("left"), arm("right")],
    });
  }
}
