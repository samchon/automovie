import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanRun,
  IAutoMovieMotionHumanWalkGait,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { walk } from "./walk";

/*
 * Offset decay time of a cut out of a run into another locomotion or a stand,
 * seconds (a deliberate change of the whole body's action,
 * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
 */
const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/*
 * Offset decay time of a cut from a run into a jump, seconds (provisional).
 */
const TAKEOFF_BLEND: number = 0.15;

/*
 * The elbows' mean flexion while running, degrees: 1.61 ± 0.10 rad in natural
 * running (Yegian et al. 2019, J Exp Biol 222:jeb197228).
 */
const ELBOW: number = (1.61 * 180) / Math.PI;

/*
 * The elbows' flexion swing amplitude about that mean, degrees: half the 38.8 ±
 * 12.6 degree range distance runners show (Tartaruga et al. 2012, Res Q Exerc
 * Sport 83:367).
 */
const ELBOW_SWING: number = 38.8 / 2;

/*
 * The step frequency in pendulum units at a Froude number of zero (provisional
 * fit: 170 steps a minute at 2.9 m/s on the reference hip,
 * `walkRoot.REFERENCE_HIP`, Heiderscheit et al. 2011).
 */
const CADENCE_BASE: number = 0.8;

/*
 * The step frequency's rise in pendulum units per unit Froude number
 * (provisional fit, rising toward a sprint, Cavagna et al. 1988).
 */
const CADENCE_PER_FROUDE: number = 0.08;

/*
 * Running to a floor point, at a jog, a run or a sprint: the walk's footprint
 * plan in a running gait, with a flight phase between stances.
 *
 * A run differs from a walk by its duty factor, the share of the stride a foot
 * is on the ground, below one half so both feet leave the floor once a step
 * (Alexander 1984, "The gaits of bipedal and quadrupedal animals"; Novacheck
 * 1998, "The biomechanics of running", Gait & Posture 7): 0.4 at a jog, 0.35 at
 * a run and 0.25 at a sprint, so the swing lasts `2 (1 - duty)` step periods.
 * The speed comes from the Froude number, `v = sqrt(Fr g l)`, at 0.6, 1.3 and 5
 * (about 2.3, 3.4 and 6.8 m/s at the reference hip, `walkRoot.REFERENCE_HIP`).
 * The step frequency is the measured quantity: nearly constant over endurance
 * speeds and rising toward a sprint (Cavagna, Franzetti, Heglund and Willems
 * 1988, J Physiol 399:81), about 172 steps a minute at a recreational runner's
 * preferred 2.9 m/s (Heiderscheit et al. 2011, Med Sci Sports Exerc 43:296).
 * Scaled by the pendulum time `sqrt(l / g)` (Alexander 1984), it is `0.8 + 0.08
 * Fr` (a provisional fit: 170 steps a minute at 2.9 m/s on a reference hip,
 * `walkRoot.REFERENCE_HIP`), so the longest step is `l sqrt(Fr) / (0.8 + 0.08
 * Fr)`, about 0.9, 1.3 and 1.9 hip heights, inside the step lengths measured
 * across running speeds (Novacheck 1998). The foot lands on its ball with the
 * heel held `FOREFOOT` degrees up, the forefoot strike of sprinters (Novacheck
 * 1998) and of runners who strike without an impact transient (Lieberman et al.
 * 2010, Nature 463:531); the angle is provisional. The pelvis rides the
 * spring-mass stance (`runStance`): highest at contact and toe-off, lowest at
 * mid-stance where the stance knee is most flexed (Blickhan 1989), and a foot
 * in the air asks nothing of it. The swing foot rises 0.15 to 0.35 hip heights
 * as the knee folds in recovery, the elbows hold near 92° (Yegian et al. 2019)
 * and swing 19° either way with the shoulders (half the range Tartaruga et al.
 * 2012 measured), and the trunk inclines forward of a walk's and more as the
 * pace rises (Thorstensson et al. 1984): 5, 8 and 12 degrees for a jog, a run
 * and a sprint (provisional).
 */
export namespace run {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "run";

  /*
   * Cancel table: as a walk's, any step may be cut into another locomotion, and
   * a stand once both feet are down.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: BLEND,
      },
    ],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
    jump: [
      { window: [0, 1], kind: "inertialize", entry: 0, blend: TAKEOFF_BLEND },
    ],
  };

  /*
   * What a run lets an overlay take: the arms it would swing, the hands, the
   * head, and the trunk a throw, a pass or a shot on the run turns (Wagner et
   * al. 2011: the trunk's rotation carries an overarm throw's speed), while the
   * run carries the body by its root and legs; the run's own trunk shows only
   * where no overlay claims it.
   */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = [
    "trunk",
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];

  /*
   * The heel's height over the ball at contact and through stance, degrees
   * about the toes' joint (provisional).
   */
  export const FOREFOOT: number = 20;

  /*
   * Each pace's running gait: Froude number and duty factor from the sources
   * above; swing lift (hip heights), shoulder swing (degrees) and trunk lean
   * (degrees) provisional.
   */
  export const GAITS: Readonly<
    Record<
      NonNullable<IAutoMovieMotionHumanRun.IParams["pace"]>,
      IAutoMovieMotionHumanWalkGait
    >
  > = {
    jog: gait(0.6, 0.4, 0.15, 25, 5),
    run: gait(1.3, 0.35, 0.25, 35, 8),
    sprint: gait(5, 0.25, 0.35, 50, 12),
  };

  /*
   * Plan a run.
   * Parameter context: The action's context.
   * Returns: The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRun.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    return walk.locomote(context, GAITS[context.params.pace ?? "run"]);
  }

  /*
   * The speed a pace runs at on a body, m/s: the Froude number's own relation,
   * v = √(Fr · g · l) with l the body's hip height, the speed walk.locomote
   * plans the pace's strides at before any manner, fatigue or facing scales
   * it.
   * Parameter body: The body's hip height.
   * Parameter pace: The pace; `run` when absent, as the plan defaults.
   * Returns: The speed, m/s.
   */
  export function speed(
    body: IBody,
    pace: IAutoMovieMotionHumanRun.IParams["pace"] = "run",
  ): number {
    return Math.sqrt(
      GAITS[pace ?? "run"].froude *
        AutoMovieGravity.STANDARD *
        body.measure.hipHeight,
    );
  }

  /*
   * What a pace's speed reads of a body.
   */
  export interface IBody {
    /*
     * The hip height, metres.
     */
    measure: Pick<IAutoMovieBodyMeasure, "hipHeight">;
  }

  /*
   * A running gait from its Froude number, duty factor, swing lift, shoulder
   * swing and trunk lean.
   */
  function gait(
    froude: number,
    duty: number,
    lift: number,
    shoulder: number,
    lean: number,
  ): IAutoMovieMotionHumanWalkGait {
    return {
      froude,
      step: (fr: number): number =>
        Math.sqrt(fr) / (CADENCE_BASE + CADENCE_PER_FROUDE * fr),
      swing: 2 * (1 - duty),
      heels: FOREFOOT,
      lift,
      arms: { shoulder, elbow: ELBOW, swing: ELBOW_SWING },
      lean,
    };
  }
}
