import type { IAutoMovieHingedArticulation } from "./IAutoMovieHingedArticulation";
import type { hingedArmSwivel } from "./hingedArmSwivel";

/**
 * The working records of one `hingedArmArticulation` solve: its bend
 * branches, the completed work on each and its scored candidates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each record and member states its content and unit.
 * @evidence contracts/development/design.md#principled-representation A branch is a hinge stop with its index; a candidate is an articulation with its two ordering keys and their lazy exact readers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by hingedArmArticulation and the searches it hands branches to; split from it unchanged to keep that file within its size.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses hingedArmSwivel's stop and pose and the engine's articulation record.
 */
export namespace hingedArmCandidate {
  /**
   * One bend branch with its index among `hingedArmSwivel.branches`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the added member.
   * @evidence contracts/development/design.md#principled-representation The stop plus the index a seed names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One added member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the stop instead of copying it.
   */
  export interface IBranch extends hingedArmSwivel.IStop {
    /** Its index among the branches. */
    branch: number;
  }

  /**
   * Completed work on one unchanged branch, shared only with the full fallback.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The branch's poser, scorer, coarse steps by index and refinements by step.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by the sweeps and the pole search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds actual candidates only, no time or target history.
   */
  export interface ISweep {
    /** This branch's unchanged degree-valued swivel poser. */
    posed: ReturnType<typeof hingedArmSwivel.pose>;

    /** The actual scorer under that poser and this solve's unchanged policy. */
    probe: (angle: number) => IScored;

    /** Completed coarse candidates, indexed by their original sweep step. */
    steps: (IScored | undefined)[];

    /** Final actual candidate of each already-refined original step bracket. */
    refined: Map<number, IScored>;
  }

  /**
   * One scored candidate: its rotations, its ROM overshoot and its effort tie-break.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and when it is read.
   * @evidence contracts/development/design.md#principled-representation The articulation with its lexicographic keys, a lower-bound deviation with its lazy exact value, and an optional second key.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members hingedSwivelAhead compares and memoises.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional members are lazy readers and their memoised values, not alternative states.
   */
  export interface IScored extends IAutoMovieHingedArticulation {
    /** The effort tie-break, compared after the overshoot; a lower bound of it when `exact` is given. */
    deviation: number;

    /** The exact tie-break, when `deviation` is only its lower bound; its value is kept in `known` once read. */
    exact?: () => number;

    /** The exact tie-break once read. */
    known?: number;

    /** The second key, compared between deviations within the sweep's `tie` of each other. */
    tiebreak?: () => number;

    /** The second key once read. */
    second?: number;
  }
}
