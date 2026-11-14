import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanGrip } from "../handling/HumanGrip";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanWorn } from "./HumanWorn";

/**
 * Putting on a hat or a pair of glasses held in one hand, with both hands,
 * while standing.
 *
 * The item is the wearable prop the hand holds since a pick-up (`prop`, by
 * its `hold`): that hand carries it, rigid in the hand
 * (`AutoMovieMotionHumanHeld`), so that its own `wear` socket comes onto the
 * head's region it is worn on (`HumanWorn`: a hat's on the crown, a pair of
 * glasses' on the nose's bridge), spectacles facing the way the body faces
 * and a hat, round about its crown, at whichever turn of `TURNS` the arm
 * holds with the least strain (`AutoMovieMotionHumanBend.strain`);
 * from the stroke it is worn on the head (`IHumanActionPlan.wears`) and the
 * hand lets go. The other hand steadies it at a place on the performer's own
 * head, read on the posture so it follows the head: a hat's brim at the
 * side of the head's girth (`HAT`, provisional), the palm on the head's own
 * surface; a pair of glasses' temple just before the ear, the index finger
 * pointing back along it. Both hands rise to a place a quarter of the
 * forearm before the item's final place in front of the face (the item held
 * up), then move it onto the head in a stroke, hold it a moment and return. The reach takes the aimed movement time (McIntosh et
 * al. 2018), the stroke a beat, both provisional. The shoulder's elevation
 * stays within the functional ranges of daily tasks (flexion 121, abduction
 * 128 degrees, Namdari et al. 2012, J Shoulder Elbow Surg 21:1177), which the
 * capture checks. Events: the phrase's `ready` (item held up), `strokeStart`,
 * `stroke` (item on), `relax` (hands off).
 *
 * Not yet: the jacket through rigid sleeve sockets, shoes and socks while
 * seated, zips and buttons (garment sockets as props), and a watch on the
 * other wrist.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the item places, the stroke, the timing, the range bound's source and what is missing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of two arm strokes over a standing base, one carrying the held wearable to its place on the head, which then wears it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the item places and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a head region of the performer's own body and the item's own socket.
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
   * @evidence contracts/development/design.md#principled-representation A closed item, the held wearable, its hand and a manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The item: where it is worn and how the free hand steadies it. */
    item: Item;

    /** The wearable's prop subject, held since a pick-up: its `wear` socket is put on the head (`createWearable`'s contacts). */
    prop: string;

    /** The hand that holds it; the one the entry holds it in when absent, `right` if neither. */
    hand?: HumanHand.Side;

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

  /** The turns about the crown a hat is tried at, degrees: the whole way round in steps of 30, facing the body's way first. */
  export const TURNS: readonly number[] = [
    0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180,
  ];

  /** The head region each item is worn on. */
  export const WORN: Readonly<Record<Item, AutoMovieHumanoidRegion>> = {
    hat: "crown",
    glasses: "noseBridge",
  };

  /**
   * Plan putting an item on.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hand does not hold the wearable or the wearable declares no `wear` socket.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const item: Item = context.params.item;
    const subject: string = context.params.prop;
    const holder: HumanHand.Side =
      context.params.hand ??
      (context.entry.holds.left === subject &&
      context.entry.holds.right !== subject
        ? "left"
        : "right");
    const held: AutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      holder,
      subject,
    );
    const wearable: IHumanProp = context.prop(subject).prop;
    // The item's frame in the hand's, for the hand that carries it.
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      held.frame.rotation,
    );
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
    // Where the carrying hand's grip socket is, and how the hand is turned,
    // when the item, rigid in it, sits on the head at a turn.
    const carried = (
      posture: IHumanPosture,
      degrees: number,
    ): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
      const worn: IHumanProp.IFrame = HumanWorn.frame(
        body,
        posture,
        wearable,
        WORN[item],
        degrees,
      );
      const rotation: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(worn.rotation, inverse),
      );
      return {
        grip: Vector3.subtract(
          worn.position,
          Quaternion.rotateVector(rotation, held.frame.position),
        ),
        rotation,
      };
    };
    // A hat is round about its crown, so it is set at whichever turn the
    // arm holds with the least strain; spectacles face the body's way.
    const turn: number =
      item === "glasses"
        ? 0
        : TURNS.map((degrees: number): [number, number] => {
            const at: { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } =
              carried(context.entry.posture, degrees);
            const solve: AutoMovieMotionHumanBend.ISolve = {
              body,
              posture: context.entry.posture,
              side: holder,
              point: HumanHand.place(
                body,
                holder,
                "grip",
                at.grip,
                at.rotation,
                "relaxed",
              ).point,
              rotation: at.rotation,
            };
            return [
              degrees,
              AutoMovieMotionHumanBend.strain(
                solve,
                AutoMovieMotionHumanBend.solve({ ...solve, fallback: "hang" }),
              ),
            ];
          }).reduce(
            (best: [number, number], next: [number, number]) =>
              next[1] < best[1] - 1e-9 ? next : best,
          )[0];
    // The carrying hand: the item held up the lead before its place.
    const carry = (): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanArm.stroke({
        body,
        clock,
        side: holder,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          bones,
          { origin: context.entry.posture.root, yaw },
          holder,
          "grip",
        ),
        path: (posture: IHumanPosture, _: number, progress: number) => {
          const { grip: on, rotation } = carried(posture, turn);
          const grip: IAutoMovieVector3 = Vector3.add(
            on,
            Vector3.scale(forward, lead * (1 - progress)),
          );
          return {
            surface: "grip",
            shape: "relaxed",
            point: grip,
            rotation,
            bend: AutoMovieMotionHumanBend.solve({
              body,
              posture,
              side: holder,
              point: HumanHand.place(
                body,
                holder,
                "grip",
                grip,
                rotation,
                "relaxed",
              ).point,
              rotation,
              fallback: "hang",
            }),
          };
        },
      });
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
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      contact: "stroke",
      primitives: [
        holder === "left" ? carry() : arm("left"),
        holder === "right" ? carry() : arm("right"),
      ],
    });
    // The holding hand keeps the item until it is on, closed as the grip
    // left it; from then the head wears it.
    const on: number = clock.at("stroke") / clock.duration;
    const fingers: IHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      holder,
    );
    return {
      ...composed,
      contacts: [
        ...composed.contacts,
        { ...AutoMovieMotionHumanHeld.grip(held), to: on },
      ],
      wears: [{ prop: subject, bone: "head", from: on }],
      posture: (seconds: number): IHumanPosture => {
        const posture: IHumanPosture = composed.posture(seconds);
        return seconds / clock.duration < on
          ? { ...posture, joints: { ...posture.joints, ...fingers } }
          : posture;
      },
    };
  }
}
