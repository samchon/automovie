import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";
import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";
import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";
import { refitAutoMovieMeshQueryHierarchy } from "./refitAutoMovieMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Internal geometry ownership for immutable crossing snapshots and refits.
 * The public crossing factory owns queries; this namespace admits complete
 * buffers and retains a copied index layout across independent world snapshots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the internal owner and public consumer, complete-buffer admission, fixed layout, independent snapshots and zero-area retention.
 * @evidence contracts/development/design.md#principled-representation Represents Internal geometry ownership for immutable crossing snapshots and refits: companion namespace of 5 members (`ITriangle`, `ISnapshot`, `index`, `prepare`, `withPositions`); units and frames named in its text: second, metre, frame, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieMeshCrossingGeometry` in packages/engine/src/geometry/AutoMovieMeshCrossingGeometry.ts; its surface is the 5 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieMeshCrossingGeometry {
  /**
   * One original triangle, including degenerate triangles, in one snapshot.
   *
   * @evidence contracts/development/design.md#principled-representation Actual corners, component extrema and original ordinal supply the existing strict narrow phase and exact-box candidate walker without substituting a shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the shared spatial entry with only its three XYZ corners; no second mesh or collision representation is introduced.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Area does not determine membership: every admitted source triple receives a record and keeps its ordinal.
   * @evidence contracts/development/common.md#meaningful-documentation States original identity, current-snapshot geometry and degenerate membership; the inherited spatial entry defines box and partition-centre units.
   */
  export interface ITriangle extends IAutoMovieSpatialQueryEntry {
    /** Three copied XYZ corners in the snapshot's common metre frame. */
    readonly corners: number[][];
  }

  /**
   * Internal immutable-layout/current-geometry pair held by one crossing query.
   *
   * @evidence contracts/development/design.md#principled-representation Copied fixed indices preserve original triangle identity while current independent corners and hierarchy bounds represent exactly one pose; empty index populations have no hierarchy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Stores the layout cardinality, index run, original-order triangles and current tree needed by initial or refitted query construction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No previous mutable mesh, transform key or omitted active population is stored; degenerate source triples remain in triangles and tree.
   * @evidence contracts/development/common.md#meaningful-documentation Documents scalar cardinality including unused vertices, shared frozen indices, original-order records and undefined hierarchy semantics.
   */
  export interface ISnapshot {
    /** Fixed XYZ scalar count, including positions not referenced by indices. */
    readonly positionCount: number;

    /** Copied frozen source index run; original triples determine ordinals. */
    readonly indices: readonly number[];

    /** Current copied triangles in original index-buffer order, without area filtering. */
    readonly triangles: ITriangle[];

    /** Current exact enclosing tree; undefined precisely for an empty index run. */
    readonly hierarchy: IAutoMovieMeshQueryHierarchy<ITriangle> | undefined;
  }

  /**
   * Admit and index one current subject without retaining its buffers.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Shared triangle-index admission makes each addressed corner total, and a complete indexed finite-coordinate scan ensures exact current triangle boxes can enclose their copied corners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Current query subjects and resident preparation share the same private corner/box reader rather than maintaining different mesh admission or indexing laws.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every index triple becomes a record, including zero-area triples. Unreferenced coordinates are still admitted and sparse/nonfinite coordinates refuse.
   * @evidence contracts/development/common.md#meaningful-documentation States current subject ownership and complete admission, with original triples and degenerate membership inherited from ITriangle/read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans V position scalars and T triangle triples in O(V+T), which is necessary to admit and index the complete current subject; no hierarchy is built for it.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A current subject may change on every query, so no coordinate or admission verdict is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns O(T) fresh corner/box records and retains no mesh, source indices or caller positions after the call.
   */
  export function index(mesh: IAutoMovieMesh): ITriangle[] {
    return read(
      mesh.positions,
      triangleIndicesOf(mesh, "Mesh crossings (complete triangle buffers)"),
    );
  }

  /**
   * Snapshot a complete resident layout and build its initial median hierarchy.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies admitted triangle indices, indexes all current corners and builds the existing exact-box hierarchy. Frozen indices and original ordinals form the invariant used by later refits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This initial constructor delegates index admission, corner reading and hierarchy partitioning to their single owners; public query construction consumes its resulting snapshot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Source mutation cannot alter copied/frozen indices or current corners. No zero-area or currently inactive triangle is discarded.
   * @evidence contracts/development/common.md#meaningful-documentation States complete source ownership, the copied fixed-layout invariant and initial median build; ISnapshot states empty and lifetime semantics.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(V+T) admission/indexing plus the shared O(T log² T) initial build. This sort is paid once per adopted index layout, not on each changed pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Produces the frozen source index run and hierarchy partition that later current-position snapshots can reuse; changed indices/cardinality require another preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Transfers copied frozen indices and O(T) private triangle/tree state to the query owner, retaining no original mesh/position/index buffers.
   */
  export function prepare(mesh: IAutoMovieMesh): ISnapshot {
    const indices: readonly number[] = Object.freeze(
      triangleIndicesOf(
        mesh,
        "Mesh crossings (complete triangle buffers)",
      ).slice(),
    );
    const triangles: ITriangle[] = read(mesh.positions, indices);
    return {
      positionCount: mesh.positions.length,
      indices,
      triangles,
      hierarchy:
        triangles.length === 0
          ? undefined
          : buildAutoMovieMeshQueryHierarchy([...triangles]),
    };
  }

  /**
   * Snapshot new common-frame coordinates against the fixed source index layout.
   * A wrong scalar count or any nonfinite/hole coordinate refuses before a new
   * snapshot is returned; source and earlier snapshots remain usable.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Identical position cardinality keeps every frozen index valid. Re-reading all corners then refitting every partition node gives actual current bounds, preserving every ordinal even across degenerate/valid transitions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Position replacement owns no transform law: the actual consumer supplies canonical world coordinates. Existing read and shared refit keep the arithmetic and population in one owner each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains all source triples and validates all positions, including unused ones. No triangle activation shortcut, inverse affine query, cached world transform or mutable prior snapshot is used.
   * @evidence contracts/development/common.md#meaningful-documentation States common frame, fixed source addressing, cardinality/nonfinite refusal, failure effects, actual-coordinate ownership and degenerate transitions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads V coordinate scalars and T triples, then refits O(T) tree state: O(V+T) time and O(T) fresh retained geometry, with no repeated partition sort. Query efficiency may decrease if the retained partition poorly matches the new placement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the frozen indices and reuses only partition membership/order. Every current corner, box and ancestor bound is replaced; the snapshot does not retain its source query or earlier geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh triangle/tree state plus the shared frozen index run and scalar count. It borrows positions synchronously, and neither the input buffer nor a chain of old snapshots is retained.
   */
  export function withPositions(
    source: ISnapshot,
    positions: readonly number[],
  ): ISnapshot {
    if (positions.length !== source.positionCount)
      throw new Error(
        "Mesh crossing refit needs the original XYZ position cardinality.",
      );
    const triangles: ITriangle[] = read(positions, source.indices);
    return {
      positionCount: source.positionCount,
      indices: source.indices,
      triangles,
      hierarchy:
        source.hierarchy === undefined
          ? undefined
          : refitAutoMovieMeshQueryHierarchy(
              source.hierarchy,
              (triangle: ITriangle): ITriangle => triangles[triangle.ordinal]!,
            ),
    };
  }
}

/** Read all coordinates, then copy every addressed original triple and its exact box. */
function read(
  positions: readonly number[],
  indices: readonly number[],
): AutoMovieMeshCrossingGeometry.ITriangle[] {
  for (let scalar: number = 0; scalar < positions.length; scalar++)
    if (!Number.isFinite(positions[scalar]))
      throw new Error("Mesh crossings need finite complete triangle buffers.");
  const at: (vertex: number) => number[] = (vertex: number): number[] => [
    positions[vertex * 3]!,
    positions[vertex * 3 + 1]!,
    positions[vertex * 3 + 2]!,
  ];
  const triangles: AutoMovieMeshCrossingGeometry.ITriangle[] = [];
  for (let t: number = 0; t < indices.length; t += 3) {
    const a: number[] = at(indices[t]!);
    const b: number[] = at(indices[t + 1]!);
    const c: number[] = at(indices[t + 2]!);
    const low: number[] = [0, 1, 2].map((axis: number): number =>
      Math.min(a[axis]!, b[axis]!, c[axis]!),
    );
    const high: number[] = [0, 1, 2].map((axis: number): number =>
      Math.max(a[axis]!, b[axis]!, c[axis]!),
    );
    triangles.push({
      ordinal: t / 3,
      corners: [a, b, c],
      low,
      high,

      // Half-sums retain finite partition centres when a represented extent overflows.
      centre: [0, 1, 2].map(
        (axis: number): number => low[axis]! / 2 + high[axis]! / 2,
      ),
    });
  }
  return triangles;
}
