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
 * 0.6, 1.3 and 5 (about 2.4, 3.5 and 6.8 m/s at a 0.93 m hip); the longest
 * step is `l (0.75 + 0.5 sqrt(Fr))`, about 1.1, 1.3 and 1.9 hip heights,
 * inside the step lengths measured across running speeds (Novacheck 1998);
 * these coefficients are provisional fits. The pelvis drops 3 % of the hip
 * height on average and oscillates 3 to 3.5 % around it, lowest at
 * mid-stance where the stance leg is most flexed, the spring-mass behaviour
 * of running (Blickhan 1989). The swing foot rises 0.15 to 0.35 hip heights
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

  /** Each pace's running gait. */
  export const GAITS: Readonly<
    Record<NonNullable<IParams["pace"]>, walk.IGait>
  > = {
    jog: gait(0.6, 0.4, 0.03, 0.15, 25, 5),
    run: gait(1.3, 0.35, 0.035, 0.25, 35, 8),
    sprint: gait(5, 0.25, 0.03, 0.35, 50, 12),
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

  /** A running gait from its Froude number, duty factor, oscillation, swing lift, shoulder swing and trunk lean. */
  function gait(
    froude: number,
    duty: number,
    amplitude: number,
    lift: number,
    shoulder: number,
    lean: number,
  ): walk.IGait {
    return {
      froude,
      step: (fr: number): number => 0.75 + 0.5 * Math.sqrt(fr),
      swing: 2 * (1 - duty),
      bob: { mean: -0.03, amplitude },
      lift,
      arms: { shoulder, elbow: 85, swing: 15 },
      lean,
    };
  }
}
