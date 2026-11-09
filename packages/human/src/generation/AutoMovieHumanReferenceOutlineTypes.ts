/**
 * Record definitions for the normalized outline registry. Types describe
 * source metadata and kept observations; they neither evaluate a curve nor
 * validate the recorded numbers at runtime. The registry preserves its
 * existing qualified type names as aliases of these definitions.
 *
 * @evidence contracts/common.md#principled-implementation Models sparse station observations separately from fixed mass-footprint summaries; each record carries its own reading and normalization metadata.
 * @evidence contracts/common.md#clear-and-simple-design Owns the three shared record definitions once, keeping the data registry below its file limit without moving runtime data or functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Introduces no geometry, fitted value, new observation or alternate runtime validator.
 * @evidence contracts/common.md#meaningful-documentation States the records' provenance fields, sparse-cell meaning and lack of runtime validation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type-only namespace chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased record declarations perform no computation to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declarations allocate and retain no runtime object or handle.
 */
export namespace AutoMovieHumanReferenceOutlineTypes {
  /**
   * One observed station, with only the columns its reading retained.
   * Units belong to the containing table's normalization, not this record.
   *
   * @evidence contracts/common.md#principled-implementation A numeric share and sparse mean/SD maps represent an observation without filling a missing cell or asserting a universal unit.
   * @evidence contracts/common.md#clear-and-simple-design One row shape is shared by every normalized station table.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Describes retained observations only, with no generated curve or expected output embedded in the type.
   * @evidence contracts/common.md#meaningful-documentation Names station, mean, SD, sparse availability and the containing table's units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record type selects no processing strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased type performs no equivalent work across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no runtime record; callers and module data own their actual instances.
   */
  export interface IRow {
    /** The station's share between the table's landmarks. */
    share: number;

    /** Each kept column's mean at the station; an absent key is unobserved. */
    values: Readonly<Record<string, number>>;

    /** Each kept column's SD over the people at the station. */
    spreads: Readonly<Record<string, number>>;
  }

  /**
   * A normalized station table and the metadata needed to interpret it.
   * The reader expects finite values and strictly increasing station shares;
   * this structural type does not enforce those numeric premises.
   *
   * @evidence contracts/common.md#principled-implementation Keeps declared columns, sparse rows and their measurement normalization together; numeric ordering and validity remain reader premises.
   * @evidence contracts/common.md#clear-and-simple-design One shared record serves the registry and its arm, foot, leg and trunk consumers without duplicate schema definitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains empty rows and missing cells as data states rather than synthesizing measurements or narrowing a consumer's required columns.
   * @evidence contracts/common.md#meaningful-documentation States provenance, normalization, actual-consumer metadata, declared columns, row ordering and validation limits.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration implements no lookup algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type definition coordinates no cache or effectful request.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates nothing; runtime table owners determine instance lifetime and size.
   */
  export interface ITable {
    /** The reading test that printed the source estimates. */
    reading: string;

    /** Station and value units, datums and normalizing measures. */
    normalization: string;

    /** Current production readers, or an explicit retained/unconsumed status. */
    consumers: string;

    /** The declared columns, including any column with no retained cells. */
    columns: readonly string[];

    /** Rows in strictly increasing share order; empty means no reading. */
    rows: readonly IRow[];
  }

  /**
   * One mass's measured footprint summary on its declared trunk-wall datum.
   * The six dimensions are normalized means and SDs, not generated geometry
   * or a law deriving amplitude from independent chest/waist inputs.
   *
   * @evidence contracts/common.md#principled-implementation Separates footprint metadata and six mean/SD quantities whose units and wall construction are declared by each table.
   * @evidence contracts/common.md#clear-and-simple-design Breast and sex-specific gluteal summaries share one record shape while retaining their distinct samples and normalization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not make a stature-normalized observation an independently measured chest-depth or gluteal-amplitude law.
   * @evidence contracts/common.md#meaningful-documentation Names the source reading, wall datum, sample, quantity keys and observational limits.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This summary type has no processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The erased schema computes and caches nothing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no object or source pack; each fixed module table owns its runtime values.
   */
  export interface IFootprint {
    /** The reading test that printed the summary. */
    reading: string;

    /** Each value's normalizer and the wall/edge construction used. */
    normalization: string;

    /** Current production readers, or an explicit retained/unconsumed status. */
    consumers: string;

    /** The people and sides represented by the summary. */
    people: string;

    /** Each normalized dimension's mean over the recorded sample. */
    values: Readonly<Record<"amplitude" | "up" | "down" | "lateral" | "medial" | "halfPointWidth", number>>;

    /** Each normalized dimension's SD over the recorded sample. */
    spreads: Readonly<Record<"amplitude" | "up" | "down" | "lateral" | "medial" | "halfPointWidth", number>>;
  }
}
