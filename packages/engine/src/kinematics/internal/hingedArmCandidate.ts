import type {
  IAutoMovieHingedArmSwivel,
  IAutoMovieHingedArticulation,
} from "@automovie/interface";

import { hingedArmSwivel } from "../hingedArmSwivel";

/*
 * The working records of one `hingedArmArticulation` solve: its bend branches,
 * the completed work on each and its scored candidates.
 */
export namespace hingedArmCandidate {
  /*
   * One bend branch with its index among `hingedArmSwivel.branches`.
   */
  export interface IBranch extends IAutoMovieHingedArmSwivel.IStop {
    /*
     * Its index among the branches.
     */
    branch: number;
  }

  /*
   * Completed work on one unchanged branch, shared only with the full fallback.
   */
  export interface ISweep {
    /*
     * This branch's unchanged degree-valued swivel poser.
     */
    posed: ReturnType<typeof hingedArmSwivel.pose>;

    /*
     * The actual scorer under that poser and this solve's unchanged policy.
     */
    probe: (angle: number) => IScored;

    /*
     * Completed coarse candidates, indexed by their original sweep step.
     */
    steps: (IScored | undefined)[];

    /*
     * Final actual candidate of each already-refined original step bracket.
     */
    refined: Map<number, IScored>;

    /*
     * The caller's certified refusal of swivel intervals on this branch
     * (`excluded`), built at its first reading and read by every later stage of
     * the solve; absent until then or when the caller has none.
     */
    refused?: (low: number, high: number) => boolean;

    /*
     * The caller's certified lower bound of the deviation over swivel intervals
     * on this branch (`bound`), built at its first reading; absent until then
     * or when the caller has none.
     */
    bound?: (low: number, high: number) => number;
  }

  /*
   * One scored candidate: its rotations, its ROM overshoot and its effort
   * tie-break.
   */
  export interface IScored extends IAutoMovieHingedArticulation {
    /*
     * The effort tie-break, compared after the overshoot; a lower bound of it
     * when `exact` is given.
     */
    deviation: number;

    /*
     * The exact tie-break, when `deviation` is only its lower bound; its value
     * is kept in `known` once read.
     */
    exact?: () => number;

    /*
     * The exact tie-break once read.
     */
    known?: number;

    /*
     * The second key, compared between deviations within the sweep's `tie` of
     * each other.
     */
    tiebreak?: () => number;

    /*
     * The second key once read.
     */
    second?: number;
  }
}
