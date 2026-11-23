/** Mutable diagnostics supplied to the atlas normal-section rail solver. */
export namespace IAutoMovieSolidRailSolve {
  /**
   * Caller-owned output record overwritten when the atlas solve returns success
   * or a reported failure. The solver replaces numbers with a fresh record; it
   * does not append to a caller's previous observations or retain the sink.
   */
  export type IAtlasReport = {
    /**
     * "solved" on success, otherwise the first returned refusal; callers
     * commonly initialize this to an empty string.
     */
    reason: string;

    /**
     * Reached stage quantities: chart u/v in that face's units, planeResidual
     * in mm for a unit section normal, chordResidual in mm², and
     * step/face/switchesLeft/visitN as dimensionless counts or indices. Early
     * failures may provide only a subset.
     */
    numbers: Record<string, number>;
  };
}
