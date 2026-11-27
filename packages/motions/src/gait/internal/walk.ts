import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
} from "@automovie/interface";

import { HumanSupportCarry } from "../../carrier/internal/HumanSupportCarry";
import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { walkCuts } from "../../actions/internal/walkCuts";
import { walkLevelSupport } from "../../actions/internal/walkLevelSupport";
import { walkLocomote } from "../../actions/internal/walkLocomote";
import { walkPlayback } from "../../actions/internal/walkPlayback";
import { walkReach } from "../../actions/internal/walkReach";
import { walkRoot } from "../../actions/internal/walkRoot";

/*
 * Walking to a floor point in whole steps, ending with the feet side by side.
 *
 * Speed comes from dynamic similarity (Alexander 1984): people of different leg
 * length walk alike at equal Froude number `v^2 / (g l)`, so each pace is a
 * Froude number on the hip height `l`: slow 0.074, normal 0.25 and fast 0.325,
 * which give 0.82, 1.51 and 1.72 m/s at the reference hip
 * (`walkRoot.REFERENCE_HIP`, 0.93 m). Step length grows with the square root of
 * speed (Grieve and Gear 1966): `1.2 l sqrt(sqrt(Fr))`, 0.8 hip heights at the
 * normal pace (about 0.4 stature, Perry and Burnfield); the step count is
 * rounded up so every step is at most that long, at the pace's own cadence
 * (`WalkPace`).
 *
 * Each foot follows the three rockers of stance with its contact point fixed on
 * the floor, and swings between footprints on a minimum-jerk path lifted clear
 * of the floor (walkSteps): 60 % stance and 40 % swing of each stride,
 * so each double support lasts a tenth of a stride (Perry and Burnfield). The
 * pelvis advances fastest near double support and slowest near midstance. Its
 * height follows the two contact heights and accounts for the raised leg's
 * share of the 4–5 cm whole-body excursion. It sways 2 cm toward the stance
 * foot and lowers wherever a planted leg cannot reach its foot, so no plant is
 * ever stretched off its point (walkReach). A swing joins the stance its
 * foot left, as the leg reached it at toe-off, to the stance it lands in, as
 * the leg reaches it at heel strike (walkFoot), and the pelvis reads a
 * swinging foot only through those two stances. The pelvis turns 4° and tilts
 * 4° with the stride, the chest counter-rotates, and the arms swing opposite
 * the legs about 15° with the elbows bent 15 to 30° (Perry and Burnfield,
 * normal gait kinematics).
 *
 * The explicit footprints and cut entry pose give the engine's IK their stance
 * targets. The audit reads the same windows through contactMask. Proficiency
 * only varies step timing.
 */
export namespace walk {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "walk";

  /*
   * Cancel table (`walkCuts`).
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    walkCuts;

  /*
   * What a gait lets an overlay take: the arms it would swing, the hands and
   * the head.
   */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = [
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];

  /*
   * Froude number of each pace. Normal uses the metabolic minimum reported for
   * ordinary limbs in Optimal walking speed following changes in limb geometry
   * (2011, PMID 21653821). Slow and fast are the slow and the fast outdoor
   * paces of healthy adults, 0.82 and 1.72 m/s (Murtagh, Mair, Aguiar,
   * Tudor-Locke and Murphy 2021, Sports Med 51:125, a meta-analysis of 35
   * studies; its fast pace includes "walk briskly"), as Froude numbers at the
   * reference hip (`walkRoot.REFERENCE_HIP`).
   */
  export const FROUDE: Readonly<
    Record<NonNullable<IAutoMovieMotionHumanWalkParams["pace"]>, number>
  > = {
    slow: 0.82 ** 2 / (AutoMovieGravity.STANDARD * walkRoot.REFERENCE_HIP),
    normal: 0.25,
    fast: 1.72 ** 2 / (AutoMovieGravity.STANDARD * walkRoot.REFERENCE_HIP),
  };

  /*
   * The walking gait of a Froude number: a step of `1.2 l Fr^0.25`, at most
   * `longestStep()` hip heights, 40 % of the stride in swing, a mid-swing lift
   * of `LIFT` hip heights, and arms swinging `SHOULDER` degrees about the
   * shoulder with the elbow bent `ELBOW` and swinging `ELBOW_SWING` about it.
   */
  export function walking(froude: number): IAutoMovieMotionHumanWalkGait {
    return {
      froude,
      step: (fr: number): number =>
        Math.min(longestStep(), 1.2 * Math.sqrt(Math.sqrt(fr))),
      swing: 0.8,
      lift: LIFT,
      arms: { shoulder: SHOULDER, elbow: ELBOW, swing: ELBOW_SWING },
      lean: LEAN,
    };
  }

  /*
   * The hip's flexion at initial contact, degrees: about 20° (Perry and
   * Burnfield's normal sagittal hip kinematics, read through Perry-based
   * summaries; reported from 20 to 30°, 20 the most consistent).
   */
  export const CONTACT_FLEXION: number = 20;

  /*
   * The longest walking step, hip heights: the trailing leg at the thigh's
   * largest extension (`walkReach.EXTENSION`, the hip's range less its margin)
   * and the leading leg at its flexion at initial contact (`CONTACT_FLEXION`),
   * both straight from one hip over the floor, put the ankles `sin(EXTENSION) +
   * sin(CONTACT_FLEXION)` hip heights apart; a longer step would ask the
   * trailing hip past its range at toe-off.
   * Returns: Hip heights, about 0.81.
   */
  export function longestStep(): number {
    return (
      Math.sin((walkReach.EXTENSION * Math.PI) / 180) +
      Math.sin((CONTACT_FLEXION * Math.PI) / 180)
    );
  }

  /*
   * The ankle's lift above its standing height at the middle of the swing, hip
   * heights. The swing's middle, 80 % of the gait cycle, is the middle of Perry
   * and Burnfield's mid-swing (73 to 87 %), between initial swing's end (hip
   * flexed 15°, knee 60°) and mid-swing's end (hip 25°, knee 25°); read
   * linearly there, the hip is flexed 20° and the knee 42.5°. A thigh `a` at
   * hip flexion `h` and a shank `b` at `h - k` from vertical put the ankle `a
   * (1 - cos h) + b (1 - cos (h - k))` above its standing height. With the
   * thigh and the shank as shares of the hip height in Winter's segment table
   * (greater trochanter at 0.530, knee at 0.285 and ankle at 0.039 of stature;
   * Winter, Biomechanics and Motor Control of Human Movement, after Drillis and
   * Contini 1966), that is about 0.063 hip heights, some 6 cm at the reference
   * hip (`walkRoot.REFERENCE_HIP`). The toe's own clearance is bounded
   * separately (`walkFoot.CLEARANCE`).
   */
  export const LIFT: number =
    ((0.53 - 0.285) * (1 - Math.cos((((15 + 25) / 2) * Math.PI) / 180)) +
      (0.285 - 0.039) *
        (1 - Math.cos((((15 + 25) / 2 - (60 + 25) / 2) * Math.PI) / 180))) /
    0.53;

  /*
   * The arms' swing about the shoulder, degrees either way (Perry and
   * Burnfield, normal gait kinematics: about 15°).
   */
  export const SHOULDER: number = 15;

  /*
   * The elbow's mean flexion through the stride, degrees: the middle of Perry
   * and Burnfield's 15 to 30° elbow range in gait.
   */
  export const ELBOW: number = (15 + 30) / 2;

  /*
   * The elbow's flexion swing about its mean, degrees: half of Perry and
   * Burnfield's 15 to 30° elbow range in gait.
   */
  export const ELBOW_SWING: number = (30 - 15) / 2;

  /*
   * The admitted step-length scale (`IAutoMovieMotionHumanWalkParams.stride`):
   * inclusive, dimensionless.
   */
  export const STRIDE_RANGE: Readonly<ISTRIDERANGEItem> = {
    minimum: 0.6,
    maximum: 1.3,
  };

  /*
   * The admitted arm-swing scale (`IAutoMovieMotionHumanWalkParams.armSwing`):
   * inclusive, dimensionless.
   */
  export const ARM_SWING_RANGE: Readonly<IARMSWINGRANGEItem> = {
    minimum: 0,
    maximum: 2,
  };

  /*
   * The admitted added shoulder abduction
   * (`IAutoMovieMotionHumanWalkParams.elbows`): inclusive, degrees.
   */
  export const ELBOWS_RANGE: Readonly<IELBOWSRANGEItem> = {
    minimum: 0,
    maximum: 30,
  };

  /*
   * A walk's forward trunk inclination, degrees (provisional: walkers carry the
   * trunk a few degrees forward of upright, and the inclination grows with
   * speed, Thorstensson et al. 1984, Acta Physiol Scand 121:179).
   */
  export const LEAN: number = 3;

  /*
   * Plan a walk.
   * Parameter context: The action's context.
   * Returns: The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWalkParams>,
  ): IAutoMovieMotionHumanActionPlan {
    // On a moving support the walk planned on it as it stood at the start
    // is carried by its motion, the feet planted on it.
    const on: IAutoMovieMotionHumanWalkParams["on"] = context.params.on;
    const gait: IAutoMovieMotionHumanWalkGait = walking(
      FROUDE[context.params.pace ?? "normal"],
    );
    if (on === undefined) return locomote(context, gait);
    // The walk is planned on the support from the body's motion on it: the
    // carry adds the support's own.
    const planned: IAutoMovieMotionHumanActionPlan = walkLevelSupport(
      { ...context, entry: HumanSupportCarry.entry(context, on.prop) },
      on.prop,
      (given) => locomote(given, gait),
    );
    HumanSupportFrame.board(
      context,
      on.prop,
      Math.sqrt(
        FROUDE[context.params.pace ?? "normal"] *
          AutoMovieGravity.STANDARD *
          context.body.measure.hipHeight,
      ),
    );
    return walkPlayback(
      HumanSupportCarry.on(context, planned, on.prop),
      context.body,
    );
  }

  /*
   * Plan stepping locomotion in a gait (walkLocomote), shared by walking and
   * running.
   */
  export const locomote: typeof walkLocomote = walkLocomote;
}

/*
 * The record of `IELBOWSRANGEItem`'s site.
 */
type IELBOWSRANGEItem = { minimum: number; maximum: number };

/*
 * The record of `IARMSWINGRANGEItem`'s site.
 */
type IARMSWINGRANGEItem = { minimum: number; maximum: number };

/*
 * The record of `ISTRIDERANGEItem`'s site.
 */
type ISTRIDERANGEItem = { minimum: number; maximum: number };
