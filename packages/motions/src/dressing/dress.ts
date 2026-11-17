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
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { HumanWorn } from "./HumanWorn";
import { dressTurn } from "./dressTurn";

/**
 * Putting on a hat or a pair of glasses held in one hand, with both hands,
 * while standing.
 *
 * The item is the wearable prop the hand holds since a pick-up (`prop`, by
 * its `hold`): that hand carries it, rigid in the hand
 * (`AutoMovieMotionHumanHeld`), so that its own `wear` socket comes onto the
 * head's region it is worn on (`HumanWorn`: a hat's on the crown, a pair of
 * glasses' on the nose's bridge), spectacles facing the way the body faces
 * and a hat, round about its crown, at whichever turn the arm, fitted
 * within its ranges, brings the wear socket nearest the crown at (the
 * shared chooser, `HumanFreedomChoice`, the turn a wrapped freedom);
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
  export const name: AutoMovieMotionHumanActionName = "dress";

  /** Cancel table: the hands come down and the body stands or walks. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [{ window: ["relax", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States current posture/item/hand inputs, optional same-person FK used only by raw region/ray observations, actual world point/normal/forward and original palm/index-tip surface choice.
   * @evidence contracts/development/implementation.md#principled-implementation A hat uses the original crown-relative brim level and ray onto the actual head profile; glasses use the original ear region and temple-facing finger orientation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One current yaw frame serves outward/forward transforms and one synchronous trunk reader serves region plus any head-surface query before the original item branch returns.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves HAT shares, head radius, ray endpoints, surface selection and exact current region/normal; no head point is inferred from a fitted hand or previous frame.
   * @evidence contracts/development/implementation.md#efficient-algorithms Shares one current yaw preparation and actual trunk/FK prerequisites across the region/surface observations; the original bounded ray geometry remains actual. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/posture within this synchronous place call shares geometry; an explicit current-person source reaches actual raw FK alone. Each later posture creates a fresh reading rather than reusing a sampled head frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Current frame/trunk readers and optional FK loan release on return or throw; returned numeric place fields retain no reader, body pose history or handle.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    item: IAutoMovieMotionHumanDress.Item,
    side: AutoMovieHumanSide,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): IAutoMovieMotionHumanDress.IPlaceResult {
    const frame: ReturnType<typeof HumanFrame.prepare> = HumanFrame.prepare(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw });
    const outward: IAutoMovieVector3 = frame.point(
      { x: side === "left" ? 1 : -1, y: 0, z: 0 },
    );
    const forward: IAutoMovieVector3 = frame.point(
      { x: 0, y: 0, z: 1 },
    );
    const r: number = body.measure.headRadius;
    if (item === "hat") {
      const trunk: ReturnType<typeof HumanTrunk.prepare> = HumanTrunk.prepare(body, posture, undefined, resolution);
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
    const at: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(body, posture, ear, resolution);
    return {
      point: at.point,
      normal: forward,
      surface: "indexTip",
      forward: Vector3.scale(at.normal, -1),
    };
  }

  /** The refinement step of a hat's turn about the crown, and the spacing of the turns tried first round it, degrees (search resolution: an eighth of a turn, halving to under 6). */
  export const TURN: number = 45;

  /** The head region each item is worn on. */
  export const WORN: Readonly<Record<IAutoMovieMotionHumanDress.Item, AutoMovieHumanoidRegion>> = {
    hat: "crown",
    glasses: "noseBridge",
  };

  /**
   * Plan putting an item on.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hand does not hold the wearable or the wearable declares no `wear` socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States original held-wearable/socket refusals and returned two-arm plan; the namespace gives contact, wearing, stroke timing and supporting-hand goals.
   * @evidence contracts/development/implementation.md#principled-implementation The wearable's original held offset is rigidly undone at the actual receiving head region. Hat turns retain the original full contact-aware fits and wrapped chooser; runtime carrier/support goals continue reading their actual current posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Entry/timing preparation delegates fixed-entry turn ranking to dressTurn, then composes the original carrier and support arm strokes with grip/wear windows; both rank/runtime share the same rigid inverse-offset owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All original turns/refinements, full coupled fits, default elbow sweeps, region targets, functional goals, finger release/contact/clock policies and refusals remain. Glasses keep their original zero turn and original unconditional socket admissions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Entry FK emits only both consumed hand surfaces. Hat search prepares fixed region/alignment/base/Bend/hand observation once across C actual turn fits. Runtime holder preparation binds only fixed wearable socket/rest basis/region demand, and support calls share their current trunk geometry; each actual current region/alignment/target/fit remains. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed-entry chooser shares immutable body/profile/rig/ROM/pose and wearable geometry. Runtime preparation shares only fixed wearable metadata while reading every current posture; the final wrapper forwards current-person FK/ROM loans through the original full composition, and current path sources reach native raw head observations without a fitted-answer substitution.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The turn search releases score/FK/base geometry before returning its scalar choice. The plan owns original held geometry, clock and fingers until release; current metadata loans and head readings release per call, without a new pose/time history or retained solver reader.
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
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      holder,
      subject,
    );
    const wearable: IAutoMovieMotionHumanProp = context.prop(subject).prop;
    // The item's frame in the hand's, for the hand that carries it.
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      held.frame.rotation,
    );
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const yaw: number = context.entry.posture.yaw;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const lead: number = 0.25 * body.measure.forearm;
    const observed: Set<AutoMovieHumanoidBone> = new Set(HumanHand.frameBones(body, holder, "grip"));
    const other: AutoMovieHumanSide = holder === "left" ? "right" : "left";
    for (const bone of HumanHand.frameBones(body, other, item === "hat" ? "palm" : "indexTip"))
      observed.add(bone);
    const bones: ReturnType<typeof poseBones> = poseBones(body, context.entry.pose, undefined, observed);
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      0.6 * (body.measure.upperArm + body.measure.forearm),
      0.03,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
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
    const wornAt: ReturnType<typeof HumanWorn.prepareMoving> = HumanWorn.prepareMoving(body, wearable, WORN[item]);
    const carried: (posture: IAutoMovieMotionHumanPosture, degrees: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]) => ReturnType<typeof dressTurn.carried> = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): { grip: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
      return dressTurn.carried(wornAt(posture, degrees, resolution), inverse, held.frame.position);
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
    const turn: number = item === "glasses" ? 0 : dressTurn({
      body, posture: context.entry.posture, side: holder, wearable,
      region: WORN[item], inverse, offset: held.frame.position, socket, wear, step: TURN,
    });
    // The carrying hand: the item held up the lead before its place.
    const carry: () => IAutoMovieMotionHumanPrimitive = (): IAutoMovieMotionHumanPrimitive => {
      const emit: ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareTarget> =
        AutoMovieMotionHumanArmTarget.prepareTarget(body, holder, "grip", "relaxed");
      return AutoMovieMotionHumanArm.stroke({
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
        path: (posture: IAutoMovieMotionHumanPosture, _: number, progress: number,
          resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]): IAutoMovieMotionHumanArmTarget.ITarget => {
          const { grip: on, rotation }: ReturnType<typeof carried> = carried(posture, turn, resolution);
          const grip: IAutoMovieVector3 = Vector3.add(
            on,
            Vector3.scale(forward, lead * (1 - progress)),
          );
          return emit({
            point: grip,
            rotation,
            bend: AutoMovieMotionHumanBend.solve({
              body,
              posture,
              side: holder,
              point: placeHumanHandSurface(socket, grip, rotation).point,
              rotation,
              fallback: "hang",
            }),
          });
        },
      });
    };
    const arm: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => {
      const surface: IAutoMovieMotionHumanHand.Surface = item === "hat" ? "palm" : "indexTip";
      const prepared: ReturnType<typeof HumanHandTarget.prepareMoving> = HumanHandTarget.prepareMoving(
        body, side, { surface, shape: item === "hat" ? "relaxed" : "point" });
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
        path: (posture: IAutoMovieMotionHumanPosture, _: number, progress: number,
          resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]): IAutoMovieMotionHumanArmTarget.ITarget => {
          const at: ReturnType<typeof place> = place(body, posture, item, side, resolution);
          return prepared.target(
            posture,
            {
              point: Vector3.add(
                at.point,
                Vector3.scale(forward, lead * (1 - progress)),
              ),
              normal: at.normal,
            },
            at.forward,
          );
        },
      });
    };
    const composed: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
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
      posture: (seconds: number, _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = composed.posture(seconds, undefined, resolution, projection);
        return seconds / clock.duration < on
          ? { ...posture, joints: { ...posture.joints, ...fingers } }
          : posture;
      },
    };
  }
}
