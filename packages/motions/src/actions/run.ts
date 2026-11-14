import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { walk } from "./walk";

/**
 * Running to a floor point, at a jog, a run or a sprint: the walk's
 * footprint plan in a running gait, with a flight phase between stances.
 *
 * A run differs from a walk by its duty factor, the share of the stride a
 * foot is on the ground, below one half so both feet leave the floor once a
 * step (Alexander 1984, "The gaits of bipedal and quadrupedal animals"; Novacheck
 * 1998, "The biomechanics of running", Gait & Posture 7): 0.4 at a jog, 0.35
 * at a run and 0.25 at a sprint, so the swing lasts `2 (1 - duty)` step
 * periods. The speed comes from the Froude number, `v = sqrt(Fr g l)`, at
 * 0.6, 1.3 and 5 (about 2.4, 3.5 and 6.8 m/s at a 0.93 m hip). The step
 * frequency is the measured quantity: nearly constant over endurance speeds
 * and rising toward a sprint (Cavagna, Franzetti, Heglund and Willems 1988,
 * J Physiol 399:81), about 172 steps a minute at a recreational runner's
 * preferred 2.9 m/s (Heiderscheit et al. 2011, Med Sci Sports Exerc 43:296).
 * Scaled by the pendulum time `sqrt(l / g)` (Alexander 1984), it is
 * `0.8 + 0.08 Fr` (a provisional fit: 170 steps a minute at 2.9 m/s on a
 * 0.93 m hip), so the longest step is `l sqrt(Fr) / (0.8 + 0.08 Fr)`, about
 * 0.9, 1.3 and 1.9 hip heights, inside the step lengths measured across
 * running speeds (Novacheck 1998). The foot lands on its ball with the heel
 * held `FOREFOOT` degrees up, the forefoot strike of sprinters (Novacheck
 * 1998) and of runners who strike without an impact transient (Lieberman et
 * al. 2010, Nature 463:531); the angle is provisional. The pelvis rides the
 * spring-mass stance (`runStance`): highest at contact and toe-off, lowest
 * at mid-stance where the stance knee is most flexed (Blickhan 1989), and a
 * foot in the air asks nothing of it. The swing foot rises 0.15 to 0.35 hip heights
 * as the knee folds in recovery, the elbows hold near 90° and swing with the
 * shoulders, and the trunk inclines forward of a walk's and more as the
 * pace rises (Thorstensson et al. 1984): 5, 8 and 12 degrees for a jog, a
 * run and a sprint (provisional).
 */
export namespace run {
  /** The action's name. */
  export const name: HumanActionName = "run";

  /** Cancel table: as a walk's, any step may be cut into another locomotion, and a stand once both feet are down. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["lastFootfall", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    jump: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /** What a gait lets an overlay take: the arms it would swing, the hands and the head. */
  export const yields: IHumanActionLaw["yields"] = [
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];

  /** Parameters. */
  export interface IParams {
    /** The floor point to stop at, world metres. */
    to: IAutoMovieVector3;

    /** The pace; `run` when absent. */
    pace?: "jog" | "run" | "sprint";

    /** Floor points passed in order before `to`, world metres. */
    via?: IAutoMovieVector3[];

    /** The heading at arrival, degrees about +Y. */
    face?: number;

    /** Step-length scale in [0.6, 1.3]; 1 when absent. */
    stride?: number;

    /** Arm-swing scale in [0, 2]; 1 when absent. */
    armSwing?: number;

    /** Elbows held out, degrees in [0, 30]; 0 when absent. */
    elbows?: number;
  }

  /** The heel's height over the ball at contact and through stance, degrees about the toes' joint (provisional). */
  export const FOREFOOT: number = 20;

  /** Each pace's running gait. */
  export const GAITS: Readonly<
    Record<NonNullable<IParams["pace"]>, walk.IGait>
  > = {
    jog: gait(0.6, 0.4, 0.15, 25, 5),
    run: gait(1.3, 0.35, 0.25, 35, 8),
    sprint: gait(5, 0.25, 0.35, 50, 12),
  };

  /**
   * Plan a run.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    return walk.locomote(context, GAITS[context.params.pace ?? "run"]);
  }

  /** A running gait from its Froude number, duty factor, swing lift, shoulder swing and trunk lean. */
  function gait(
    froude: number,
    duty: number,
    lift: number,
    shoulder: number,
    lean: number,
  ): walk.IGait {
    return {
      froude,
      step: (fr: number): number => Math.sqrt(fr) / (0.8 + 0.08 * fr),
      swing: 2 * (1 - duty),
      heels: FOREFOOT,
      lift,
      arms: { shoulder, elbow: 85, swing: 15 },
      lean,
    };
  }
}
