import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionPropDrive,
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
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { workHeldPush } from "../handling/workHeldPush";
import { writeWith } from "../handling/writeWith";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { rotationBetween } from "./rotationBetween";

/**
 * The nozzle reaction of a 150 gpm fog stream at 100 psi, newtons: the
 * IFSTA fog-nozzle formula NR = 0.0505 Q sqrt(P) gives 75.75 lbf, 337 N.
 * The flow and pressure are a common hand line's, provisional for a scene.
 */
const REACTION: number = 0.0505 * 150 * Math.sqrt(100) * 4.448;

/** The film rate the backup reads the line's grip at, frames per second. */
const FRAME: number = 24;

/** Both hands. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** Gravity, metres per second squared. */
const G: number = 9.81;

/** Seconds of one full sweep of the stream: provisional. */
const SWEEP: number = 1.2;

/** Sweeps when none are asked. */
const SWEEPS: number = 3;

/** The stream's sweep, degrees in all: provisional. */
const SPAN: number = 30;

/** Seconds to set the hands and the lean: provisional. */
const SET: number = 0.6;

/**
 * One member of a two-member hose team holding a charged line against its
 * nozzle reaction. Register as `hoseLine`.
 *
 * The nozzle operator holds the line by its `nozzle` grip (taken up before);
 * the free hand swings the nozzle's `bail` open and keeps it there
 * (`workHeldPush`), while the holding wrist turns the stream's `tip` onto
 * the target and sweeps it side to side, as `extinguish` sweeps its horn.
 * The backup member, behind, grips the line at their `grip` with both
 * hands without carrying it: the hands follow that grip where the
 * operator's hold puts the line at each second. Both members lean into the
 * reaction: the stream pushes the line back with `REACTION` newtons, which
 * the team shares, so each member's trunk tips forward by
 * `atan(REACTION / 2 / (m g))` over the feet, the lean that brings the
 * body's weight to balance its share. `advance` is walked by the team
 * before (`HumanFirefight.hoseTeam`); here the members stand. Events:
 * `strokeStart` as the stream opens, `strokeEnd` as it shuts.
 *
 * Refusals: an operator without a target or not holding the line, a line
 * without the named grip, bail or tip, and a grip beyond the arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both roles, the reaction's source, the shared lean, the timing and the refusals.
 * @evidence contracts/development/design.md#principled-representation A law record over the line's declared grips, bail and tip.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The backup grips without carrying, so the line has one carrier.
 */
export const hoseLine: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFirefight.IHoseLine> =
  {
    name: "hoseLine",
    interrupts: {
      any: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/** Plan the member's role. */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IHoseLine>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanFirefight.IHoseLine = context.params;
  const sweeps: number = p.sweeps ?? SWEEPS;
  const tempo: number = context.tempo ?? 1;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: tempo * SET,
    attack: tempo * SWEEP * sweeps,
    retract: tempo * SET,
  });
  const lean: number =
    (Math.atan(REACTION / 2 / (context.body.profile.mass * G)) * 180) / Math.PI;
  const under: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const base: IAutoMovieMotionHumanActionPlan = {
    ...under,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = under.posture(seconds);
      const w: number = clock.envelope(
        ["start", "ready"],
        ["relax", "end"],
        seconds,
      );
      const spine: readonly [number, number, number] = posture.joints.spine ?? [
        0, 0, 0,
      ];
      return {
        ...posture,
        joints: {
          ...posture.joints,
          spine: [spine[0] + lean * w, spine[1], spine[2]],
        },
      };
    },
  };
  return p.role === "nozzle"
    ? nozzle(context, p, clock, base, sweeps)
    : backup(context, p, clock, base);
}

/** The operator: the bail open by the free hand, the stream swept by the holding wrist. */
function nozzle(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IHoseLine>,
  p: IAutoMovieMotionHumanFirefight.IHoseLine,
  clock: IAutoMovieMotionClock,
  base: IAutoMovieMotionHumanActionPlan,
  sweeps: number,
): IAutoMovieMotionHumanActionPlan {
  if (p.target === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "target",
      value: "absent",
      feasible: null,
      reason: "the nozzle operator aims the stream at a target",
      fix: "give the target the stream sweeps",
    });
  const side: AutoMovieHumanSide =
    context.entry.holds.left === p.prop ? "left" : "right";
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    p.prop,
  );
  const tip: IAutoMovieAffordance | undefined = held.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "tip",
  );
  const bail: IAutoMovieAffordance | undefined = held.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "bail",
  );
  if (tip === undefined || bail === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: p.prop,
      feasible: null,
      reason: `${p.prop} declares no nozzle tip and bail`,
      fix: "hold a hose line whose nozzle declares `tip` and `bail`",
    });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const open: number = bail.travel ?? 0;
  // The bail swings open as the stroke starts and stays open to its end.
  const drives: IAutoMovieMotionPropDrive[] = [
    {
      prop: p.prop,
      articulation: "bail",
      from: 0,
      to: 1,
      travel: (seconds: number): number => {
        const u: number = Math.min(
          1,
          Math.max(0, (seconds - (ready - SET / 2)) / (SET / 2)),
        );
        const v: number = Math.min(
          1,
          Math.max(0, (seconds - done) / (SET / 2)),
        );
        return open * (u * u * (3 - 2 * u)) * (1 - v * v * (3 - 2 * v));
      },
    },
  ];
  const push: workHeldPush.IPush = workHeldPush(
    context,
    p.prop,
    "bailTip",
    side,
    [{ articulation: "bail", to: open }],
  );
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const frame: IAutoMovieRigidTransform = context
    .prop(p.prop)
    .frame(context.entry.seconds);
  const outlet: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, tip.frame.translation),
  );
  const stream: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, tip.frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const at: IAutoMovieVector3 = context.aim(p.target, context.start).point;
  const aimed: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      rotationBetween(
        Vector3.normalize(stream),
        Vector3.normalize(Vector3.subtract(at, outlet)),
      ),
      hand.worldRotation,
    ),
  );
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    side,
  );
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body: context.body,
    side,
    from: 0,
    to: clock.duration,
    span: { start: 0, ready, relax: done, end: clock.duration },
    rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
    disc: 0,
    weight: (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds),
    goal: (
      _posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieHumanLimbGoal => {
      const u: number = Math.min(
        1,
        Math.max(0, (seconds - ready) / (done - ready)),
      );
      const yaw: number = (SPAN / 2) * Math.sin(2 * Math.PI * sweeps * u);
      return {
        point: hand.worldPosition,
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
            aimed,
          ),
        ),
        bend,
      };
    },
  });
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
      primitives: [arm, push.arm(clock, drives)],
      contact: "strokeStart",
    });
  return {
    ...composed,
    hands: [side, push.side],
    contacts: [
      ...composed.contacts,
      AutoMovieMotionHumanHeld.grip(held),
      push.contact(clock),
    ],
    holds: [...(composed.holds ?? []), { ...kept, from: 1 }],
    drives,
  };
}

/** The backup: both hands on the line's grip without carrying it. */
function backup(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IHoseLine>,
  p: IAutoMovieMotionHumanFirefight.IHoseLine,
  clock: IAutoMovieMotionClock,
  base: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanActionPlan {
  const grip: IAutoMovieAffordance | undefined = (
    context.prop(p.prop).prop.affordances ?? []
  ).find((a: IAutoMovieAffordance): boolean => a.id === p.grip);
  if (grip === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "grip",
      value: p.grip,
      feasible: null,
      reason: `${p.prop} declares no grip called ${p.grip}`,
      fix: "name the line's grip for this member",
    });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  // Where the line's grip is at a second of this action, as its carrier
  // holds it: read once per film frame and interpolated between, since each
  // read resolves the carrier's pose.
  const sampled: Map<number, IAutoMovieVector3> = new Map();
  const frameAt: (k: number) => IAutoMovieVector3 = (
    k: number,
  ): IAutoMovieVector3 => {
    let found: IAutoMovieVector3 | undefined = sampled.get(k);
    if (found === undefined) {
      const frame: IAutoMovieRigidTransform = context
        .prop(p.prop)
        .frame(context.start + Math.min(clock.duration, k / FRAME));
      found = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, grip.frame.translation),
      );
      sampled.set(k, found);
    }
    return found;
  };
  const at: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 => {
    const s: number = Math.min(clock.duration, Math.max(0, seconds)) * FRAME;
    const k: number = Math.floor(s);
    return Vector3.lerp(frameAt(k), frameAt(k + 1), s - k);
  };
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const arms: IAutoMovieMotionHumanPrimitive[] = SIDES.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive => {
      const turn: IAutoMovieQuaternion = bones.get(
        `${side}Hand`,
      )!.worldRotation;
      const offset: IAutoMovieVector3 = HumanHand.offset(
        context.body,
        side,
        "grip",
      ).point;
      // The two hands a hand's width apart along the line.
      const along: number = side === "left" ? 0.06 : -0.06;
      writeWith.reach(
        context,
        side,
        [Vector3.add(at(ready), { x: 0, y: 0, z: along })],
        Quaternion.rotateVector(turn, offset),
      );
      return AutoMovieMotionHumanArm.carried({
        body: context.body,
        side,
        from: 0,
        to: clock.duration,
        span: { start: 0, ready, relax: done, end: clock.duration },
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        disc: 0,
        weight: (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        goal: (
          _posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieHumanLimbGoal => ({
          point: Vector3.subtract(
            Vector3.add(at(seconds), { x: 0, y: 0, z: along }),
            Quaternion.rotateVector(turn, offset),
          ),
          rotation: turn,
          contact: offset,
          bend: AutoMovieMotionHumanBend.hang(
            context.body,
            context.entry.posture,
            side,
          ),
        }),
      });
    },
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: arms,
      contact: "strokeStart",
    });
  return {
    ...composed,
    hands: ["left", "right"],
    contacts: [
      ...composed.contacts,
      ...SIDES.map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: side === "left" ? "leftHand" : "rightHand",
          kind: "grip",
          from: ready / clock.duration,
          to: done / clock.duration,
          support: { kind: "prop", subject: p.prop, carries: false },
        }),
      ),
    ],
  };
}
