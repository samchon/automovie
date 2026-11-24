import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
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
import { HumanTrunkLean } from "../handling/HumanTrunkLean";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { rotationBetween } from "./rotationBetween";

/** Strokes when none are asked. */
const COUNT: number = 4;

/** Seconds of one beat, raised and brought down: provisional. */
const BEAT: number = 0.6;

/** How high each beat raises the cloth above the region, metres: provisional. */
const RAISE: number = 0.3;

/**
 * How far above the region's surface the cloth's face comes down to, metres: it
 * smothers without pressing into the body.
 */
const CLEAR: number = 0.02;

/**
 * Beat flames on a lying partner with a held cloth: a wet sack or a flapper
 * brought down flat on the burning region again and again, smothering it.
 * Register as `beatFlames`.
 *
 * The cloth rides the hand that holds it, so its working `face` lies at a fixed
 * lever from the wrist; the wrist holds the attitude that lays the face flat on
 * the region, its normal turned the least way from where the hand held it
 * against the region's, and brings the face down to `CLEAR` above the region's
 * surface along its outward normal, then raises it `RAISE` above and back down,
 * `count` times on a `BEAT` each, reaching the first in the transport movement
 * time. The region is read where the partner lies at the start. Events:
 * `strokeStart` at the first beat, `strokeEnd` after the last.
 *
 * The trunk leans in over the partner as far as the beats need
 * (`HumanTrunkLean`). Refusals: a hand that does not hold the cloth, a cloth
 * without a `face`, a non-positive whole count, and a region beyond the arm at
 * every hinge the hips' range allows.
 */
export const beatFlames: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFirefight.IBeatFlames> =
  {
    name: "beatFlames",
    interrupts: {
      any: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/**
 * Admit the cloth and the region, then beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the held lever, the beat, the clearance, the timing and the refusals.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFirefight.IBeatFlames>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanFirefight.IBeatFlames = context.params;
  const count: number = p.count ?? COUNT;
  if (!(Number.isInteger(count) && count > 0))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "count",
      value: count,
      feasible: {
        kind: "range",
        minimum: 1,
        maximum: Number.MAX_SAFE_INTEGER,
        unit: "",
      },
      reason: "beats are a positive whole count",
      fix: "give a whole number of beats",
    });
  const side: AutoMovieHumanSide =
    context.entry.holds.left === p.prop ? "left" : "right";
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    p.prop,
  );
  const frame: IAutoMovieRigidTransform = context
    .prop(p.prop)
    .frame(context.entry.seconds);
  const region: ReturnType<typeof context.aim> = context.aim(
    { kind: "person", subject: p.partner, region: p.region },
    context.start,
  );
  // The hand's attitude that lays the cloth's face flat on the region: the
  // face's outward normal turned, the least way, against the region's.
  const entry: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      frame.rotation,
      Quaternion.inverse(held.frame.rotation),
    ),
  );
  const working: IAutoMovieMotionHumanHeld.IPointResult =
    AutoMovieMotionHumanHeld.point(held, "face");
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      rotationBetween(
        Quaternion.rotateVector(entry, working.direction),
        Vector3.scale(region.normal, -1),
      ),
      entry,
    ),
  );
  const contact: IAutoMovieVector3 = Vector3.add(
    HumanHand.offset(context.body, side, "grip").point,
    working.point,
  );
  const lever: IAutoMovieVector3 = Quaternion.rotateVector(rotation, contact);
  const down: IAutoMovieVector3 = Vector3.add(
    region.point,
    Vector3.scale(region.normal, CLEAR),
  );
  const up: IAutoMovieVector3 = Vector3.add(down, { x: 0, y: RAISE, z: 0 });
  // Kneeling over a lying partner, the trunk leans in as far as the beats
  // need (`HumanTrunkLean`).
  const forward: number = HumanTrunkLean.least(
    context,
    [down, up].map(
      (point: IAutoMovieVector3): HumanTrunkLean.IWrist => ({
        side,
        point: Vector3.subtract(point, lever),
        rotation,
      }),
    ),
  );
  const tempo: number = context.tempo ?? 1;
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare:
      tempo *
      AutoMovieMotionHumanTiming.transport(
        Vector3.distance(up, frame.position),
      ),
    attack: tempo * BEAT * count,
    retract:
      tempo *
      AutoMovieMotionHumanTiming.transport(
        Vector3.distance(up, frame.position),
      ),
  });
  const ready: number = clock.at("strokeStart");
  const done: number = clock.at("strokeEnd");
  // Each beat starts raised, comes down to the region at its middle and rises.
  const face: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 => {
    const u: number = Math.min(
      1,
      Math.max(0, (seconds - ready) / (done - ready)),
    );
    const h: number = 0.5 + 0.5 * Math.cos(2 * Math.PI * count * u);
    return Vector3.lerp(down, up, h);
  };
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
  const free: HumanTrunkLean.IHanging = HumanTrunkLean.hang(
    context.body,
    context.entry.pose,
    side === "left" ? "right" : "left",
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: {
        ...HumanTrunkLean.moving(base, forward),
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          const posture: IAutoMovieMotionHumanPosture = HumanTrunkLean.lean(
            context.body,
            base.posture(seconds),
            forward *
              clock.envelope(["start", "ready"], ["relax", "end"], seconds),
            // The free arm hangs plumb as the trunk leans over it.
            [free],
          );
          return { ...posture, joints: { ...posture.joints, ...kept.fingers } };
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
            point: Vector3.subtract(face(seconds), lever),
            rotation,
            contact,
            bend,
          }),
        }),
      ],
      contact: "strokeStart",
    });
  return {
    ...composed,
    hands: [side],
    contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [...(composed.holds ?? []), { ...kept, from: 1 }],
  };
}
