


/**
 * One canonical provider-to-consumer relationship.
 *
 * @evidence contracts/common.md#principled-implementation Provider and consumer name one canonical foundation relationship, with an explicit same-order promotion option.
 * @evidence contracts/common.md#clear-and-simple-design The canonical edge matrix is distinct from authored account explanations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Simultaneous promotion is optional declared policy, never inferred from missing review work.
 * @evidence contracts/common.md#meaningful-documentation Members state foundation direction and simultaneous-stage meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased canonical-edge type opens no handle or task and creates no registry; the caller owns the relationship matrix used by inspectAutoMovieEvidenceTopology for one inspection.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceTopologyEdge {

  /** Foundation branch whose reviewed population is consumed. */
  provider: string;

  /** Branch accountable for that foundation. */
  consumer: string;

  /** Whether both branches may be promoted in one coordinated stage. */
  simultaneous?: boolean;
}
