import type { IAutoMovieRecoverySlabConnectivityGroup } from "./IAutoMovieRecoverySlabConnectivityGroup";

/**
 * Derive closed-loop continuation and isolate source defects by clipped-slab connectivity. Triangle and edge addresses are transient observation evidence and never leave the result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Local boundary-support indices at the lower cut. Local boundary-support indices at the upper cut.
 * @evidence contracts/development/design.md#principled-representation Null for supported continuation; otherwise a local omission reason.
 * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoverySourceTerminals, prepareRecoveryOpenSlabGraph share IAutoMovieRecoverySlabGraph's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts False identifies an open, ambiguous or unsupported source preimage.
 */

export namespace IAutoMovieRecoverySlabGraph {
  /**
   * Derive closed-loop continuation and isolate source defects by clipped-slab connectivity. Triangle and edge addresses are transient observation evidence and never leave the result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. One in-range canonical connectivity index per original vertex; this does not move source coordinates.
   * @evidence contracts/development/design.md#principled-representation Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoverySourceTerminals, prepareRecoveryOpenSlabGraph share IAutoMovieRecoverySlabGraph's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
   */

  export type Observe = (input: {
    /** Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. */
    triangles: readonly [number, number, number][];

    /** One in-range canonical connectivity index per original vertex; this does not move source coordinates. */
    canon: Int32Array;

    /** Finite scalar projections aligned with source vertices, in the same units as query levels. */
    heights: readonly number[];

    /** Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm. */
    beforeMm: number;

    /** Upper physical sweep coordinate in registered millimetres; paired with the strictly smaller beforeMm. */
    afterMm: number;

    /** Original before-side boundary observations or their source-face support, retaining the supplied side order. */
    before: readonly ReadonlySet<number>[];

    /** Original after-side boundary observations or their source-face support, retaining the supplied side order. */
    after: readonly ReadonlySet<number>[];

    /** Original face supports of unsupported open, isolated or unrepresented source contours. */
    defects: readonly ReadonlySet<number>[];

    /** Strictly increasing original face indices covering the operation's complete scalar overlap interval; omission, where allowed, scans all faces. */
    candidates?: readonly number[];

    /** Optional private face-support queries with independent ordinals; they cannot authorize a missing physical boundary. */
    probes?: readonly ReadonlySet<number>[];
  }) => IAutoMovieRecoverySlabConnectivityGroup[];

  /**
   * Admit immutable source incidence and scalar heights once for multiple slabs. Queries supply complete original face IDs in strictly increasing order, including every face with maximum height above beforeMm and minimum height below afterMm. Omitting candidates observes every source face. Boundary supports retain original IDs. Optional private probes query those same components with a separate ordinal namespace; a probe never supplies a missing physical boundary or makes a hidden component supported.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. One in-range canonical connectivity index per original vertex; this does not move source coordinates.
   * @evidence contracts/development/design.md#principled-representation Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface extractRecoveryMeshSections, observeRecoverySourceTerminals, prepareRecoveryOpenSlabGraph share IAutoMovieRecoverySlabGraph's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs.
   */

  export type Prepare = (source: {
    /** Oriented triangle vertex-index triples addressing the paired position array; indices are not control IDs. */
    triangles: readonly [number, number, number][];

    /** One in-range canonical connectivity index per original vertex; this does not move source coordinates. */
    canon: Int32Array;

    /** Finite scalar projections aligned with source vertices, in the same units as query levels. */
    heights: readonly number[];
  }) => (
    input: Omit<
      Parameters<IAutoMovieRecoverySlabGraph.Observe>[0],
      "triangles" | "canon" | "heights"
    >,
  ) => IAutoMovieRecoverySlabConnectivityGroup[];
}
