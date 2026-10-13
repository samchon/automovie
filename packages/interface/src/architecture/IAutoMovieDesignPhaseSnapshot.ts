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
 * @evidence contracts/common.md#principled-implementation `designLineagePhaseSnapshot` validates the lineage, maps each lifecycle to one state against the asked phase plus its transitive prerequisites, and sorts the states with `compareCodeUnits`, so the output depends on the plan and not on array order.
 * @evidence contracts/common.md#clear-and-simple-design The snapshot is the asked phase plus one flat state list; the role and presence rules live in their own union types, and filtering records is left to `designLineageProject` rather than embedded here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent subjects are listed with their presence rather than dropped, and the documentation says plainly that no scene, drawing, schedule, or render consumes the snapshot yet instead of implying they agree.
 * @evidence contracts/common.md#meaningful-documentation States that every declared subject appears once in code-unit order, who calls the producer today and who does not, and what a null phase means.
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

  /** Every declared subject, in ascending code-unit id order. */
  states: IAutoMovieDesignPhaseState[];
}
