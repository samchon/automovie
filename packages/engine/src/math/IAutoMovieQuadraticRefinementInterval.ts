/**
 * The intersection of every row of a quadratic program that has exactly the
 * same sparse coefficients, as `refineAutoMovieQuadraticProgram` groups them
 * for polishing.
 *
 * Rows join a group only when their sorted index and weight pairs are
 * identical; proportional or differently signed rows stay separate. The group
 * keeps the strongest finite lower and upper endpoints and the first row that
 * set each, which is the row an active endpoint's multiplier is returned to.
 * Every member stays in the final full-row admission, so grouping removes no
 * constraint. An empty intersection throws while grouping.
 *
 * @evidence contracts/common.md#principled-implementation Identical coefficient rows constrain one affine value, so their feasible set is the intersection of their intervals, the strongest lower and upper endpoints; grouping only exact matches keeps that identity exact, and keeping the owners lets a group multiplier be restored to an original row.
 * @evidence contracts/common.md#clear-and-simple-design The coefficients, the intersected interval, the two endpoint owners and the member list, which is what the active-set step needs to form one equation per group and map its multiplier back.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Groups by exact equality only, with no tolerance or scaling, and weaker members are kept for admission rather than deleted.
 * @evidence contracts/common.md#meaningful-documentation States the grouping rule, what is excluded, the endpoint and owner choice with its tie rule, that members stay in admission, and the empty-intersection refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A grouping record with no algorithm; the grouping cost is answered on `refineAutoMovieQuadraticProgram`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per refinement and read by that refinement's polishing; nothing persists across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned by the refinement call, with one member entry per original row and one coefficient pair per row term.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRefinementInterval {
  /** Variable indices of the shared coefficients, ascending. */
  indices: number[];

  /** Coefficients paired with `indices`, including exact zeros. */
  weights: number[];

  /** Largest finite lower endpoint among the members, or `null` if none. */
  lower: number | null;

  /** Smallest finite upper endpoint among the members, or `null` if none. */
  upper: number | null;

  /** First member row whose lower endpoint is `lower`; -1 when unbounded. */
  lowerOwner: number;

  /** First member row whose upper endpoint is `upper`; -1 when unbounded. */
  upperOwner: number;

  /** Original row numbers of every member, in program order. */
  originals: number[];
}
