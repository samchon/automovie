import { prepareRecoveryOpenSlabGraph } from "./prepareRecoveryOpenSlabGraph.ts";

/**
 * Observe ordinary open-arc transport without exporting source addresses.
 *
 * @evidence contracts/common.md#principled-implementation Qualified manifold incidence and clipped source-boundary paths distinguish two endpoint continuations within one critical-free slab component.
 * @evidence contracts/common.md#clear-and-simple-design Preparation owns immutable source topology; each query delegates sheet connectivity to RecoverySlabGraph and publishes only local arc ordinals and reversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate proximity, invented closure, component selection or copied source mesh supplies a generated surface.
 * @evidence contracts/common.md#meaningful-documentation Records private support premises, unsupported topology and source orientation qualification separately.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization traverses nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Namespace initialization creates no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Preparation and query callers own all retained values.
 */
export namespace RecoveryOpenSlabGraph {
  /**
   * One saved open curve's private observation support.
   *
   * @evidence contracts/common.md#principled-implementation Face support and two canonical edge or vertex addresses refer to the actual ordered cut endpoints.
   * @evidence contracts/common.md#clear-and-simple-design Only the producer supplies source support; the returned result contains no such addresses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoints are source identities rather than coordinate matches.
   * @evidence contracts/common.md#meaningful-documentation Documents canonical endpoint order and private address lifetime.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record executes no operation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The query caller owns these transient supports.
   * @author Samchon
   */
  export interface Arc {
    /** Supporting original source faces, discarded before publication. */
    faces: ReadonlySet<number>;

    /** Start/end in saved curve order; equal a/b denotes a canonical vertex. */
    ends: readonly [{ a: number; b: number }, { a: number; b: number }];
  }

  /**
   * Source-independent ordinary pairs and explicit local omissions.
   *
   * @evidence contracts/common.md#principled-implementation Each admitted pair has two distinct before-to-after boundary paths in one regular sheet component.
   * @evidence contracts/common.md#clear-and-simple-design Local ordinals and a reversal flag suffice for the curve consumer; reasons retain unsupported groups.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No source position, face, normal or endpoint address leaves the helper.
   * @evidence contracts/common.md#meaningful-documentation Separates displayable transport from source material-side warnings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no graph computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result retains no source cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns these small ordinal arrays and strings.
   * @author Samchon
   */
  export interface Result {
    /** Ordinary local arc correspondence; reversal is relative to both saved directions. */
    pairs: { before: number; after: number; reverseAfter: boolean }[];

    /** Unsupported components, including components without represented boundary arcs. */
    unresolved: { before: number[]; after: number[]; reason: string }[];

    /** Source orientation warnings do not remove otherwise valid undirected topology. */
    diagnostics?: string[];
  }

  /**
   * Immutable source retained only by the preparation closure.
   *
   * @evidence contracts/common.md#principled-implementation Finite positions and scalar heights with exact canonical aliases define the indexed source complex.
   * @evidence contracts/common.md#clear-and-simple-design One source record supplies both boundary observation and the existing sheet-connectivity owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Aliases must already be qualified; preparation never adds a positional weld.
   * @evidence contracts/common.md#meaningful-documentation States source units, address semantics and immutable lifetime.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no admission.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse belongs to prepare.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The extraction caller retains source ownership.
   * @author Samchon
   */
  export interface Source {
    /** Original finite millimetre positions; never returned. */
    vertices: readonly [number, number, number][];

    /** Original oriented triangles; undirected incidence owns topology. */
    triangles: readonly [number, number, number][];

    /** Idempotent exact-coordinate/height canonical source addresses. */
    canon: Int32Array;

    /** Fixed finite scalar chart, in millimetres, aligned with positions. */
    heights: readonly number[];
  }

  /**
   * One open slab's real arcs, explicit defects and complete candidates.
   *
   * @evidence contracts/common.md#principled-implementation Source support assigns real arcs to slab components while all critical, closed and unrepresented evidence remains a defect.
   * @evidence contracts/common.md#clear-and-simple-design Probes are generated privately and are never mixed into the before/after curve lists.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate completeness and critical-event completeness are explicit producer premises, not inferred from endpoint distance.
   * @evidence contracts/common.md#meaningful-documentation States strict slab bounds, original candidate order and critical-free admission responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record computes no query.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The query borrows one prepared immutable source.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns transient support sets.
   * @author Samchon
   */
  export interface Query {
    /** Finite increasing physical section coordinates, in millimetres. */
    beforeMm: number;

    /** Upper physical section coordinate, in millimetres. */
    afterMm: number;

    /** Real saved open arcs on the lower cut, in publication order. */
    before: readonly Arc[];

    /** Real saved open arcs on the upper cut, in publication order. */
    after: readonly Arc[];

    /** Closed/isolated/unrepresented supports and every critical-event face in this slab. */
    defects: readonly ReadonlySet<number>[];

    /** Complete strict-overlap original face IDs, in increasing order. */
    candidates: readonly number[];
  }

  /** Prepare the original source observer through its dedicated lifetime owner. */
  export const prepare: typeof prepareRecoveryOpenSlabGraph =
    prepareRecoveryOpenSlabGraph;
}
