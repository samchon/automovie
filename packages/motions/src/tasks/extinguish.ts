import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { heldDigits } from "../handling/heldDigits";
import { writeWith } from "../handling/writeWith";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { extinguishSweep } from "./extinguishSweep";
import { rotationBetween } from "./rotationBetween";

/**
 * Aim, squeeze and sweep an extinguisher whose pin is already pulled: the A, S
 * and S of OSHA's PASS (pull, aim, squeeze, sweep; Portable fire extinguishers,
 * https://osha.gov/etools/evacuation-plans-procedures/emergency-standards/portable-extinguishers/use).
 * Register as `extinguish`; the chain's `pass` pulls the pin first.
 *
 * The extinguisher rides the hand on its `handle`, so its `nozzle` lies at a
 * fixed lever from the wrist. The wrist stays where it is and turns the least
 * that points the nozzle's discharge at the fire's base (the aim), then sweeps
 * that aim side to side about the vertical through the wrist, `span` degrees in
 * all, `sweeps` times, while the holding hand's index finger squeezes the
 * `lever` down on its `leverTip` and holds it. The aim is reached over
 * `extinguishSweep.AIM` seconds and released over another, the lever let go as
 * the sweeps end. Events: `strokeStart` as the squeeze begins, `strokeEnd` as
 * the sweeps end.
 *
 * Refusals: a hand that does not hold the extinguisher, a pin still in (the
 * lever is locked until it is pulled), an extinguisher without its lever, pin
 * or nozzle, and a non-positive sweep count or span.
 */
export const extinguish: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFirefight.IExtinguish> =
  {
    name: "extinguish",
    interrupts: {
      any: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/** Admit the extinguisher, then aim, squeeze and sweep it. */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IExtinguish>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanFirefight.IExtinguish = context.params;
  const tempo: number = context.tempo ?? 1;
  const sweep: extinguishSweep.ISweep = extinguishSweep(
    p.sweeps,
    p.span,
    tempo,
  );
  const side: AutoMovieHumanSide =
    context.entry.holds.left === p.prop ? "left" : "right";
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.prop,
  );
  const sites: readonly IAutoMovieAffordance[] = held.affordances;
  const site: (id: string) => IAutoMovieAffordance = (
    id: string,
  ): IAutoMovieAffordance => {
    const found: IAutoMovieAffordance | undefined = sites.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: p.prop,
        feasible: null,
        reason: `${p.prop} declares no ${id}`,
        fix: "hold an extinguisher with a lever, a pin and a nozzle",
      });
    return found;
  };
  const pin: IAutoMovieAffordance = site("pin");
  site("lever");
  const nozzle: IAutoMovieAffordance = site("nozzle");
  const pulled: number =
    context.prop(p.prop).state?.(context.start)?.["pin"] ?? 0;
  if (pulled < (pin.travel ?? 0) - 1e-6)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "prop",
      value: pulled,
      feasible: {
        kind: "range",
        minimum: pin.travel ?? 0,
        maximum: pin.travel ?? 0,
        unit: "m",
      },
      reason: "the lever is locked while the pin is in",
      fix: "pull the pin first (the chain's `pass`)",
    });

  // The unit turns about the hand's grip on it, the grip staying where it
  // took the handle, so the nozzle's discharge meets the fire.
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(context.body, context.entry.pose);
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const grip: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    "grip",
  ).point;
  const socket: IAutoMovieVector3 = Vector3.add(
    hand.worldPosition,
    Quaternion.rotateVector(hand.worldRotation, grip),
  );
  const frame: IAutoMovieRigidTransform = context
    .prop(p.prop)
    .frame(context.entry.seconds);
  const outlet: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, nozzle.frame.translation),
  );
  const discharge: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, nozzle.frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const fire: IAutoMovieVector3 = context.aim(p.target, context.start).point;
  const aim: IAutoMovieQuaternion = rotationBetween(
    Vector3.normalize(discharge),
    Vector3.normalize(Vector3.subtract(fire, outlet)),
  );
  const aimed: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(aim, hand.worldRotation),
  );
  const clock: IAutoMovieMotionClock = sweep.clock;
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  const turn: (seconds: number) => IAutoMovieQuaternion = (
    seconds: number,
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, sweep.yaw(seconds)),
        aimed,
      ),
    );
  const drive: IAutoMovieMotionHumanHeldWork.IDrive[] = [
    {
      articulation: "lever",
      to: site("lever").travel ?? 0,
      by: { digit: "index", site: "leverTip" },
    },
  ];
  const squeeze: IAutoMovieMotionPropDrive[] = writeWith.drives(
    context,
    p.prop,
    drive,
    clock.duration,
    ready - tempo * 0.15,
    ready,
  );
  const digits: (
    seconds: number,
  ) => Partial<Record<AutoMovieHumanDigit, IAutoMovieHumanDigitGoal>> =
    heldDigits(context, held, drive, squeeze);
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
  );
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    context.entry.posture,
    side,
  );
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
      primitives: [
        AutoMovieMotionHumanArm.carried({
          body: context.body,
          side,
          from: 0,
          to: clock.duration,
          span: { start: 0, ready, relax: done, end: clock.duration },
          // The whole clock is the law's own, lengthened by a slower tempo.
          together: AutoMovieMotionHumanArm.together(
            context.handover,
            true,
            context.tempo,
          ),
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: (seconds: number): number =>
            clock.envelope(["start", "ready"], ["relax", "end"], seconds),
          goal: (
            _posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieHumanLimbGoal => ({
            point: Vector3.subtract(
              socket,
              Quaternion.rotateVector(turn(seconds), grip),
            ),
            rotation: turn(seconds),
            contact: grip,
            bend,
          }),
        }),
      ],
      contact: "strokeStart",
    });
  // The lever is let go as the sweeps end.
  const release: IAutoMovieMotionPropDrive[] = writeWith
    .drives(
      context,
      p.prop,
      [{ articulation: "lever", to: 0 }],
      clock.duration,
      done,
      Math.min(clock.duration, done + tempo * 0.15),
    )
    .map(
      (d: IAutoMovieMotionPropDrive): IAutoMovieMotionPropDrive => ({
        ...d,
        travel: (seconds: number): number =>
          (site("lever").travel ?? 0) *
          (1 -
            Math.min(
              1,
              Math.max(0, (seconds - done) / Math.max(tempo * 0.15, 1e-9)),
            )),
      }),
    );
  return {
    ...composed,
    hands: [side],
    contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [...(composed.holds ?? []), { ...kept, from: 1 }],
    drives: [...squeeze, ...release],
  };
}
