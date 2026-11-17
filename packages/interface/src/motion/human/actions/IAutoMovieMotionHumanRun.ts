import type { IAutoMovieMotionHumanWalkParams } from "./IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The floor point to stop at, world metres. pace: The pace; `run` when absent. via: Floor points passed in order before `to`, world metres.
 * @evidence contracts/development/design.md#principled-representation to: The floor point to stop at, world metres. pace: The pace; `run` when absent. via: Floor points passed in order before `to`, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/run.ts (run.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.run, params); actions/run.ts (run.GAITS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRun {
  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation to: The floor point to stop at, world metres. pace: The pace; `run` when absent. via: Floor points passed in order before `to`, world metres.
   * @evidence contracts/development/design.md#principled-representation to: The floor point to stop at, world metres. pace: The pace; `run` when absent. via: Floor points passed in order before `to`, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/run.ts (run.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.run, params); actions/run.ts (run.GAITS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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

    /** How the run is performed, read as a walk reads it (`IAutoMovieMotionHumanWalkParams.manner`); neutral when absent. */
    manner?: IAutoMovieMotionHumanWalkParams["manner"];
  }
}
