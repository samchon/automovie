/**
 * Bounded inventory summary used for subject members and diff consequences.
 *
 * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Prevents review output from expanding with every repeated member.
 * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Types an exact total with a bounded deterministic id sample.
 */
export interface IAutoMovieSubjectMemberSummary {
  /**
   * Exact number of members represented by the summary.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-description Reports complete subject membership cardinality despite bounded output.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-description-record Types the exact membership total.
   */
  total: number;
  /**
   * Code-unit-sorted bounded sample of stable member ids.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Keeps repeated membership inspectable without unbounded expansion.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Carries the deterministic bounded sample.
   */
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
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Keeps the bound while leaving membership beyond it addressable, so bounded output does not become unreachable membership.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Types the deterministic sample's starting rank alongside its exact total.
   */
  offset: number;
  /**
   * Number of members not present in {@link items}.
   *
   * Counted across the whole, so it covers the members before {@link offset} as
   * well as those after the sample. It answers "is this everything?" and never
   * "how much is left", which two different callers would otherwise read the
   * same field as.
   *
   * @evidence requirements/review/subject-description-and-structural-change.md#review-subject-diff-tolerance-fanout Makes truncation explicit rather than silently incomplete.
   * @evidence specifications/review-and-acceptance/subject-description-and-structural-diff.md#review-system-subject-diff-tolerance-fanout Types the exact omitted-member count.
   */
  omitted: number;
}
