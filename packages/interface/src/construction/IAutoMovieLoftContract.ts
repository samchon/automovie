/**
 * Loft construction diagnostics and borrowed arrays marked by admission checks.
 *
 * AutoMovieLoftContract returns the original arrays using type assertions; it adds no runtime contract property and does not freeze aliases. The diagnostic is plain reporting data whose producer owns any rollback or fallback.
 *
 * @evidence contracts/development/design.md#principled-representation Stations, bounded scalar rows and projected rings name distinct numerical checking boundaries; IDiagnostic preserves the failed producer, level and premise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Construction readers reuse the checked arrays directly, and realization/reporting consumers share the diagnostic without an exception-class dependency.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Existing intersection brands can be bypassed by casts or invalidated by alias mutation; their runtime validators and limits are documented rather than treating the tags as proof.
 * @evidence contracts/development/common.md#meaningful-documentation Defines borrowed ownership, erased marker properties, projection/units and caller-bound validation limits.
 */
export namespace IAutoMovieLoftContract {
  /**
   * A numerical construction premise rejected by its producer.
   *
   * The producing operation decides the failure effect: optional Human pieces can roll back to their base, while ViewLoft can return null final geometry and retain admitted sections. This record alone neither throws nor performs rollback, and foreign callback exceptions need not be converted into diagnostics.
   *
   * @evidence contracts/development/design.md#principled-representation A producer, construction level, contract name and detail identify a rejected local construction for the realization's rollback/reporting path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four plain fields carry the failure without coupling the record to an exception class or renderer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record reports a failure rather than treating partial geometry as successful; it does not itself enforce rollback.
   * @evidence contracts/development/common.md#meaningful-documentation Names the failed piece, construction level and explanatory numerical detail, with fallback owned by the producing operation.
   */
  export interface IDiagnostic {
    /** The piece that broke the contract, such as `human.mouth`. */
    producer: string;

    /** Producer's construction level (`construction-levels.md`), an ordinal rather than a physical measurement; ViewLoft reports level 2. */
    level: number;

    /** Producer-defined premise category, such as stations, outline or solid surface, used to group the explanation. */
    contract: string;

    /** Human-readable failure explanation, including the relevant station or numerical values when available. */
    detail: string;
  }

  /**
   * Borrowed stations checked for finiteness and the constructor's minimum rise, mm.
   *
   * @evidence contracts/development/design.md#principled-representation The intersection brand identifies the stations checker boundary on a read-only number array.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The original array remains the value rather than gaining a runtime wrapper or duplicate table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The brand neither freezes storage nor prevents an explicit cast; callers must preserve the checked ordering and values.
   * @evidence contracts/development/common.md#meaningful-documentation States physical units, the minimum-rise check and borrowed ownership.
   */
  export type Stations = readonly number[] & {
    /** Type-only marker from AutoMovieLoftContract.stations after at least two finite entries pass its positive minimum-step comparisons; no property is installed on the returned array. */
    readonly contract: "stations";
  };

  /**
   * Borrowed numbers checked against the caller's magnitude bound, finite when that bound is finite.
   *
   * @evidence contracts/development/design.md#principled-representation The jet brand marks an array that passed elementwise magnitude comparisons with a supplied bound.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type intersection preserves the numerical array layout used by interpolation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This type does not record the bound or prevent later alias mutation/casting; it cannot independently certify finiteness.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a finite caller bound from a guarantee supplied by the alias itself.
   */
  export type Jet = readonly number[] & {
    /** Type-only marker from AutoMovieLoftContract.jet's elementwise magnitude check; it records neither units nor bound and is absent at runtime. */
    readonly contract: "jet";
  };

  /**
   * Borrowed finite points whose X/Z shoelace sum is nonzero, in mm.
   *
   * @evidence contracts/development/design.md#principled-representation The ring brand names the finite-coordinate and nonzero projected-sum check performed by ring.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The point sequence remains a plain read-only tuple array used directly by loft producers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The brand does not certify simplicity, planarity, orientation or a finite accumulated area, and aliases/casts can invalidate its intended premise.
   * @evidence contracts/development/common.md#meaningful-documentation Names the horizontal projection and units rather than implying a complete geometric ring validator.
   */
  export type Ring = readonly (readonly [number, number, number])[] & {
    /** Type-only marker from AutoMovieLoftContract.ring after finite coordinates and a nonzero X/Z shoelace sum; the original array gains no runtime property. */
    readonly contract: "ring";
  };
}
