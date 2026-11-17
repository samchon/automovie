/**
 * Observe ordinary open-arc transport without exporting source addresses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Records private support premises, unsupported topology and source orientation qualification separately.
 * @evidence contracts/development/design.md#principled-representation Original source incidence, exact scalar heights and two saved open-arc populations define one ordinary continuation query.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared runtime owner reuses source-link and boundary incidence; interface owns Source, Query, Arc and Result records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source topology and material orientation remain independent; hidden components, critical-event defects and ambiguous endpoint transport cannot authorize a bridge.
 */

export namespace IAutoMovieRecoveryOpenSlabGraph {
  /** One saved open curve's private observation support.
   * @evidence contracts/development/design.md#principled-representation Face support and two canonical edge or vertex addresses refer to the actual ordered cut endpoints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the producer supplies source support; the returned result contains no such addresses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Endpoints are source identities rather than coordinate matches.
   * @evidence contracts/development/common.md#meaningful-documentation Documents canonical endpoint order and private address lifetime.
   */
  export interface Arc {
    /** Supporting original source faces, discarded before publication. */
    faces: ReadonlySet<number>;

    /** Start/end in saved curve order; equal a/b denotes a canonical vertex. */
    ends: readonly [
      {
        /** Original first endpoint index of this source edge, in the paired source vertex array. */
        a: number;
        /** Original second endpoint index of this source edge, in the paired source vertex array. */
        b: number;
      },
      {
        /** Original first endpoint index of this source edge, in the paired source vertex array. */
        a: number;
        /** Original second endpoint index of this source edge, in the paired source vertex array. */
        b: number;
      },
    ];
  }

  /** Source-independent ordinary pairs and explicit local omissions.
   * @evidence contracts/development/design.md#principled-representation Each admitted pair has two distinct before-to-after boundary paths in one regular sheet component.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Local ordinals and a reversal flag suffice for the curve consumer; reasons retain unsupported groups.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source position, face, normal or endpoint address leaves the helper.
   * @evidence contracts/development/common.md#meaningful-documentation Separates displayable transport from source material-side warnings.
   */
  export interface Result {
    /** Ordinary local arc correspondence; reversal is relative to both saved directions. */
    pairs: {
      /** Saved before-side arc or observation ordinal in the addressed section. */
      before: number;
      /** Saved after-side arc or observation ordinal in the addressed section. */
      after: number;
      /** Whether the after-side continuation must reverse its saved endpoint order. */
      reverseAfter: boolean;
    }[];

    /** Unsupported components, including components without represented boundary arcs. */
    unresolved: {
      /** Original before-side boundary observations or their source-face support, retaining the supplied side order. */
      before: number[];
      /** Original after-side boundary observations or their source-face support, retaining the supplied side order. */
      after: number[];
      /** Actual termination or qualification reason; null, where allowed, means no local failure was recorded. */
      reason: string;
    }[];

    /** Source orientation warnings do not remove otherwise valid undirected topology. */
    diagnostics?: string[];
  }

  /** Immutable source retained only by the preparation closure.
   * @evidence contracts/development/design.md#principled-representation Finite positions and scalar heights with exact canonical aliases define the indexed source complex.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One source record supplies both boundary observation and the existing sheet-connectivity owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Aliases must already be qualified; preparation never adds a positional weld.
   * @evidence contracts/development/common.md#meaningful-documentation States source units, address semantics and immutable lifetime.
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

  /** One open slab's real arcs, explicit defects and complete candidates.
   * @evidence contracts/development/design.md#principled-representation Source support assigns real arcs to slab components while all critical, closed and unrepresented evidence remains a defect.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Probes are generated privately and are never mixed into the before/after curve lists.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Candidate completeness and critical-event completeness are explicit producer premises, not inferred from endpoint distance.
   * @evidence contracts/development/common.md#meaningful-documentation States strict slab bounds, original candidate order and critical-free admission responsibility.
   */
  export interface Query {
    /** Finite increasing physical section coordinates, in millimetres. */
    beforeMm: number;

    /** Upper physical section coordinate, in millimetres. */
    afterMm: number;

    /** Real saved open arcs on the lower cut, in publication order. */
    before: readonly IAutoMovieRecoveryOpenSlabGraph.Arc[];

    /** Real saved open arcs on the upper cut, in publication order. */
    after: readonly IAutoMovieRecoveryOpenSlabGraph.Arc[];

    /** Closed/isolated/unrepresented supports and every critical-event face in this slab. */
    defects: readonly ReadonlySet<number>[];

    /** Complete strict-overlap original face IDs, in increasing order. */
    candidates: readonly number[];
  }
  /** Prepare source boundary incidence once, then answer ordinary open-arc transport queries against that unchanged source. The returned synchronous query retains source incidence until released; unsupported local transport is recorded in Result rather than fabricated.
   * @evidence contracts/development/common.md#meaningful-documentation Prepare source boundary incidence once, then answer ordinary open-arc transport queries against that unchanged source. The returned synchronous query retains source incidence until released; unsupported local transport is recorded in Result rather than fabricated.
   * @evidence contracts/development/design.md#principled-representation The existing source, query and result records preserve physical identity and explicit topology qualification.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The runtime operation and its callers share the same input and result owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported incidence remains explicit and no source address becomes reconstructed geometry.
   */
  export type Prepare = (source: Source) => (input: Query) => Result;
}
