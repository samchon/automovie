import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanConduct,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { motionHumanHeld } from "../../compose/internal/motionHumanHeld";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { courseArmAtPace } from "../../compose/internal/courseArmAtPace";
import { prepareDanceBeats } from "../../exercise/internal/prepareDanceBeats";
import { writeWith } from "../../handling/internal/writeWith";
import { HumanHand } from "../../posture/internal/HumanHand";
import { conductFigure } from "./conductFigure";
import { conductTip } from "./conductTip";
import { ConductData } from "./ConductData";

/*
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
 * Read the beats and the lever, then aim the baton hand along the figure.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanConduct.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanConduct.IParams = context.params;
  const figure: readonly (readonly [number, number])[] =
    conductFigure.FIGURES[p.meter];
  const bars: number = p.bars ?? 2;
  const beats: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
    context,
    p.bpm ?? ConductData.BPM,
    bars * figure.length,
    p.lock,
  );
  const side: AutoMovieHumanSide =
    p.hand ?? (context.entry.holds.left === p.baton ? "left" : "right");
  const held: IAutoMovieMotionHumanHeld.IHeld = motionHumanHeld(
    context,
    side,
    p.baton,
  );
  const frame: IAutoMovieRigidTransform = context
    .prop(p.baton)
    .frame(context.entry.seconds);
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
    AutoMovieEngineQuaternion.multiply(
      frame.rotation,
      AutoMovieEngineQuaternion.inverse(held.frame.rotation),
    ),
  );
  const contact: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    HumanHand.offset(context.body, side, "grip").point,
    motionHumanHeld.point(held, "tip").point,
  );
  const lever: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, contact);

  // The figure's centre a forearm ahead of the chest, on the baton's side.
  const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
  const figured: ReturnType<typeof conductFigure> = conductFigure(
    posture,
    context.body.measure,
    side,
    p.meter,
    beats.count,
  );
  const ictus: IAutoMovieVector3[] = figured.ictus;
  const top: IAutoMovieVector3 = figured.top;
  writeWith.reach(context, side, [...ictus, top], lever);
  const first: number = beats.at(1);
  const last: number = beats.at(beats.count);
  const clock: IAutoMovieMotionClock = motionClock.phrase({
    prepare: first,
    attack: last - first,
    retract: beats.period,
  });
  const tip: (seconds: number) => IAutoMovieVector3 = conductTip(
    ictus,
    top,
    beats,
    ConductData.REBOUND * conductFigure.HALF,
  );
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    posture,
    side,
  );
  const kept: IAutoMovieMotionPropHold = motionHumanHeld.hold(
    context,
    held,
  );
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    clock.duration,
  );
  const composed: IAutoMovieMotionHumanActionPlan =
    composeMotionHumanAction({
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
        point: AutoMovieEngineVector3.subtract(tip(seconds), lever),
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
    { start: 0, ready: first * ConductData.PREP, relax: last, end: clock.duration },
  );
  return {
    ...coursed,
    hands: [side],
    contacts: [...coursed.contacts, motionHumanHeld.grip(held)],
    holds: [...(coursed.holds ?? []), { ...kept, from: 1 }],
  };
}

/*
 * The posture reader's arguments after the second.
 */
type PostureRest =
  Parameters<IAutoMovieMotionHumanActionPlan["posture"]> extends [
    number,
    ...infer R,
  ]
    ? R
    : never;
