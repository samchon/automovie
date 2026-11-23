/**
 * Exact population size and one bounded member page used by subject inspection
 * and structural diff consequences.
 */
export interface IAutoMovieSubjectMemberSummary {
  /** Exact number of members represented by the summary. */
  total: number;

  /** Code-unit-sorted bounded sample of stable member ids. */
  items: string[];

  /**
   * Rank of the first member present in {@link items}, within the sorted whole.
   *
   * Ordinary pages can advance until offset plus items.length reaches total. A
   * formation description is the exception: offset is zero, items contains
   * named hero ids only and total counts all designed slots; this summary
   * offers no page of anonymous members. Diff consequences and whole-inventory
   * samples also start at zero unless their producer explicitly pages.
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
