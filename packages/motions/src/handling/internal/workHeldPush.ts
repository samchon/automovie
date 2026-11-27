import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionPropDrive,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspRoll } from "./HumanGraspRoll";
import { heldDigits } from "./heldDigits";
import { pickUp } from "./pickUp";

/*
 * The free hand working a contact of a prop the other hand holds still: the
 * hand that pushes an umbrella's runner up its shaft.
 *
 * The holding hand keeps the prop in its entry frame when the free arm reaches
 * the contact at the work's start and end. Otherwise it first brings the prop
 * before the body: the contact's start onto the performer's midline at the free
 * elbow's hanging height, a forearm ahead of the shoulder, where the forearm
 * lies level from an elbow at the side, the prop turned about the vertical so
 * the contact's travel leads toward the free hand's side; the prop is then held
 * still there. The contact's place at every second is the articulation's travel
 * there (`heldDigits.posed`) carried by the held frame. The free hand closes
 * round the contact's line in a power grip (`HumanGrasp.hand`), rolled about
 * that line so its wrist lies nearest the shoulder (`HumanGraspRoll`), and its
 * wrist moves with the contact in that attitude, so the hand stays on the
 * contact as it moves. The grip bears the part without carrying the prop. The
 * contact must ride a driven articulation, and its places at the work's start
 * and end, and the holding wrist before the body, must lie within their arms'
 * reach.
 * Parameter context: The action's context.
 * Parameter subject: The held prop.
 * Parameter site: The contact the free hand works.
 * Parameter side: The holding hand; the other one pushes.
 * Parameter drive: The work's authored drives of the held prop.
 * Returns: The free arm and its grip under the work's clock and planned drives,
 * the holding arm that brings the prop before the body, and the larger
 * travel.
 * When the contact rides no driven articulation, or lies
 * beyond the free arm even before the body, or the holding wrist there lies
 * beyond its arm.
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
    throw new AutoMovieMotionHumanRefusal({
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
  const entry: IAutoMovieRigidTransform = context
    .prop(subject)
    .frame(context.entry.seconds);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const hand: IAutoMovieResolvedBone = bones.get(`${other}Hand`)!;
  const shoulder: IAutoMovieVector3 = bones.get(
    `${other}UpperArm`,
  )!.worldPosition;
  const start: number =
    context.prop(subject).state?.(context.start)?.[joint.id] ?? 0;
  const end: number = pushed.to;
  // Held where it is when the free arm reaches the contact through the
  // work; otherwise first brought before the body (`presentation`).
  const still: workHeldPush.IGrasp = grasp(
    context,
    other,
    joint,
    contact,
    entry,
    start,
    shoulder,
  );
  const reaches: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean =
    pickUp.reaches(context, other);
  const kept: boolean = [start, end].every((travel: number): boolean =>
    reaches({ point: still.wrist(travel), rotation: still.turn }),
  );
  const holding: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const moved: IAutoMovieRigidTransform | undefined = kept
    ? undefined
    : presentation(context, other, shoulder, still, start, end);
  // The rigid move of the held prop, and of the hand that holds it.
  const carry: (from: IAutoMovieRigidTransform) => IAutoMovieRigidTransform = (
    from: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform =>
    moved === undefined
      ? from
      : {
          position: Vector3.add(
            moved.position,
            Quaternion.rotateVector(
              moved.rotation,
              Vector3.subtract(from.position, still.place(start)),
            ),
          ),
          rotation: Quaternion.normalize(
            Quaternion.multiply(moved.rotation, from.rotation),
          ),
        };
  const grasped: workHeldPush.IGrasp =
    moved === undefined
      ? still
      : grasp(context, other, joint, contact, carry(entry), start, shoulder);
  const wrist: (travel: number) => IAutoMovieVector3 = grasped.wrist;
  const turn: IAutoMovieQuaternion = grasped.turn;
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    other,
    "grip",
    "flat",
  ).point;
  for (const travel of [start, end])
    pickUp.reachable(context, other, wrist(travel));
  const holder: IAutoMovieRigidTransform = carry({
    position: holding.worldPosition,
    rotation: holding.worldRotation,
  });
  pickUp.reachable(context, side, holder.position);
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    other,
  );
  return {
    travel: Math.max(
      Vector3.length(Vector3.subtract(wrist(start), hand.worldPosition)),
      Vector3.length(Vector3.subtract(holder.position, holding.worldPosition)),
    ),
    holder: (clock: IAutoMovieMotionClock): IAutoMovieMotionHumanPrimitive[] =>
      moved === undefined
        ? []
        : [
            present(
              context,
              side,
              clock,
              holder.position,
              holder.rotation,
              Quaternion.rotateVector(
                Quaternion.inverse(holding.worldRotation),
                Vector3.subtract(entry.position, holding.worldPosition),
              ),
            ),
          ],
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

/*
 * The free hand's grip of the contact on the held prop at a frame: it closes
 * round the contact's line (its `+X`) as a power grip takes any handle
 * (`HumanGrasp.hand`), arriving along the contact's own `-Y`, then rolls about
 * that line until its wrist lies nearest the shoulder (`HumanGraspRoll`), and
 * keeps that attitude as the contact moves.
 */
function grasp(
  context: IAutoMovieMotionHumanActionContext<object>,
  other: AutoMovieHumanSide,
  joint: IAutoMovieAffordance,
  contact: IAutoMovieAffordance,
  frame: IAutoMovieRigidTransform,
  start: number,
  shoulder: IAutoMovieVector3,
): workHeldPush.IGrasp {
  const place: (travel: number) => IAutoMovieVector3 = (
    travel: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        heldDigits.posed(joint, contact, travel),
      ),
    );
  const turned: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    contact.frame.rotation,
  );
  const line: IAutoMovieVector3 = Vector3.normalize(
    Quaternion.rotateVector(turned, { x: 1, y: 0, z: 0 }),
  );
  const grasped: IAutoMovieMotionHumanHand.IWrist = HumanGraspRoll(
    HumanGrasp.hand(context.body, other, {
      point: place(start),
      approach: Vector3.normalize(
        Quaternion.rotateVector(turned, { x: 0, y: -1, z: 0 }),
      ),
      axis: line,
      width: contact.aperture ?? 0,
    }),
    place(start),
    line,
    shoulder,
  );
  return {
    place,
    wrist: (travel: number): IAutoMovieVector3 =>
      Vector3.add(grasped.point, Vector3.subtract(place(travel), place(start))),
    turn: grasped.rotation,
  };
}

/*
 * How a prop whose contact the free arm cannot reach is brought before the
 * body: the contact's start goes onto the performer's midline at the free
 * elbow's height when the upper arm hangs, a forearm ahead of the shoulder,
 * where the forearm lies level from an elbow at the side, the neutral working
 * posture; and the prop turns about the vertical through it, the least way,
 * until the contact's travel leads toward the free hand's side, away from the
 * hand that holds it, as a pin is pulled out sideways.
 * Returns: The contact's new start, world metres, and the turn about it.
 */
function presentation(
  context: IAutoMovieMotionHumanActionContext<object>,
  other: AutoMovieHumanSide,
  shoulder: IAutoMovieVector3,
  still: workHeldPush.IGrasp,
  start: number,
  end: number,
): IAutoMovieRigidTransform {
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const floor: IAutoMovieMotionHumanFrame = {
    origin: { x: posture.root.x, y: 0, z: posture.root.z },
    yaw: posture.yaw,
  };
  const ahead: number = HumanFrame.local(floor, shoulder).z;
  const point: IAutoMovieVector3 = HumanFrame.point(floor, {
    x: 0,
    y: shoulder.y - context.body.measure.upperArm,
    z: ahead + context.body.measure.forearm,
  });
  // World +X is the performer's left at heading 0.
  const away: IAutoMovieVector3 = Vector3.subtract(
    HumanFrame.point(floor, { x: other === "left" ? 1 : -1, y: 0, z: 0 }),
    HumanFrame.point(floor, { x: 0, y: 0, z: 0 }),
  );
  const along: IAutoMovieVector3 = Vector3.subtract(
    still.place(end),
    still.place(start),
  );
  const level: IAutoMovieVector3 = { x: along.x, y: 0, z: along.z };
  const degrees: number =
    Vector3.length(level) === 0
      ? 0
      : (Math.atan2(
          level.z * away.x - level.x * away.z,
          level.x * away.x + level.z * away.z,
        ) *
          180) /
        Math.PI;
  return {
    position: point,
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, degrees),
  };
}
/*
 * The holding arm bringing the prop before the body and keeping it there.
 */
function present(
  context: IAutoMovieMotionHumanActionContext<object>,
  side: AutoMovieHumanSide,
  clock: IAutoMovieMotionClock,
  wrist: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  offset: IAutoMovieVector3,
): IAutoMovieMotionHumanPrimitive {
  const ready: number = clock.at("strokeStart");
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    side,
  );
  return AutoMovieMotionHumanArm.carried({
    body: context.body,
    side,
    from: 0,
    to: clock.duration,
    span: { start: 0, ready, relax: clock.duration, end: clock.duration },
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    weight: (seconds: number): number => {
      const u: number =
        ready > 0 ? Math.min(1, Math.max(0, seconds / ready)) : 1;
      return u * u * (3 - 2 * u);
    },
    goal: (): IAutoMovieHumanLimbGoal => ({
      point: wrist,
      rotation,
      contact: offset,
      bend,
    }),
  });
}

/*
 * The parts workHeldPush hands its caller.
 */
export namespace workHeldPush {
  /*
   * The free hand's part of the work.
   */
  export interface IPush {
    /*
     * The free wrist's travel to the contact at the start, metres.
     */
    travel: number;

    /*
     * The free arm under the work's clock.
     */
    arm: (
      clock: IAutoMovieMotionClock,
      drives: readonly IAutoMovieMotionPropDrive[],
    ) => IAutoMovieMotionHumanPrimitive;

    /*
     * The free hand's bearing grip under the work's clock.
     */
    contact: (
      clock: IAutoMovieMotionClock,
    ) => IAutoMovieMotionHumanContactWindow;

    /*
     * The free hand.
     */
    side: AutoMovieHumanSide;

    /*
     * The holding arm bringing the prop before the body under the work's clock;
     * none when the prop stays where it is.
     */
    holder: (clock: IAutoMovieMotionClock) => IAutoMovieMotionHumanPrimitive[];
  }

  /*
   * The free hand's grip of the contact at one frame of the held prop.
   */
  export interface IGrasp {
    /*
     * The contact at a travel, world metres.
     */
    place: (travel: number) => IAutoMovieVector3;

    /*
     * The free wrist at a travel, world metres.
     */
    wrist: (travel: number) => IAutoMovieVector3;

    /*
     * The free hand's attitude, world.
     */
    turn: IAutoMovieQuaternion;
  }
}
