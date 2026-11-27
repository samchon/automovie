import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { prepareHumanElbowPath } from "../../compose/internal/prepareHumanElbowPath";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanGrip } from "../../handling/internal/HumanGrip";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanWorn } from "./HumanWorn";
import { dressTurn } from "./dressTurn";

/*
 * Putting on a hat or a pair of glasses held in one hand, with both hands,
 * while standing.
 *
 * The item is the wearable prop the hand holds since a pick-up (`prop`, by its
 * `hold`): that hand carries it, rigid in the hand
 * (`AutoMovieMotionHumanHeld`), so that its own `wear` socket comes onto the
 * head's region it is worn on (`HumanWorn`: a hat's on the crown, a pair of
 * glasses' on the nose's bridge), spectacles facing the way the body faces and
 * a hat, round about its crown, at whichever turn the arm, fitted within its
 * ranges, brings the wear socket nearest the crown at (the shared chooser,
 * `HumanFreedomChoice`, the turn a wrapped freedom); from the stroke it is worn
 * on the head (`IHumanActionPlan.wears`) and the hand lets go. The other hand
 * steadies it at a place on the performer's own head, read on the posture so it
 * follows the head: a hat's brim at the side of the head's girth (`HAT`,
 * provisional), the palm on the head's own surface; a pair of glasses' temple
 * just before the ear, the index finger pointing back along it. Both hands rise
 * to a place a quarter of the forearm before the item's final place in front of
 * the face (the item held up), then move it onto the head in a stroke, hold it
 * a moment and return. The reach takes the free-space movement time
 * (`AutoMovieMotionHumanTiming.transport`) of the farther hand's way from where
 * it starts to where it holds the item up, in free space before the face, the
 * stroke a beat (`AutoMovieMotionHumanTiming.PAUSES`). The shoulder's elevation
 * stays within the functional ranges of daily tasks (flexion 121, abduction 128
 * degrees, Namdari et al. 2012, J Shoulder Elbow Surg 21:1177), which the
 * capture checks. Events: the phrase's `ready` (item held up), `strokeStart`,
 * `stroke` (item on), `relax` (hands off).
 *
 * Not yet: the jacket through rigid sleeve sockets, shoes and socks while
 * seated, zips and buttons (garment sockets as props), and a watch on the other
 * wrist.
 */
export namespace dress {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "dress";

  /*
   * Cancel table: the hands come down and the body stands or walks.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: "relax", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: { start: "relax", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * May be performed over a carrier, such as seated or while another action
   * carries the body: it claims only the parts it moves.
   */
  export const overlay: boolean = true;

  /*
   * The hat's brim held at the head's front quarters: the direction out and
   * ahead from the crown's axis, and how far down from the crown in head radii
   * (provisional). A brim rests on the head's widest girth, just above the ears
   * and a radius below the crown; the palms lie on the head's own surface
   * there, half way between the brow and the ears, which keeps the elbows ahead
   * of the chest and below the hands.
   */
  export const HAT: Readonly<IHATItem> = {
    out: Math.SQRT1_2,
    ahead: Math.SQRT1_2,
    down: 1,
  };

  /*
   * A hand's place for an item on a posture, and the surface laid there.
   * Parameter body: The body.
   * Parameter posture: The posture.
   * Parameter item: The item.
   * Parameter side: The hand.
   * Parameter resolution: The pose workspace of the posture's evaluation, shared
   * with its other reads; a fresh one when absent.
   * Returns: The point, the normal the hand's surface is laid against, the
   * surface and where its forward points, world: a palm flat on the head with
   * the fingers ahead, or an index finger pointing back along the temple with
   * the palm toward the head.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    item: IAutoMovieMotionHumanDress.Item,
    side: AutoMovieHumanSide,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): IAutoMovieMotionHumanDress.IPlaceResult {
    const frame: ReturnType<typeof HumanFrame.prepare> = HumanFrame.prepare({
      origin: { x: 0, y: 0, z: 0 },
      yaw: posture.yaw,
    });
    const outward: IAutoMovieVector3 = frame.point({
      x: side === "left" ? 1 : -1,
      y: 0,
      z: 0,
    });
    const forward: IAutoMovieVector3 = frame.point({ x: 0, y: 0, z: 1 });
    const r: number = body.measure.headRadius;
    if (item === "hat") {
      const trunk: ReturnType<typeof HumanTrunk.prepare> = HumanTrunk.prepare(
        body,
        posture,
        undefined,
        resolution,
      );
      const crown: ReturnType<typeof HumanTrunk.region> = trunk.region("crown");
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
        ...trunk.surface(
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
    const at: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
      body,
      posture,
      ear,
      resolution,
    );
    return {
      point: at.point,
      normal: forward,
      surface: "indexTip",
      forward: Vector3.scale(at.normal, -1),
    };
  }

  /*
   * The refinement step of a hat's turn about the crown, and the spacing of the
   * turns tried first round it, degrees (search resolution: an eighth of a
   * turn, halving to under 6).
   */
  export const TURN: number = 45;

  /*
   * The head region each item is worn on.
   */
  export const WORN: Readonly<
    Record<IAutoMovieMotionHumanDress.Item, AutoMovieHumanoidRegion>
  > = {
    hat: "crown",
    glasses: "noseBridge",
  };

  /*
   * Plan putting an item on.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the hand does not hold the wearable or the
   * wearable declares no `wear` socket.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDress.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const item: IAutoMovieMotionHumanDress.Item = context.params.item;
    const subject: string = context.params.prop;
    const holder: AutoMovieHumanSide =
      context.params.hand ??
      (context.entry.holds.left === subject &&
      context.entry.holds.right !== subject
        ? "left"
        : "right");
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      holder,
      subject,
    );
    const wearable: IAutoMovieMotionHumanProp = context.prop(subject).prop;
    // The item's frame in the hand's, for the hand that carries it.
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      held.frame.rotation,
    );
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const yaw: number = context.entry.posture.yaw;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const lead: number = 0.25 * body.measure.forearm;
    const observed: Set<AutoMovieHumanoidBone> = new Set(
      HumanHand.frameBones(body, holder, "grip"),
    );
    const other: AutoMovieHumanSide = holder === "left" ? "right" : "left";
    const surface: IAutoMovieMotionHumanHand.Surface =
      item === "hat" ? "palm" : "indexTip";
    for (const bone of HumanHand.frameBones(body, other, surface))
      observed.add(bone);
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      observed,
    );
    const frame: IAutoMovieMotionHumanFrame = {
      origin: context.entry.posture.root,
      yaw,
    };
    const holding: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(body, bones, frame, holder, "grip");
    const steadying: IAutoMovieMotionHumanArmTarget.IOrigin =
      AutoMovieMotionHumanArm.origin(body, bones, frame, other, surface);
    // Where the carrying hand's grip socket is, and how the hand is turned,
    // when the item, rigid in it, sits on the head at a turn.
    const wornAt: ReturnType<typeof HumanWorn.prepareMoving> =
      HumanWorn.prepareMoving(body, wearable, WORN[item]);
    const carried: (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ) => ReturnType<typeof dressTurn.carried> = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IPlanCarriedResult => {
      return dressTurn.carried(
        wornAt(posture, degrees, resolution),
        inverse,
        held.frame.position,
      );
    };
    // A hat is round about its crown, so it is set at whichever turn the
    // arm, fitted within its ranges, brings its wear socket nearest the
    // crown (the shared chooser, a wrapped freedom); spectacles face the
    // body's way.
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      holder,
      "grip",
    ).point;
    const wear: IAutoMovieVector3 = AutoMovieMotionHumanHeld.point(
      held,
      "wear",
    ).point;
    const turn: number =
      item === "glasses"
        ? 0
        : dressTurn({
            body,
            posture: context.entry.posture,
            side: holder,
            wearable,
            region: WORN[item],
            inverse,
            offset: held.frame.position,
            socket,
            wear,
            step: TURN,
          });

    // The reach lasts the movement time of the farther hand's way, from
    // where it starts to where it holds the item up, the lead before its
    // place on the entry's head: a place in free space, so it takes the
    // free-space rule, not an aimed one (`AutoMovieMotionHumanTiming`).
    const up: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 => Vector3.add(point, Vector3.scale(forward, lead));
    const far: number = Math.max(
      Vector3.length(
        Vector3.subtract(
          up(carried(context.entry.posture, turn).grip),
          AutoMovieMotionHumanArm.point(context.entry.posture, holding),
        ),
      ),
      Vector3.length(
        Vector3.subtract(
          up(place(body, context.entry.posture, item, other).point),
          AutoMovieMotionHumanArm.point(context.entry.posture, steadying),
        ),
      ),
    );
    const reach: number = AutoMovieMotionHumanTiming(far, { solid: false });
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: AutoMovieMotionHumanTiming.PAUSES.beat,
        hold: AutoMovieMotionHumanTiming.PAUSES.brief,
        retract: reach,
      }),
      modifiers,
    );
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    const events: readonly number[] = [
      clock.at("ready"),
      clock.at("strokeStart"),
      clock.at("strokeEnd"),
      clock.at("relax"),
    ];
    const travel = (seconds: number): number =>
      lead * (1 - clock.progress("strokeStart", "strokeEnd", seconds));
    const weight = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);

    // The carrying hand: the item held up the lead before its place.
    const carry: () => IAutoMovieMotionHumanPrimitive =
      (): IAutoMovieMotionHumanPrimitive => {
        const emit: ReturnType<
          typeof AutoMovieMotionHumanArmTarget.prepareTarget
        > = AutoMovieMotionHumanArmTarget.prepareTarget(
          body,
          holder,
          "grip",
          "relaxed",
        );
        const geometry = (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
        ): IPlanCarriedResult => {
          const { grip: on, rotation }: ReturnType<typeof carried> = carried(
            posture,
            turn,
            resolution,
          );
          const grip: IAutoMovieVector3 = Vector3.add(
            on,
            Vector3.scale(forward, travel(seconds)),
          );
          return { grip, rotation };
        };
        const elbow: (seconds: number) => IAutoMovieVector3 =
          prepareHumanElbowPath(
            clock.duration,
            events,
            (seconds: number): IAutoMovieMotionHumanBend.ISolve => {
              const posture: IAutoMovieMotionHumanPosture =
                base.posture(seconds);
              const { grip, rotation }: IPlanCarriedResult = geometry(
                posture,
                seconds,
              );
              return {
                body,
                posture,
                side: holder,
                point: placeHumanHandSurface(socket, grip, rotation).point,
                rotation,
                fallback: "hang",
              };
            },
          );
        return AutoMovieMotionHumanArm.move({
          body,
          side: holder,
          origin: holding,
          from: 0,
          to: clock.duration,
          weight,
          target: (posture, seconds, resolution) => {
            const { grip, rotation }: IPlanCarriedResult = geometry(
              posture,
              seconds,
              resolution,
            );
            return emit({ point: grip, rotation, bend: elbow(seconds) });
          },
        });
      };
    // The other hand: on its place on the head, the lead before it.
    const steady: () => IAutoMovieMotionHumanPrimitive =
      (): IAutoMovieMotionHumanPrimitive => {
        const shape: IAutoMovieMotionHumanHand.Shape =
          item === "hat" ? "relaxed" : "point";
        const prepared: ReturnType<typeof HumanHandTarget.prepareMoving> =
          HumanHandTarget.prepareMoving(body, other, {
            surface,
            shape,
          });
        const emit: ReturnType<
          typeof AutoMovieMotionHumanArmTarget.prepareTarget
        > = AutoMovieMotionHumanArmTarget.prepareTarget(
          body,
          other,
          surface,
          shape,
        );
        const geometry = (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
        ): Pick<
          IAutoMovieMotionHumanArmTarget.ITarget,
          "point" | "rotation"
        > => {
          const at: ReturnType<typeof place> = place(
            body,
            posture,
            item,
            other,
            resolution,
          );
          return {
            point: Vector3.add(
              at.point,
              Vector3.scale(forward, travel(seconds)),
            ),
            rotation: prepared.frame(posture, at.normal, at.forward).rotation,
          };
        };
        const elbow: (seconds: number) => IAutoMovieVector3 =
          prepareHumanElbowPath(
            clock.duration,
            events,
            (seconds: number): IAutoMovieMotionHumanBend.ISolve => {
              const posture: IAutoMovieMotionHumanPosture =
                base.posture(seconds);
              const target: ReturnType<typeof geometry> = geometry(
                posture,
                seconds,
              );
              return {
                body,
                posture,
                side: other,
                rotation: target.rotation,
                fallback: "hang",
                point: HumanHand.place(
                  body,
                  other,
                  surface,
                  target.point,
                  target.rotation,
                  shape,
                ).point,
              };
            },
          );
        return AutoMovieMotionHumanArm.move({
          body,
          side: other,
          origin: steadying,
          from: 0,
          to: clock.duration,
          weight,
          target: (posture, seconds, resolution) =>
            emit({
              ...geometry(posture, seconds, resolution),
              bend: elbow(seconds),
            }),
        });
      };
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "stroke",
        primitives: [
          holder === "left" ? carry() : steady(),
          holder === "right" ? carry() : steady(),
        ],
      });
    // The holding hand keeps the item until it is on, closed as the grip
    // left it; from then the head wears it.
    const on: number = clock.at("stroke") / clock.duration;
    const fingers: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
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
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = composed.posture(
          seconds,
          undefined,
          resolution,
          projection,
        );
        return seconds / clock.duration < on
          ? { ...posture, joints: { ...posture.joints, ...fingers } }
          : posture;
      },
    };
  }
}

/*
 * The record of `IPlanCarriedResult`'s site.
 */
type IPlanCarriedResult = {
  grip: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
};

/*
 * The record of `IHATItem`'s site.
 */
type IHATItem = { out: number; ahead: number; down: number };
