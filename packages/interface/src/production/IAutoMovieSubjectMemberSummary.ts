/** Bounded inventory summary used for subject members and diff consequences. */
export interface IAutoMovieSubjectMemberSummary {
  /** Exact number of members represented by the summary. */
  total: number;

  /** Code-unit-sorted bounded sample of stable member ids. */
  items: string[];

  /**
   * Rank of the first member present in {@link items}, within the sorted whole.
   *
   * The bound is what keeps one answer finite, and a bound with no way past it
   * makes everything after the first page unreachable by descent: a building
   * root that owns 988 children names 64 of them and reports the rest omitted,
   * with nothing to ask next. Stating where the sample starts is what turns a
   * truncation into a page — a caller reads on until `offset + items.length`
   * reaches {@link total}. It is `0` wherever nothing asked for a later page,
   * which is every diff consequence and every whole-inventory description.
   */
  offset: number;

  /**
   * Number of members not present in {@link items}.
   *
   * Counted across the whole, so it covers the members before {@link offset} as
   * well as those after the sample. It answers "is this everything?" and never
   * "how much is left", which two different callers would otherwise read the
   * same field as.
   */
  omitted: number;
}
