import type { AutoMovieRecoveryEventCurve } from "./AutoMovieRecoveryEventCurve";

/**
 * Four named, oriented cubic paths bound one source-free Coons domain.
 * Periodic topology identifies the two explicit seam occurrences; it does not
 * impose a horizontal station or authorize material correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Ordered cubic occurrences and exact corner authority define the four boundary functions used by a Coons interpolant.
 * @evidence contracts/common.md#clear-and-simple-design The domain record carries geometry and direction; observation provenance, graph ownership and finite compiler budgets belong to their callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source polygons, mesh fallback, proximity attachment or inferred normal field enters this consumer input.
 * @evidence contracts/common.md#meaningful-documentation Boundary controls use millimetres and retain native phase; winding changes chart orientation independently of source-fit qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A structural type performs no evaluation or partitioning.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Coefficient identity and interval sharing remain explicit in each native source record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and their immutable native coefficient arrays.
 * @author Samchon
 */
export interface IAutoMovieRecoveryEventChartInput {
  /** Stable nonempty domain name, used as a prefix for actual patch IDs. */
  id: string;

  /** Four paths in increasing local side parameter, with exact meeting corners. */
  chart: {
    /** Boundary at v=0, traversed from u=0 to u=1. */
    bottom: AutoMovieRecoveryEventCurve.Arc;

    /** Boundary at v=1, traversed from u=0 to u=1. */
    top: AutoMovieRecoveryEventCurve.Arc;

    /** Boundary at u=0, traversed from v=0 to v=1. */
    left: AutoMovieRecoveryEventCurve.Arc;

    /** Boundary at u=1, traversed from v=0 to v=1. */
    right: AutoMovieRecoveryEventCurve.Arc;

    /** Whether left and right are the two identified periodic seam occurrences. */
    periodic?: boolean;
  };

  /** Explicit final chart orientation; this does not infer an outward material side. */
  winding: 1 | -1;
}
