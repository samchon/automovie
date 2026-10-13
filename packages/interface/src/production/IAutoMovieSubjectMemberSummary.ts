/**
 * Exact population size and one bounded member page used by subject inspection and structural diff consequences.
 *
 * @evidence contracts/common.md#principled-implementation Member summarization preserves exact total while selecting a deterministic code-unit-ordered page and clamping offset to the population; omitted counts every member outside the page, including preceding ones.
 * @evidence contracts/common.md#clear-and-simple-design Four fields distinguish full cardinality, bounded identities, page start and off-page count so a caller can continue inspection without a dense inventory response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bounded page is not the whole population and omitted is not a remaining-page count; formation review may list only named heroes while total still counts every designed slot.
 * @evidence contracts/common.md#meaningful-documentation Defines exact total, deterministic sample ordering, page-offset meaning and whole-population omission count.
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
   * The bound is what keeps one answer finite, and a bound with no way past it makes everything after the first page unreachable by descent: a building root that owns 988 children names 64 of them and reports the rest omitted, with nothing to ask next. Stating where the sample starts is what turns a truncation into a page; a caller reads on until `offset + items.length` reaches {@link total}. It is `0` wherever nothing asked for a later page, which is every diff consequence and every whole-inventory description.
   */
  offset: number;

  /**
   * Number of members not present in {@link items}.
   *
   * Counted across the whole, so it covers the members before {@link offset} as well as those after the sample. It answers "is this everything?" and never "how much is left", which two different callers would otherwise read the same field as.
   */
  omitted: number;
}
