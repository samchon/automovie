import { HumanHorrorGait as HumanHorrorGaitSource } from "../lexicon/internal/HumanHorrorGait";

/**
 * The gaits of a horror creature, stage readings of a walk with its own Froude
 * number, step and unevenness (provisional; no study was read).
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanHorrorGait`: Horror and fantasy gaits as screen exaggerations of
 *   pathological walks (Perry and Burnfield, Gait Analysis, 2nd ed., 2010): the
 *   shamble drags a stiff leg whose foot barely clears the floor and stands on
 *   it briefly, the trunk leaning and the arms hanging still; the lurch keeps
 *   one knee stiff at a slow cadence, swinging that leg out with the trunk
 *   upright and the arms still; the stalk creeps on deeply bent knees with the
 *   trunk hunched.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanHorrorCreature} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanHorrorCreature {
  /**
   * Horror and fantasy gaits as screen exaggerations of pathological walks
   * (Perry and Burnfield, Gait Analysis, 2nd ed., 2010): the shamble drags a
   * stiff leg whose foot barely clears the floor and stands on it briefly, the
   * trunk leaning and the arms hanging still; the lurch keeps one knee stiff at
   * a slow cadence, swinging that leg out with the trunk upright and the arms
   * still; the stalk creeps on deeply bent knees with the trunk hunched. Each
   * is a walk under a name of its own, so it keeps the walk's cuts and yields
   * and the walk's seeded tempo, so a crowd of them falls out of step. Every
   * factor is a provisional stage reading.
   */
  export import HumanHorrorGait = HumanHorrorGaitSource;
}
