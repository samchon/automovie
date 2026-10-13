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
 * @evidence contracts/common.md#principled-implementation `designLineagePhaseSnapshot` takes the requested phase plus its transitive prerequisites as reached, derives each role from which lifecycle ends are null, and marks a subject removed, present, or pending from whether its removal or installation phase was reached; a null phase treats every removal as done.
 * @evidence contracts/common.md#clear-and-simple-design One nullable phase and one state per subject sorted by code-unit id; the snapshot carries no geometry, so a caller filters its own id-bearing records through `designLineageProject`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or graph is special-cased; the prose states that no compiled scene, drawing, schedule, or draw list consumes this result, so its agreement guarantee is not yet realised.
 * @evidence contracts/common.md#meaningful-documentation States the null-phase meaning and why it is real, the per-subject totality and ordering, and the actual callers today.
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
