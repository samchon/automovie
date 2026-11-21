import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { writeWith } from "./writeWith";

/**
 * Work a prop the hand already holds without letting go: the fingers drive
 * its articulations (scissor blades closed by their rings, a folding
 * knife's blade swung open on its pivot, a chopstick pinched), the hand
 * may first carry it to a place in the performer's floor frame (a tray on
 * the palm at shoulder height, an umbrella over the head, kept level when
 * asked), and the prop may take another prop onto one of its sockets at
 * the end (a morsel pinched between chopstick tips). Register as
 * `workHeld`.
 *
 * The grip never opens, so the prop rides the palm's frame throughout and
 * its place is reached by the wrist that holds it there: the hand-to-prop
 * offset the grip keeps, read from the displayed frames at entry, inverted
 * at the place (as `putDown` places a prop). The hand reaches the place in
 * the transport movement time over its travel (`AutoMovieMotionHumanTiming`)
 * and stays there, so the hold that persists afterwards carries the prop
 * with the trunk through a walk. The drives run over the work's `seconds`
 * after the transport, each from the performance's travel at the start.
 * Events: the clock's `strokeStart` and `strokeEnd`.
 *
 * Refusals: a work that neither drives, moves nor takes; a hand that does
 * not hold the prop; a place beyond the arm; an articulation the prop does
 * not declare or a travel outside its range; a socket the prop lacks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three parts, the kept grip, the timing, the events and every refusal.
 * @evidence contracts/development/design.md#principled-representation A law record over the held prop's declared articulations and sockets, with the place in the performer's floor frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop kind is named; every prop is read through its affordances.
 */
export const workHeld: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHeldWork.IParams> =
  {
    name: "workHeld",
    interrupts: {
      any: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/** Admit the work, then place the hand, drive the articulations and take the prop. */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHeldWork.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanHeldWork.IParams = context.params;
  if (
    (p.drive === undefined || p.drive.length === 0) &&
    p.at === undefined &&
    p.take === undefined
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "drive",
      value: "absent",
      feasible: { kind: "alternatives", values: ["drive", "at", "take"] },
      reason:
        "a held work drives an articulation, moves the prop or takes a prop",
      fix: "give `drive`, `at` or `take`",
    });
  if (!(Number.isFinite(p.seconds) && p.seconds > 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "seconds",
      value: p.seconds,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: Number.MAX_VALUE,
        unit: "s",
      },
      reason: "a held work needs a finite positive duration",
      fix: "give the work's duration in seconds",
    });
  const side: AutoMovieHumanSide =
    p.side ?? (context.entry.holds.left === p.prop ? "left" : "right");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    p.prop,
  );
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  const goal: IGoal | undefined =
    p.at === undefined ? undefined : place(context, p.prop, side, p.at);
  const tempo: number = context.tempo ?? 1;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare:
      goal === undefined
        ? 0
        : tempo * AutoMovieMotionHumanTiming.transport(goal.travel),
    attack: tempo * p.seconds,
    retract: 0,
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const primitives: IAutoMovieMotionHumanPrimitive[] =
    goal === undefined ? [] : [arm(context, side, clock, ready, goal)];
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
          return { ...posture, joints: { ...posture.joints, ...kept.fingers } };
        },
      },
      clock,
      primitives,
      contact: "strokeStart",
    });
  return {
    ...composed,
    hands: [side],
    contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [...(composed.holds ?? []), { ...kept, from: 1 }],
    drives: writeWith.drives(
      context,
      p.prop,
      p.drive ?? [],
      clock.duration,
      ready,
      done,
    ),
    mounts:
      p.take === undefined
        ? []
        : [writeWith.mount(context, p.take, p.prop, done / clock.duration)],
  };
}

/** The wrist that holds the prop's origin at the place, refused beyond the arm. */
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
  // A level prop rests at its declared attitude turned to the heading.
  const rest: IAutoMovieQuaternion =
    at.level === true
      ? Quaternion.normalize(
          Quaternion.multiply(
            HumanFrame.turn(posture.yaw),
            context.prop(subject).prop.frame.rotation,
          ),
        )
      : prop.rotation;
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(rest, Quaternion.inverse(offset.rotation)),
  );
  const wrist: IAutoMovieVector3 = Vector3.subtract(
    point,
    Quaternion.rotateVector(rotation, offset.position),
  );
  writeWith.reach(context, side, [wrist], { x: 0, y: 0, z: 0 });
  return {
    wrist,
    rotation,
    contact: offset.position,
    travel: Vector3.length(Vector3.subtract(wrist, hand.worldPosition)),
  };
}

/** The holding arm carried to the place and kept there. */
function arm(
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
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    disc: 0,
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
      bend,
    }),
  });
}

/** The wrist that holds the prop at its place. */
interface IGoal {
  /** The wrist, world metres. */
  wrist: IAutoMovieVector3;

  /** The hand's attitude, world. */
  rotation: IAutoMovieQuaternion;

  /** The prop's origin from the wrist in the hand's frame, metres. */
  contact: IAutoMovieVector3;

  /** The wrist's travel from entry, metres. */
  travel: number;
}
