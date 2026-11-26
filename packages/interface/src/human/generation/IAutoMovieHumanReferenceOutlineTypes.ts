/**
 * Sparse normalized observations, provenance and footprint means/SDs without
 * synthesized missing cells. Runtime construction and admission remain with
 * AutoMovieHumanReferenceOutlineTypes in Human.
 */
export namespace IAutoMovieHumanReferenceOutlineTypes {
  /**
   * One observed station, with only the columns its reading retained. Units
   * belong to the containing table's normalization, not this record.
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
   * A normalized station table and the metadata needed to interpret it. The
   * reader expects finite values and strictly increasing station shares; this
   * structural type does not enforce those numeric premises.
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
   * One mass's measured footprint summary on its declared trunk-wall datum. The
   * six dimensions are normalized means and SDs, not generated geometry or a
   * law deriving amplitude from independent chest/waist inputs.
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
    values: Readonly<
      Record<
        "amplitude" | "up" | "down" | "lateral" | "medial" | "halfPointWidth",
        number
      >
    >;

    /** Each normalized dimension's SD over the recorded sample. */
    spreads: Readonly<
      Record<
        "amplitude" | "up" | "down" | "lateral" | "medial" | "halfPointWidth",
        number
      >
    >;
  }
}
