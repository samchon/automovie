/**
 * Mutable diagnostics supplied to the atlas normal-section rail solver.
 *
 * @evidence contracts/development/design.md#principled-representation A textual outcome and keyed numerical observations describe the actual solve path without changing its nullable geometry result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidRail supplies this report and prefixes its numbers with atlas. in the enclosing explanation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The report is an output sink, not a validation certificate; callbacks that throw can leave it unchanged or partial.
 * @evidence contracts/development/common.md#meaningful-documentation Defines caller-owned mutation and the report's diagnostic role.
 */
export namespace IAutoMovieSolidRailSolve {
  /**
   * Caller-owned output record overwritten when the atlas solve returns success
   * or a reported failure. The solver replaces numbers with a fresh record; it
   * does not append to a caller's previous observations or retain the sink.
   *
   * @evidence contracts/development/design.md#principled-representation Outcome text and an open observation dictionary accommodate different reached Newton and crossing stages.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SolidRailSolve.atlas fills the same report consumed by SolidRail.explain without a second diagnostic solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing keys mean their stage was not recorded, not zero; the returned rail/null remains authoritative.
   * @evidence contracts/development/common.md#meaningful-documentation States overwrite behavior, key units and reported-versus-thrown outcomes.
   */
  export type IAtlasReport = {
    /** "solved" on success, otherwise the first returned refusal; callers commonly initialize this to an empty string. */
    reason: string;

    /** Reached stage quantities: chart u/v in that face's units, planeResidual in mm for a unit section normal, chordResidual in mm², and step/face/switchesLeft/visitN as dimensionless counts or indices. Early failures may provide only a subset. */
    numbers: Record<string, number>;
  };
}
