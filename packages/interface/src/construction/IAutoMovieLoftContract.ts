/**
 * Loft construction diagnostics and borrowed arrays marked by admission checks.
 *
 * AutoMovieEngineLoftContract returns the original arrays using type assertions; it
 * adds no runtime contract property and does not freeze aliases. The diagnostic
 * is plain reporting data whose producer owns any rollback or fallback.
 */
export namespace IAutoMovieLoftContract {
  /**
   * Plain record of a construction premise a producer could not establish. The
   * producer names the piece, construction level, condition and detail, and
   * owns any recovery or refusal.
   */
  export interface IDiagnostic {
    /**
     * Identifier of the construction piece or operation that reports the
     * rejected premise.
     */
    producer: string;

    /**
     * Producer's construction-level ordinal. ViewLoft reports level 2 for
     * rejected view construction premises.
     */
    level: number;

    /**
     * Producer-defined name of the rejected premise, such as stations, outline
     * or solid surface.
     */
    contract: string;

    /**
     * Explanation of the failure in the producer's terms, with the offending
     * station or numeric value when available.
     */
    detail: string;
  }

  /**
   * Borrowed physical station coordinates in millimetres. Supply finite
   * coordinates and a positive minimum step. LoftContract.stations requires at
   * least two entries and checks each arithmetic rise against that step. It
   * returns the input array with a compile-time marker.
   */
  export type Stations = readonly number[] & {
    /**
     * Type-only marker from AutoMovieEngineLoftContract.stations after at least two
     * finite entries pass its positive minimum-step comparisons; no property is
     * installed on the returned array.
     */
    readonly contract: "stations";
  };

  /**
   * Borrowed numeric array whose entry magnitudes satisfy the caller's bound.
   * Supply a positive finite bound to require finite entries. The caller
   * assigns the units and keeps the borrowed values unchanged after admission.
   */
  export type Jet = readonly number[] & {
    /**
     * Type-only marker from AutoMovieEngineLoftContract.jet's elementwise magnitude
     * check; it records neither units nor bound and is absent at runtime.
     */
    readonly contract: "jet";
  };

  /**
   * Borrowed closed ring in vertex order with world [x, y, z] coordinates in
   * millimetres. Supply finite points. LoftContract.ring tests for a nonzero
   * X/Z shoelace sum and returns the input array with a compile-time marker.
   */
  export type Ring = readonly (readonly [number, number, number])[] & {
    /**
     * Type-only marker from AutoMovieEngineLoftContract.ring after finite coordinates
     * and a nonzero X/Z shoelace sum; the original array gains no runtime
     * property.
     */
    readonly contract: "ring";
  };
}
