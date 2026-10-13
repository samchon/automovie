import { IAutoMovieDesignPhaseState } from "./IAutoMovieDesignPhaseState";

/**
 * The complete state of a work once one phase has completed.
 *
 * Every declared subject appears exactly once, in ascending id order, whether
 * it is present or not, so a scene, a drawing, a schedule, and a render can
 * read one answer about what is standing instead of computing four.
 *
 * None of the four reads it yet. `designLineagePhaseSnapshot` is called by the
 * engine's own phase filter and view digest and by the test suite, and no
 * compiled artifact is derived from it.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignPhaseSnapshot {
  /**
   * Phase this snapshot describes, or null for the completed work.
   *
   * The completed work is a real question and not a missing answer: a lineage
   * that records alternatives without recording a construction sequence still
   * has to say what stands at the end.
   */
  phase: string | null;

  /** Every declared subject, in ascending id order. */
  states: IAutoMovieDesignPhaseState[];
}
