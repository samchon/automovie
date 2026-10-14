/**
 * Authored intent to omit an active scene from a selected workflow phase.
 *
 * Current production coverage excludes an active scene with a production-phase disposition from its realization and required-acceptance denominator; OMITTED status excludes a tombstone independently. Screenplay/edit values remain declarations without distinct phase coverage gates in the maintained production path.
 *
 * @evidence contracts/common.md#principled-implementation screenplayCoverageDiagnostics honors production-phase omission when selecting active coverage and refuses downstream realization or required-acceptance citations for a tombstone or any nonnull disposition. This type does not execute phase-specific validation.
 * @evidence contracts/common.md#clear-and-simple-design Phase and reason keep the author's local omission intent beside the scene while permanent deletion remains its separate status; current runtime coverage consumes only the production-phase exemption.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The retained coverage gate rejects cited omission claims, but does not independently reject blank reasons or an uncited tombstone with a disposition. No generic screenplay/edit phase checker is currently wired, and this declaration supplies no missing runtime admission.
 * @evidence contracts/common.md#meaningful-documentation States the phase vocabulary, authored explanation, production denominator behavior and the remaining phase/reason validation limits.
 * @author Samchon
 */
export interface IAutoMovieSceneDisposition {
  /** Workflow phase whose output intentionally omits the scene. */
  phase: "screenplay" | "production" | "edit";

  /**
   * Author's explanation of the intended omission; the current coverage gate does not reject a blank value.
   */
  reason: string;
}
