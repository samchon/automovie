import type { IAutoMovieSpaceAirRequest } from "./IAutoMovieSpaceAirRequest";

/**
 * Data and callback contracts shared by the AnalyzeSpaceAir operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Solve one space for ventilation, and refuse to pretend it solved the air. Member documentation states the supplied records, units and absence meanings used by analyzeAutoMovieSpaceAir.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No velocity-field or stagnation surrogate is added to the zone request; these remain unsupported, and zero-flow steady concentration is an explicit gap.
 * @evidence contracts/development/design.md#principled-representation request supplies the canonical zone volume, flow and occupancy quantities; analyzeAutoMovieSpaceAir validates them before reporting zone-average rates and concentration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieAnalyzeSpaceAir, used by analyzeAutoMovieSpaceAir. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieAnalyzeSpaceAir {
  /**
   * Solve one space for ventilation, and refuse to pretend it solved the air.
   *
   * What a well-mixed zone model can answer, it answers exactly: the air change
   * rate `n = 3600 * Q / V`, the outdoor air per person `1000 * Q / N`, and the
   * steady-state contaminant balance `C = Co + 1e6 * N * G / Q`. Those are
   * closed-form and are checked against hand arithmetic.
   *
   * What it cannot answer, it refuses to. Air stagnation and a velocity field are
   * properties of a flow solution, and no amount of zone arithmetic produces one,
   * so both are `unsupported` metrics naming exactly what is missing. This is the
   * whole point of the contract: the honest answer to "where does the air sit
   * still" is that this host does not know, and a number invented here would be
   * indistinguishable from one that was computed.
   *
   * A zero supply flow leaves the steady-state concentration a gap whose reason
   * depends on the generation `N * G`: with occupants generating carbon dioxide
   * it rises without bound, and with none it stays wherever it starts, so no
   * steady state is unique either way.
   *
   * Throws on a malformed request (see {@link IAutoMovieSpaceAirRequest}). The
   * returned run is always `solved` and carries no spatial samples.
   *
   * Finite admitted inputs can still overflow or underflow intermediate arithmetic; a nonfinite metric throws through the shared builder instead of becoming a fabricated measurement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Solve one space for ventilation, and refuse to pretend it solved the air. Member documentation states the supplied records, units and absence meanings used by analyzeAutoMovieSpaceAir.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No velocity-field or stagnation surrogate is added to the zone request; these remain unsupported, and zero-flow steady concentration is an explicit gap.
   * @evidence contracts/development/design.md#principled-representation request supplies the canonical zone volume, flow and occupancy quantities; analyzeAutoMovieSpaceAir validates them before reporting zone-average rates and concentration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieAnalyzeSpaceAir.IProps, used by analyzeAutoMovieSpaceAir. Its request members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Study to solve; validated in full before any arithmetic. */
    request: IAutoMovieSpaceAirRequest;
  };
}
