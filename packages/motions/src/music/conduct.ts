import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanConduct,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { courseArmAtPace } from "../compose/courseArmAtPace";
import { prepareDanceBeats } from "../exercise/prepareDanceBeats";
import { writeWith } from "../handling/writeWith";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { conductTip } from "./conductTip";

/**
 * Each meter's ictus points, `[in, up]` in shares of the figure's half width
 * and half height about its centre: Rudolf's figures (_The Grammar of
 * Conducting_, 3rd ed., 1995), each beat's ictus reached by its direction from
 * the one before (4/4: down to the first, in to the second, out to the third,
 * up to the fourth). The shares themselves are provisional.
 */
const FIGURES: Readonly<
  Record<
    IAutoMovieMotionHumanConduct.Meter,
    readonly (readonly [number, number])[]
  >
> = {
  "2/4": [
    [0, -1],
    [-0.2, -0.4],
  ],
  "3/4": [
    [0, -1],
    [-1, -0.6],
    [-0.3, -0.2],
  ],
  "4/4": [
    [0, -1],
    [1, -0.6],
    [-1, -0.6],
    [-0.3, -0.2],
  ],
};

/**
 * The figure's half width and half height, metres: provisional, a forearm's
 * sweep.
 */
const HALF: number = 0.18;

/**
 * The rebound's height between ictuses, as a share of `HALF`: provisional,
 * above the largest rise between ictuses times 1/π so each ictus is a lowest
 * point.
 */
const REBOUND: number = 0.6;

/**
 * The share of the lead before the first beat the arm takes to reach the
 * figure: the rest of the lead is the preparatory arc into the first ictus,
 * which the figure holds, as a conductor's preparation is part of the beat
 * (provisional).
 */
const PREP: number = 0.25;

/** The tempo when none is given, beats per minute. */
const BPM: number = 120;

/**
 * Beat time with a held baton. Register as `conduct`.
 *
 * The baton rides the hand rigidly, so its `tip` lies at a fixed lever from the
 * wrist (as `write` aims a held tool) and the arm aims the wrist that puts the
 * tip on its path, keeping the baton's entry attitude. The path runs in the
 * performer's frontal plane a forearm ahead of the chest: from ictus to ictus
 * of the meter's figure (`FIGURES`) in a straight line lifted by a rebound arc,
 * `REBOUND` of the figure's half height times `sin(pi u)` over each beat's
 * share `u`, so the tip leaves each ictus upward and falls into the next from
 * above: every ictus is its beat's lowest point. The ictuses fall on the shared
 * beat clock (`prepareDanceBeats`): at `bpm`, or on a cue track's beats when
 * locked. The hand comes in over the lead before the first beat and returns
 * over one beat after the last. A beat is a delivered stroke, so the arm is
 * coursed at its goal's own peak speed (`courseArmAtPace`), not a reach's pace.
 * Events: `strokeStart` at the first ictus and `strokeEnd` at the last.
 */
export const conduct: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanConduct.IParams> =
  {
    name: "conduct",
    interrupts: {
      any: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    },
    plan,
  };

/** Read the beats and the lever, then aim the baton hand along the figure. */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanConduct.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanConduct.IParams = context.params;
  const figure: readonly (readonly [number, number])[] = FIGURES[p.meter];
  const bars: number = p.bars ?? 2;
  const beats: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
    context,
    p.bpm ?? BPM,
    bars * figure.length,
    p.lock,
  );
  const side: AutoMovieHumanSide =
    p.hand ?? (context.entry.holds.left === p.baton ? "left" : "right");
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    side,
    p.baton,
  );
  const frame: IAutoMovieRigidTransform = context
    .prop(p.baton)
    .frame(context.entry.seconds);
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      frame.rotation,
      Quaternion.inverse(held.frame.rotation),
    ),
  );
  const contact: IAutoMovieVector3 = Vector3.add(
    HumanHand.offset(context.body, side, "grip").point,
    AutoMovieMotionHumanHeld.point(held, "tip").point,
  );
  const lever: IAutoMovieVector3 = Quaternion.rotateVector(rotation, contact);

  // The figure's centre a forearm ahead of the chest, on the baton's side.
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const m: IAutoMovieMotionHumanBody["measure"] = context.body.measure;
  const inward: number = side === "right" ? 1 : -1;
  const place: (x: number, y: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
  ): IAutoMovieVector3 =>
    HumanFrame.point(
      {
        origin: { x: posture.root.x, y: 0, z: posture.root.z },
        yaw: posture.yaw,
      },
      {
        x: -inward * m.shoulderHalfWidth * 0.5 + inward * x * HALF,
        y: m.shoulderHeight - 0.1 + y * HALF,
        z: m.forearm + m.upperArm * 0.6,
      },
    );
  const ictus: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < beats.count; ++k) {
    const share: readonly [number, number] = figure[k % figure.length]!;
    ictus.push(place(share[0], share[1]));
  }
  const top: IAutoMovieVector3 = place(0, 1);
  writeWith.reach(context, side, [...ictus, top], lever);
  const first: number = beats.at(1);
  const last: number = beats.at(beats.count);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: first,
    attack: last - first,
    retract: beats.period,
  });
  const tip: (seconds: number) => IAutoMovieVector3 = conductTip(
    ictus,
    top,
    beats,
    REBOUND * HALF,
  );
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    posture,
    side,
  );
  const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
    context,
    held,
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
          const at: IAutoMovieMotionHumanPosture = base.posture(seconds);
          return { ...at, joints: { ...at.joints, ...kept.fingers } };
        },
      },
      clock,
      primitives: [],
      contact: "strokeStart",
    });
  // The baton hand's goal at each second: the wrist that puts the tip on
  // the figure. A beat is a delivered stroke, so the arm is coursed at the
  // goal's own peak speed (`courseArmAtPace`), not a reach's pace.
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const goals: IAutoMovieMotionHumanActionPlan = {
    ...composed,
    posture: (
      seconds: number,
      ...rest: PostureRest
    ): IAutoMovieMotionHumanPosture => {
      const at: IAutoMovieMotionHumanPosture = composed.posture(
        seconds,
        ...rest,
      );
      const goal: IAutoMovieHumanLimbGoal = {
        point: Vector3.subtract(tip(seconds), lever),
        rotation,
        contact,
        bend,
      };
      return { ...at, limbs: { ...at.limbs, [limb]: goal } };
    },
  };
  const coursed: IAutoMovieMotionHumanActionPlan = courseArmAtPace(
    context,
    goals,
    side,
    { start: 0, ready: first * PREP, relax: last, end: clock.duration },
  );
  return {
    ...coursed,
    hands: [side],
    contacts: [...coursed.contacts, AutoMovieMotionHumanHeld.grip(held)],
    holds: [...(coursed.holds ?? []), { ...kept, from: 1 }],
  };
}

/** The posture reader's arguments after the second. */
type PostureRest =
  Parameters<IAutoMovieMotionHumanActionPlan["posture"]> extends [
    number,
    ...infer R,
  ]
    ? R
    : never;
