/**
 * Exact population size and one bounded member page used by subject inspection and structural diff consequences.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary member pages preserve total, sorted selected identities and clamped offset; omitted counts all off-page members. Formation descriptions instead retain total designed slots, offset zero and named heroes only, so their items cannot page through every anonymous slot.
 * @evidence contracts/common.md#clear-and-simple-design Four fields distinguish cardinality, bounded identities, page start and omitted count without a dense response; formation's hero-only sample remains distinguishable by its surrounding subject kind rather than an invented paging capability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bounded page is not the whole population and omitted is not a remaining-page count; formation review may list only named heroes while total still counts every designed slot.
 * @evidence contracts/common.md#meaningful-documentation Defines total, sample ordering, ordinary pagination, formation hero-only offset-zero exception and whole-population omission count.
 * @author Samchon
 */
export interface IAutoMovieSubjectMemberSummary {
  /** Exact number of members represented by the summary. */
  total: number;

  /** Code-unit-sorted bounded sample of stable member ids. */
  items: string[];

  /**
   * Rank of the first member present in {@link items}, within the sorted whole.
   *
   * Ordinary pages can advance until offset plus items.length reaches total. A formation description is the exception: offset is zero, items contains named hero ids only and total counts all designed slots; this summary offers no page of anonymous members. Diff consequences and whole-inventory samples also start at zero unless their producer explicitly pages.
   */
  offset: number;

  /**
   * Number of members not present in {@link items}.
   *
   * Counted across the whole, so it covers the members before {@link offset} as well as those after the sample. It answers "is this everything?" and never "how much is left", which two different callers would otherwise read the same field as.
   */
  omitted: number;
}
