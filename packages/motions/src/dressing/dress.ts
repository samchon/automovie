import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
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
 * of the crown (`HAT`, in head radii, provisional) and lowered onto it; a
 * pair of glasses is held by both index fingertips at the temples' arms just
 * before the ears and slid back onto them. Both hands rise to a place a
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

  /** The hat's brim held at the crown's sides: out and down in head radii (provisional). */
  export const HAT: Readonly<{ out: number; down: number }> = {
    out: 0.95,
    down: 0.35,
  };

  /**
   * A hand's place for an item on a posture, and the surface laid there.
   *
   * @param body The body.
   * @param posture The posture.
   * @param item The item.
   * @param side The hand.
   * @returns The point, the outward normal and the hand's surface.
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
  } {
    const outward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: side === "left" ? 1 : -1, y: 0, z: 0 },
    );
    const r: number = body.measure.headRadius;
    if (item === "hat") {
      const crown = HumanTrunk.region(body, posture, "crown");
      return {
        point: Vector3.add(
          crown.point,
          Vector3.add(Vector3.scale(outward, HAT.out * r), {
            x: 0,
            y: -HAT.down * r,
            z: 0,
          }),
        ),
        normal: outward,
        surface: "palm",
      };
    }
    const ear: AutoMovieHumanoidRegion =
      side === "left" ? "earLeft" : "earRight";
    const at = HumanTrunk.region(body, posture, ear);
    return { point: at.point, normal: at.normal, surface: "indexTip" };
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
              forward,
            },
          );
        },
      });
    };
    return composeAutoMovieMotionHumanAction({
      base: stand.plan({ ...context, params: { seconds: clock.duration } }),
      clock,
      contact: "stroke",
      primitives: [arm("left"), arm("right")],
    });
  }
}
