import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { admitHeldWork } from "./admitHeldWork";
import { heldDigits } from "./heldDigits";
import { pickUp } from "./pickUp";
import { workHeldPush } from "./workHeldPush";
import { writeWith } from "./writeWith";
import * as WorkHeldData from "./WorkHeldData";

/*
 * Work a prop the hand already holds without letting go: the fingers drive its
 * articulations (scissor blades closed by their rings, a folding knife's blade
 * swung open on its pivot, a chopstick pinched), the hand may first carry it to
 * a place in the performer's floor frame (a tray on the palm at shoulder
 * height, an umbrella over the head, kept level when asked), and the prop may
 * take another prop onto one of its sockets at the end (a morsel pinched
 * between chopstick tips). The free hand may push a part the drive moves while
 * the holding hand keeps still (an umbrella's runner pushed up its shaft), the
 * holder first bringing the prop before the body when the free arm cannot reach
 * the part (an extinguisher's pin pulled, workHeldPush). Register as
 * `workHeld`.
 *
 * The grip never opens, so the prop rides the palm's frame throughout and its
 * place is reached by the wrist that holds it there: the hand-to-prop offset
 * the grip keeps, read from the displayed frames at entry, inverted at the
 * place (as `putDown` places a prop). The hand reaches the place in the
 * transport movement time over its travel (`AutoMovieMotionHumanTiming`) and
 * stays there, so the hold that persists afterwards carries the prop with the
 * trunk through a walk. A take with no place is reached the same way: the wrist
 * first carries the held prop's take socket onto the prop it takes, the hand
 * keeping its attitude, as a reach to grasp transports the grasping point to
 * the object before the grip closes on it (Jeannerod 1984, J Mot Behav 16:235,
 * the transport and grasp components). The drives run over the work's `seconds`
 * after the transport, each from the performance's travel at the start. Events:
 * the clock's `strokeStart` and `strokeEnd`.
 *
 * Refusals: a work that neither drives, moves nor takes; a hand that does not
 * hold the prop; a place, or a prop to take, beyond the arm; an articulation
 * the prop does not declare or a travel outside its range; a socket the prop
 * lacks.
 */
export const workHeld: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHeldWork.IParams> =
  {
    name: "workHeld",
    interrupts: {
      any: [
        {
          window: { start: "strokeEnd", end: 1 },
          kind: "inertialize",
          entry: 0,
        },
      ],
    },
    plan,
  };

/*
 * Admit the work, then place the hand, drive the articulations and take the
 * prop.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeldWork.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanHeldWork.IParams = context.params;
  admitHeldWork(p);
  const side: AutoMovieHumanSide =
    p.hand ?? (context.entry.holds.left === p.prop ? "left" : "right");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.prop,
  );
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  if (p.push !== undefined && p.at !== undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "push",
      value: p.push,
      feasible: null,
      reason:
        "the free hand pushes a part of a prop the other hand holds still",
      fix: "carry the prop to its place first, then push",
    });
  const goal: IGoal | undefined =
    p.at !== undefined
      ? place(context, p.prop, side, p.at)
      : p.take !== undefined
        ? taking(context, p.prop, side, p.take)
        : undefined;
  const push: workHeldPush.IPush | undefined =
    p.push === undefined
      ? undefined
      : workHeldPush(context, p.prop, p.push, side, p.drive ?? []);
  const tempo: number = context.tempo ?? 1;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare:
      tempo *
      AutoMovieMotionHumanTiming.transport(
        Math.max(goal?.travel ?? 0, push?.travel ?? 0),
      ),
    attack: tempo * p.duration,
    retract:
      push === undefined
        ? 0
        : tempo * AutoMovieMotionHumanTiming.transport(push.travel),
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const toolDrives: IAutoMovieMotionPropDrive[] = writeWith.drives(
    context,
    p.prop,
    p.drive ?? [],
    clock.duration,
    ready,
    done,
  );
  const primitives: IAutoMovieMotionHumanPrimitive[] = [
    ...(goal === undefined ? [] : [arm(context, side, clock, ready, goal)]),
    ...(push === undefined
      ? []
      : [push.arm(clock, toolDrives), ...push.holder(clock)]),
  ];
  const digits: (
    seconds: number,
  ) => Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> =
    heldDigits(context, held, p.drive ?? [], toolDrives);
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: {
        ...base,
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const posture: IAutoMovieMotionHumanPosture = base.posture(seconds);
          return {
            ...posture,
            joints: { ...posture.joints, ...kept.fingers },
            digits: { ...posture.digits, ...digits(seconds) },
          };
        },
      },
      clock,
      primitives,
      contact: "strokeStart",
    });
  return {
    ...composed,
    hands: push === undefined ? [side] : [side, push.side],
    contacts: [
      ...composed.contacts,
      AutoMovieMotionHumanHeld.grip(held),
      ...(push === undefined ? [] : [push.contact(clock)]),
    ],
    holds: [...(composed.holds ?? []), { ...kept, from: 1 }],
    drives: toolDrives,
    mounts:
      p.take === undefined
        ? []
        : [writeWith.mount(context, p.take, p.prop, done / clock.duration)],
  };
}

/*
 * The wrist that holds the prop's origin at the place, refused beyond the arm.
 */
function place(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeldWork.IParams>,
  subject: string,
  side: AutoMovieHumanSide,
  at: IAutoMovieMotionHumanHeldWork.IPlace,
): IGoal {
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const point: IAutoMovieVector3 = HumanFrame.point(
    {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    },
    { x: side === "left" ? at.out : -at.out, y: at.up, z: at.forward },
  );
  const bone: AutoMovieHumanoidBone = `${side}Hand`;
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
  ).get(bone)!;
  const prop: IAutoMovieRigidTransform = context
    .prop(subject)
    .frame(context.entry.seconds);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
  const offset: IAutoMovieRigidTransform = {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(prop.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, prop.rotation),
  };
  // A level prop keeps its declared up on the world's up at whichever
  // heading the arm holds it exactly (`HumanGrasp.reachable`), as a level
  // put down does; another keeps its attitude in the hand.
  const holding: (
    rest: IAutoMovieQuaternion,
  ) => IAutoMovieMotionHumanHand.IWrist = (
    rest: IAutoMovieQuaternion,
  ): IAutoMovieMotionHumanHand.IWrist => {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(rest, Quaternion.inverse(offset.rotation)),
    );
    return {
      point: Vector3.subtract(
        point,
        Quaternion.rotateVector(rotation, offset.position),
      ),
      rotation,
    };
  };
  const declared: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      HumanFrame.turn(posture.yaw),
      context.prop(subject).prop.frame.rotation,
    ),
  );
  const chosen: IAutoMovieMotionHumanHand.IWrist =
    at.level === true
      ? HumanGrasp.reachable(
          context.body,
          posture,
          side,
          AutoMovieMotionHumanBend.hang(context.body, posture, side),
          (turn: number): IAutoMovieMotionHumanHand.IWrist =>
            holding(
              Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, turn),
                declared,
              ),
            ),
          undefined,
          undefined,
          undefined,
          undefined,
          pickUp.reaches(context, side),
        ).wrist
      : holding(prop.rotation);
  const rotation: IAutoMovieQuaternion = chosen.rotation;
  const wrist: IAutoMovieVector3 = chosen.point;
  writeWith.reach(context, side, [wrist], { x: 0, y: 0, z: 0 });
  // A level prop's rim is held within LEVEL of the asked attitude as a
  // hard task limit, since a goal's rotation alone gives way where the arm
  // cannot meet it.
  const rim: IAutoMovieHumanEffectorPointLimit[] =
    at.level === true
      ? [
          { x: WorkHeldData.RIM, y: 0, z: 0 },
          { x: -WorkHeldData.RIM, y: 0, z: 0 },
          { x: 0, y: 0, z: WorkHeldData.RIM },
          { x: 0, y: 0, z: -WorkHeldData.RIM },
        ].map(
          (axis: IAutoMovieVector3): IAutoMovieHumanEffectorPointLimit => ({
            contact: Vector3.add(
              offset.position,
              Quaternion.rotateVector(offset.rotation, axis),
            ),
            bound: WorkHeldData.RIM * Math.sin((WorkHeldData.LEVEL * Math.PI) / 180),
          }),
        )
      : [];
  return {
    wrist,
    rotation,
    contact: offset.position,
    limits: rim,
    travel: Vector3.length(Vector3.subtract(wrist, hand.worldPosition)),
  };
}

/*
 * The wrist that brings the held prop's take socket onto the prop it takes, the
 * hand keeping its attitude: the transport component of a reach to grasp, which
 * carries the grasping point to the object before the grip closes on it
 * (Jeannerod 1984, "The timing of natural prehension movements", J Mot Behav
 * 16:235), the grasping point here the held prop's socket, which rides the
 * wrist rigidly (`writeWith`: the wrist goal is the point less the lever).
 * Refused where the socket is not on the held prop or the wrist lies beyond the
 * arm.
 */
function taking(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeldWork.IParams>,
  subject: string,
  side: AutoMovieHumanSide,
  take: IAutoMovieMotionHumanHeldWork.IMount,
): IGoal {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const socket: IAutoMovieAffordance | undefined =
    reader.prop.affordances?.find(
      (a: IAutoMovieAffordance): boolean => a.id === take.point,
    );
  if (socket === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "point",
      value: take.point,
      feasible: {
        kind: "alternatives",
        values: (reader.prop.affordances ?? []).map(
          (a: IAutoMovieAffordance): string => a.id,
        ),
      },
      reason: `${subject} has no contact called ${take.point}`,
      fix: "name a contact the receiving prop declares",
    });
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
  ).get(`${side}Hand`)!;
  const frame: IAutoMovieRigidTransform = reader.frame(context.entry.seconds);
  const point: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, socket.frame.translation),
  );
  const rotation: IAutoMovieQuaternion = hand.worldRotation;
  const contact: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    Vector3.subtract(point, hand.worldPosition),
  );
  const target: IAutoMovieVector3 = context
    .prop(take.prop)
    .frame(context.entry.seconds).position;
  const wrist: IAutoMovieVector3 = Vector3.subtract(
    target,
    Quaternion.rotateVector(rotation, contact),
  );
  writeWith.reach(context, side, [wrist], { x: 0, y: 0, z: 0 });
  return {
    wrist,
    rotation,
    contact,
    limits: [],
    travel: Vector3.length(Vector3.subtract(wrist, hand.worldPosition)),
  };
}

/*
 * The holding arm carried to the place and kept there.
 */ function arm(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeldWork.IParams>,
  side: AutoMovieHumanSide,
  clock: IAutoMovieMotionClock,
  ready: number,
  goal: IGoal,
): IAutoMovieMotionHumanPrimitive {
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
    // The whole clock is the law's own, lengthened by a slower tempo.
    together: AutoMovieMotionHumanArm.together(
      context.handover,
      true,
      context.tempo,
    ),
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    weight: (seconds: number): number => {
      const u: number =
        ready > 0 ? Math.min(1, Math.max(0, seconds / ready)) : 1;
      return u * u * (3 - 2 * u);
    },
    goal: (
      _posture: IAutoMovieMotionHumanPosture,
      _seconds: number,
    ): IAutoMovieHumanLimbGoal => ({
      point: goal.wrist,
      rotation: goal.rotation,
      contact: goal.contact,
      ...(goal.limits.length === 0 ? {} : { limits: goal.limits }),
      bend,
    }),
  });
}

/*
 * The wrist that holds the prop at its place.
 */
interface IGoal {
  /*
   * The wrist, world metres.
   */
  wrist: IAutoMovieVector3;

  /*
   * The hand's attitude, world.
   */
  rotation: IAutoMovieQuaternion;

  /*
   * The prop's origin from the wrist in the hand's frame, metres.
   */
  contact: IAutoMovieVector3;

  /*
   * The hard limits that keep a level prop level; none otherwise.
   */
  limits: IAutoMovieHumanEffectorPointLimit[];

  /*
   * The wrist's travel from entry, metres.
   */
  travel: number;
}
