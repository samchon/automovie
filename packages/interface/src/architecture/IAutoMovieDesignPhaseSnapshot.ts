import { IAutoMovieDesignPhaseState } from "./IAutoMovieDesignPhaseState";

/**
 * The complete state of a work once one phase has completed.
 *
 * Every declared subject appears exactly once, in ascending id order, whether
 * it is present or not, so a scene, a drawing, a schedule, and a render can
 * read one answer about what is standing instead of computing four.
 *
 * None of the four reads it yet. `designLineagePhaseSnapshot` is called by the
 * engine's own phase filter and view digest, by the scaffold's renovation
 * example, and by the test suite, and no compiled artifact is derived from it.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `IAutoMovieDesignPhaseSnapshot` as the portable data boundary for the production design reference original derived requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignPhaseSnapshot` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignPhaseSnapshot {
  /**
   * Phase this snapshot describes, or null for the completed work.
   *
   * The completed work is a real question and not a missing answer: a lineage
   * that records alternatives without recording a construction sequence still
   * has to say what stands at the end.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `phase` as the portable data boundary for the production design reference original derived requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `phase` for the narrative intent reference lineage system contract.
   */
  phase: string | null;
  /**
   * Every declared subject, in ascending id order.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-original-derived Exposes `states` as the portable data boundary for the production design reference original derived requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `states` for the narrative intent reference lineage system contract.
   */
  states: IAutoMovieDesignPhaseState[];
}
