/**
 * Private open-slab observation records retained by one preparation and query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the owned inputs, output responsibility and retained qualification limits.
 * @evidence contracts/development/design.md#principled-representation Represents Private open-slab observation records retained by one preparation and query: companion namespace of 4 members (`Arc`, `Result`, `Source`, `Query`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRecoveryOpenSlabGraph` in packages/recovery/src/internal/IRecoveryOpenSlabGraph.ts; its surface is the 4 members listed and the text shows 1 other file naming it, mostly packages/recovery (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IRecoveryOpenSlabGraph {
  /**
   * One saved open curve's private observation support.
   *
   * @evidence contracts/development/design.md#principled-representation Face support and two canonical edge or vertex addresses refer to the actual ordered cut endpoints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the producer supplies source support; the returned result contains no such addresses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Endpoints are source identities rather than coordinate matches.
   * @evidence contracts/development/common.md#meaningful-documentation Documents canonical endpoint order and private address lifetime.
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
   * @evidence contracts/development/design.md#principled-representation Each admitted pair has two distinct before-to-after boundary paths in one regular sheet component.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Local ordinals and a reversal flag suffice for the curve consumer; reasons retain unsupported groups.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source position, face, normal or endpoint address leaves the helper.
   * @evidence contracts/development/common.md#meaningful-documentation Separates displayable transport from source material-side warnings.
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

  /**
   * One open slab's real arcs, explicit defects and complete candidates.
   *
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
    before: readonly Arc[];

    /** Real saved open arcs on the upper cut, in publication order. */
    after: readonly Arc[];

    /** Closed/isolated/unrepresented supports and every critical-event face in this slab. */
    defects: readonly ReadonlySet<number>[];

    /** Complete strict-overlap original face IDs, in increasing order. */
    candidates: readonly number[];
  }
}
