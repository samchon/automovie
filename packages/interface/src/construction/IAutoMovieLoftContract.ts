/**
 * Loft construction diagnostics and borrowed arrays marked by admission checks.
 *
 * AutoMovieEngineLoftContract returns the original arrays using type assertions; it
 * adds no runtime contract property and does not freeze aliases. The diagnostic
 * is plain reporting data whose producer owns any rollback or fallback.
 */
export namespace IAutoMovieLoftContract {
  /**
   * A numerical construction premise rejected by its producer.
   *
   * The producing operation decides the failure effect: optional Human pieces
   * can roll back to their base, while ViewLoft can return null final geometry
   * and retain admitted sections. This record alone neither throws nor performs
   * rollback, and foreign callback exceptions need not be converted into
   * diagnostics.
   */
  export interface IDiagnostic {
    /** The piece that broke the contract, such as `human.mouth`. */
    producer: string;

    /**
     * Producer's construction level (`construction-levels.md`), an ordinal
     * rather than a physical measurement; ViewLoft reports level 2.
     */
    level: number;

    /**
     * Producer-defined premise category, such as stations, outline or solid
     * surface, used to group the explanation.
     */
    contract: string;

    /**
     * Human-readable failure explanation, including the relevant station or
     * numerical values when available.
     */
    detail: string;
  }

  /**
   * Borrowed stations checked for finiteness and the constructor's minimum
   * rise, mm.
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
   * Borrowed numbers checked against the caller's magnitude bound, finite when
   * that bound is finite.
   */
  export type Jet = readonly number[] & {
    /**
     * Type-only marker from AutoMovieEngineLoftContract.jet's elementwise magnitude
     * check; it records neither units nor bound and is absent at runtime.
     */
    readonly contract: "jet";
  };

  /** Borrowed finite points whose X/Z shoelace sum is nonzero, in mm. */
  export type Ring = readonly (readonly [number, number, number])[] & {
    /**
     * Type-only marker from AutoMovieEngineLoftContract.ring after finite coordinates
     * and a nonzero X/Z shoelace sum; the original array gains no runtime
     * property.
     */
    readonly contract: "ring";
  };
}
