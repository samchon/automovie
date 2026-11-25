import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFrailWalk,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { walkFoot } from "../actions/walkFoot";
import { walkSteps } from "../actions/walkSteps";
import { HumanBound } from "../law/HumanBound";

/**
 * The walk of a frail older person, graded by `severity` from the ordinary walk
 * (0) to a shuffle (1): each feature is the ordinary walk's own value carried
 * linearly toward its frail end.
 *
 * - Speed: the Froude number at the shuffle's end is that of 0.6 m/s at the
 *   reference hip, the gait speed below which an older adult is frail
 *   (Studenski et al. 2011, JAMA 305:50).
 * - Step length: `STEP` of the ordinary step at the shuffle's end, the shortest
 *   step the walk admits; older adults shorten the step before they slow the
 *   cadence (Winter et al. 1990, Phys Ther 70:340).
 * - Toe clearance: the swing's lift falls to `LIFT` of the ordinary one, the low
 *   foot of a shuffle (Winter et al. 1990).
 * - Trunk flexion: the forward lean grows to `LEAN` degrees, the stooped trunk of
 *   advanced age (provisional, of the order kyphotic walkers show).
 * - Arm swing: falls to `ARMS` of the ordinary swing (provisional).
 * - Step width: widens to `WIDTH` hip heights, a wider base (provisional).
 * - Double support: the swing shortens to `SWING` step periods, so both feet
 *   stand `1 - SWING` of each step instead of a fifth; older adults lengthen
 *   their double support (Winter et al. 1990).
 * - Toe clearance: the least clearance of the swinging foot falls to `CLEARANCE`
 *   metres, the low end of older adults' (Begg et al. 2007).
 * - Turning in place: each step turns by the same share of a hip's usable twist
 *   as the step keeps of its length, so a frail half turn takes more, shorter
 *   steps (provisional: the shortened step carried to the turn).
 *
 * The values are provisional where marked.
 */
export namespace HumanFrailWalk {
  /**
   * The Froude number at a frail walk's slowest: 0.6 m/s on the reference hip
   * of 0.93 m (Studenski et al. 2011).
   */
  export const FROUDE: number = (0.6 * 0.6) / (9.81 * 0.93);

  /**
   * The step at the shuffle's end, as a share of the ordinary step: the walk's
   * shortest admitted (`walk.STRIDE_RANGE`).
   */
  export const STEP: number = walk.STRIDE_RANGE.minimum;

  /**
   * The swing's lift at the shuffle's end, as a share of the ordinary lift
   * (provisional, Winter et al. 1990's lowered clearance).
   */
  export const LIFT: number = 0.5;

  /** The forward trunk lean at the shuffle's end, degrees (provisional). */
  export const LEAN: number = 15;

  /**
   * The arm swing at the shuffle's end, as a share of the ordinary swing
   * (provisional).
   */
  export const ARMS: number = 0.3;

  /**
   * The step width at the shuffle's end, hip heights (provisional: the ordinary
   * walk's 0.1 widened toward a frail walker's wider base).
   */
  export const WIDTH: number = 0.18;

  /**
   * The swing at the shuffle's end, step periods: both feet stand 35 % of each
   * step (provisional, after Winter et al. 1990's longer double support).
   */
  export const SWING: number = 0.65;

  /**
   * The least toe clearance at the shuffle's end, metres: older adults keep
   * about 1.2 to 1.5 cm over the floor at mid-swing (Begg et al. 2007, Gait and
   * Posture 25:191), so a shuffle lowers it to the low end, still clear of the
   * floor the foot audit reads (`HumanFoot.BEARING`).
   */
  export const CLEARANCE: number = 0.012;

  /** The grade when the author names none. */
  export const SEVERITY: number = 0.5;

  /** The frail walk's law. */
  export const frailWalk: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanFrailWalk> =
    {
      name: "frailWalk",
      interrupts: walk.interrupts,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFrailWalk>,
      ): IAutoMovieMotionHumanActionPlan => {
        const s: number = HumanBound.within(
          "severity",
          context.params.severity ?? SEVERITY,
          0,
          1,
          "1",
        );
        const toward: (ordinary: number, frail: number) => number = (
          ordinary: number,
          frail: number,
        ): number => ordinary + (frail - ordinary) * s;
        const base: IAutoMovieMotionHumanWalkGait = walk.walking(
          toward(walk.FROUDE.normal, FROUDE),
        );
        const step: number = toward(1, STEP);
        const gait: IAutoMovieMotionHumanWalkGait = {
          ...base,
          step: (fr: number): number => base.step(fr) * step,
          lift: base.lift * toward(1, LIFT),
          arms: {
            ...base.arms,
            shoulder: base.arms.shoulder * toward(1, ARMS),
            swing: base.arms.swing * toward(1, ARMS),
          },
          lean: toward(walk.LEAN, LEAN),
          width: toward(walkSteps.WIDTH, WIDTH),
          swing: toward(base.swing, SWING),
          toeClearance: toward(walkFoot.CLEARANCE, CLEARANCE),
          turn: step,
        };
        const params: IAutoMovieMotionHumanWalkParams = {
          to: context.params.to,
          ...(context.params.via === undefined
            ? {}
            : { via: context.params.via }),
          ...(context.params.face === undefined
            ? {}
            : { face: context.params.face }),
          ...(context.params.manner === undefined
            ? {}
            : { manner: context.params.manner }),
        };
        return walk.locomote({ ...context, params }, gait);
      },
    };
}
