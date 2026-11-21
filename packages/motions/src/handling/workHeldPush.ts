import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionPropDrive,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { heldDigits } from "./heldDigits";
import { pickUp } from "./pickUp";

/**
 * The free hand working a contact of a prop the other hand holds still:
 * the hand that pushes an umbrella's runner up its shaft.
 *
 * The holding hand does not move through the work, so the held prop keeps
 * its entry frame, and the contact's place at every second is the
 * articulation's travel there (`heldDigits.posed`) carried by that frame.
 * The free hand's grip lies on it with the hand's entry attitude, its
 * wrist the contact less the grip's offset turned by that attitude, so the
 * hand stays on the contact as it moves. The grip bears the part without
 * carrying the prop. The contact must ride a driven articulation, and its
 * places at the work's start and end must lie within the free arm's reach.
 *
 * @param context The action's context.
 * @param subject The held prop.
 * @param site The contact the free hand works.
 * @param side The holding hand; the other one pushes.
 * @param drive The work's authored drives of the held prop.
 * @returns The free arm and its grip under the work's clock and planned drives, and its travel to the contact.
 * @throws {HumanRefusal} When the contact rides no driven articulation, or lies beyond the free arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the still-holder premise, the moving goal, the attitude, the contact and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The contact's place is the articulation's closed-form pose under the drive's own travel, in the prop's entry frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the contact, read the frames once, then build the arm under the caller's clock.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact on no driven articulation, or beyond the arm, is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms One closed-form place per second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `heldDigits.posed`, the reach owner and the carried arm.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The arm closes over the frames and the drive.
 */
export function workHeldPush(
  context: IAutoMovieMotionHumanActionContext<object>,
  subject: string,
  site: string,
  side: AutoMovieHumanSide,
  drive: readonly IAutoMovieMotionHumanHeldWork.IDrive[],
): workHeldPush.IPush {
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const affordances: readonly IAutoMovieAffordance[] =
    context.prop(subject).prop.affordances ?? [];
  const contact: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === site,
  );
  const pushed: IAutoMovieMotionHumanHeldWork.IDrive | undefined = drive.find(
    (d: IAutoMovieMotionHumanHeldWork.IDrive): boolean =>
      d.articulation === contact?.rides || d.articulation === contact?.id,
  );
  const joint: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === pushed?.articulation,
  );
  if (contact === undefined || pushed === undefined || joint === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "push",
      value: site,
      feasible: {
        kind: "alternatives",
        values: drive.map(
          (d: IAutoMovieMotionHumanHeldWork.IDrive): string => d.articulation,
        ),
      },
      reason: `the free hand pushes a contact of ${subject} that a driven articulation moves`,
      fix: "push a driven articulation or a contact riding one",
    });
  const frame: IAutoMovieRigidTransform = context
    .prop(subject)
    .frame(context.entry.seconds);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const hand: IAutoMovieResolvedBone = bones.get(`${other}Hand`)!;
  const turn: IAutoMovieQuaternion = hand.worldRotation;
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    other,
    "grip",
  ).point;
  const wrist: (travel: number) => IAutoMovieVector3 = (
    travel: number,
  ): IAutoMovieVector3 =>
    Vector3.subtract(
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          heldDigits.posed(joint, contact, travel),
        ),
      ),
      Quaternion.rotateVector(turn, grip),
    );
  const start: number =
    context.prop(subject).state?.(context.start)?.[joint.id] ?? 0;
  const end: number = pushed.to;
  for (const travel of [start, end])
    pickUp.reachable(context, other, wrist(travel));
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    other,
  );
  return {
    travel: Vector3.length(Vector3.subtract(wrist(start), hand.worldPosition)),
    arm: (
      clock: IAutoMovieMotionClock,
      drives: readonly IAutoMovieMotionPropDrive[],
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanArm.carried({
        body: context.body,
        side: other,
        from: 0,
        to: clock.duration,
        span: {
          start: 0,
          ready: clock.at("strokeStart"),
          relax: clock.at("strokeEnd"),
          end: clock.duration,
        },
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
        disc: 0,
        weight: (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        goal: (
          _posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieHumanLimbGoal => ({
          point: wrist(
            drives
              .find(
                (d: IAutoMovieMotionPropDrive): boolean =>
                  d.articulation === joint.id,
              )!
              .travel(seconds),
          ),
          rotation: turn,
          contact: grip,
          bend,
        }),
      }),
    contact: (
      clock: IAutoMovieMotionClock,
    ): IAutoMovieMotionHumanContactWindow => ({
      part: other === "left" ? "leftHand" : "rightHand",
      kind: "grip",
      from: clock.at("strokeStart") / clock.duration,
      to: clock.at("strokeEnd") / clock.duration,
      support: { kind: "prop", subject, carries: false },
    }),
    side: other,
  };
}

/**
 * The parts {@link workHeldPush} hands its caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the travel, the arm, the contact and the hand.
 * @evidence contracts/development/design.md#principled-representation Metres and builders under the caller's clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `workHeld` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required.
 */
export namespace workHeldPush {
  /**
   * The free hand's part of the work.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each member.
   * @evidence contracts/development/design.md#principled-representation Metres, a primitive and a contact window under a clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `workHeld` composes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required.
   */
  export interface IPush {
    /** The free wrist's travel to the contact at the start, metres. */
    travel: number;

    /** The free arm under the work's clock. */
    arm: (
      clock: IAutoMovieMotionClock,
      drives: readonly IAutoMovieMotionPropDrive[],
    ) => IAutoMovieMotionHumanPrimitive;

    /** The free hand's bearing grip under the work's clock. */
    contact: (
      clock: IAutoMovieMotionClock,
    ) => IAutoMovieMotionHumanContactWindow;

    /** The free hand. */
    side: AutoMovieHumanSide;
  }
}
