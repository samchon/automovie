import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanWalkGait,
} from "@automovie/interface";

import { walk } from "../../gait/internal/walk";

/*
 * Horror and fantasy gaits as screen exaggerations of pathological walks (Perry
 * and Burnfield, Gait Analysis, 2nd ed., 2010): the shamble drags a stiff leg
 * whose foot barely clears the floor and stands on it briefly, the trunk
 * leaning and the arms hanging still; the lurch keeps one knee stiff at a slow
 * cadence, swinging that leg out with the trunk upright and the arms still; the
 * stalk creeps on deeply bent knees with the trunk hunched. Each is a walk
 * under a name of its own, so it keeps the walk's cuts and yields and the
 * walk's seeded tempo, so a crowd of them falls out of step. Every factor is a
 * provisional stage reading.
 */
export namespace HumanHorrorGait {
  /*
   * The factors of the three gaits (provisional stage readings): each gait's
   * Froude number, its step as a share of the walking step, its trunk lean in
   * degrees, its pelvis drop in hip heights and its arms' swing as a share of a
   * walk's.
   */
  export interface IFactors {
    /*
     * The gait's Froude number.
     */
    froude: number;

    /*
     * The step, a share of the walking step at that Froude number.
     */
    step: number;

    /*
     * The trunk's forward lean, degrees.
     */
    lean: number;

    /*
     * How far the pelvis rides below a walk's, hip heights.
     */
    drop: number;

    /*
     * The arms' swing, a share of a walk's.
     */
    swing: number;
  }

  /*
   * Each gait's factors (provisional).
   */
  export const SHAMBLE: IFactors = {
    froude: 0.05,
    step: 0.7,
    lean: 12,
    drop: 0.03,
    swing: 0.15,
  };

  /*
   * How far a shambler's speed scatters about the shamble's, a share either way
   * (provisional stage reading).
   */
  export const SCATTER: number = 0.15;

  /*
   * The lurch's factors (provisional).
   */
  export const LURCH: IFactors = {
    froude: 0.06,
    step: 0.8,
    lean: 0,
    drop: 0,
    swing: 0,
  };

  /*
   * The stalk's factors (provisional): the prowl's crouch with a hunched trunk.
   */
  export const STALK: IFactors = {
    froude: 0.08,
    step: 0.75,
    lean: 25,
    drop: 0.12,
    swing: 0.2,
  };

  /*
   * A shamble: a dragged stiff leg stood on briefly, the trunk leaning and the
   * arms hanging.
   */
  export const shamble: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.ILimp> =
    styled(
      "shamble",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.ILimp>,
      ): IAutoMovieMotionHumanWalkGait => {
        const side: AutoMovieHumanSide = context.params.side ?? "right";

        // Each member drags at a pace of its own, so a crowd falls out of step.
        const pace: number =
          1 + SCATTER * (2 * context.random("shamble").float(0) - 1);
        return {
          ...gait({ ...SHAMBLE, froude: SHAMBLE.froude * pace * pace }),
          stiff: side,
          limp: { side, share: 0.2 },
          unevenness: 2,
        };
      },
    );

  /*
   * A lurch: one knee held stiff at a slow cadence, the arms held still.
   */
  export const lurch: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.ILimp> =
    styled(
      "lurch",
      (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.ILimp>,
      ): IAutoMovieMotionHumanWalkGait => ({
        ...gait(LURCH),
        stiff: context.params.side ?? "right",
      }),
    );

  /*
   * A stalk: a hunched creep on deeply bent knees.
   */
  export const stalk: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    styled("stalk", (): IAutoMovieMotionHumanWalkGait => gait(STALK));

  /*
   * The walking gait at a factor record's Froude number with its step, lean,
   * drop and arms.
   */
  function gait(factors: IFactors): IAutoMovieMotionHumanWalkGait {
    const walking: IAutoMovieMotionHumanWalkGait = walk.walking(factors.froude);
    return {
      ...walking,
      step: (froude: number): number => factors.step * walking.step(froude),
      lean: factors.lean,
      arms: {
        shoulder: factors.swing * walking.arms.shoulder,
        elbow: walking.arms.elbow,
        swing: factors.swing * walking.arms.swing,
      },
      ...(factors.drop === 0
        ? {}
        : { bob: { mean: -factors.drop, amplitude: 0 } }),
    };
  }

  /*
   * A walk in a gait of its own, under a name: the walk's cuts and yields,
   * planned by its stepping plan.
   */
  function styled<P extends IAutoMovieMotionHumanGait.IParams>(
    name: string,
    of: (
      context: IAutoMovieMotionHumanActionContext<P>,
    ) => IAutoMovieMotionHumanWalkGait,
  ): IAutoMovieMotionHumanActionLaw<P> {
    return {
      name,
      family: walk.name,
      interrupts: walk.interrupts,
      yields: walk.yields,
      plan: (
        context: IAutoMovieMotionHumanActionContext<P>,
      ): IAutoMovieMotionHumanActionPlan => walk.locomote(context, of(context)),
    };
  }
}
