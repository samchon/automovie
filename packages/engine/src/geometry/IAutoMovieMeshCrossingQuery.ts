import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";
import type { IAutoMovieMeshCrossingOptions } from "./IAutoMovieMeshCrossingOptions";

/**
 * Strict crossing queries over one immutable resident surface, prepared by
 * createAutoMovieMeshCrossingQuery. Both meshes share the snapshot's metre
 * frame. The callable reports original first/second triangle ordinals in the
 * established candidate order; crosses answers only whether a witness exists.
 * withPositions creates a separate current-coordinate snapshot with the same
 * copied source addressing and hierarchy partition. None of these operations
 * supplies penetration depth, containment or swept proof.
 *
 * @evidence contracts/common.md#principled-implementation Both operations share the producer's exact edge-through-triangle and coplanar-overlap predicates over the same target snapshot; their boolean differs only by termination after a true witness.
 * @evidence contracts/common.md#clear-and-simple-design A callable census and boolean share one target snapshot; withPositions explicitly produces another immutable snapshot using the same fixed layout instead of introducing a transform cache or second narrow phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original ordinal identity and strict contact rules remain intact; no proxy, actor exclusion or cached answer replaces actual triangle tests, and a clear surface census does not infer inside/outside.
 * @evidence contracts/common.md#meaningful-documentation States the producer, common metre frame, original ordinal/order, independent fixed-layout snapshots and the distinction between crossing evidence, an existential answer and absent volume/continuous proof.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This callable interface adds no runtime work; indexing, pruning, sorting and early termination are answered on its producer.
 * @evidence contracts/performance.md#reuse-equivalent-work Census/boolean calls share current immutable geometry. withPositions reuses copied indices and partition with entirely new geometry/bounds/cell; changed indices/cardinality require the factory. Each first mesh and classification option is read on its call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns each query's O(s) current triangle/tree state and shared O(s) frozen index layout until released. New position snapshots retain no old geometry/history, per-call result or callback.
 */
export interface IAutoMovieMeshCrossingQuery {
  /** Report all crossed first triangles, or all crossing pairs when explicitly requested. */
  (
    first: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): IAutoMovieMeshCrossing[];

  /**
   * Return true only after a strict transverse or coplanar witness is found.
   * Classification and empty/malformed input rules match the callable census;
   * allPairs changes report population, never this existential decision.
   *
   * @evidence contracts/common.md#principled-implementation The same private narrow-phase walk ends immediately after one accepted witness, which suffices for the logical existence of a crossing regardless of later triangle pairs.
   * @evidence contracts/common.md#clear-and-simple-design This method shares the callable's compiled target instead of preparing another index or maintaining a separate predicate implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate box overlap alone never returns true; strict contact classification and per-witness callbacks remain in force, while coplanar witnesses retain their existing callback bypass.
   * @evidence contracts/common.md#meaningful-documentation States the witnessed boolean, parity with the census, early termination and why allPairs does not affect the result.
   * @evidence contracts/performance.md#efficient-algorithms Reads and admits the current first mesh, then stops its shared candidate traversal on the first accepted witness; a clear result still examines every surviving pair.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses exactly the callable's resident hierarchy and ordering cell, with no cached first-mesh or classifier verdict.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no first mesh or result and creates at most one witness record after admission; per-call indexing/candidate state is released on return.
   */
  crosses(
    first: IAutoMovieMesh,
    options?: IAutoMovieMeshCrossingOptions,
  ): boolean;

  /**
   * Snapshot all current XYZ coordinates in the queries' shared metre frame
   * using the original copied index run and exactly its original scalar count.
   * Every source triangle remains present, including zero-area triangles that
   * become valid or degenerate at another pose. Coordinates may come from rigid,
   * affine or independently articulated placement; the same world-space strict
   * predicates and numeric cutoffs apply to their actual supplied values.
   *
   * Copies all used corners and validates every scalar, including unused
   * vertices. Wrong cardinality, holes and nonfinite values throw without
   * changing this query. Source indices are immutable; changing index layout or
   * vertex count requires createAutoMovieMeshCrossingQuery. Later input/output
   * edits cannot change this or another snapshot. A refit may retain a less
   * efficient partition than a fresh build, but never uses old geometric bounds.
   *
   * @evidence contracts/common.md#principled-implementation Fixed addressing keeps every original ordinal total at the admitted cardinality. Fresh world triangle extrema and refitted ancestor unions preserve enclosure; the world mean-extent cell and existing candidate sort preserve witness/callback order independently of tree shape.
   * @evidence contracts/common.md#clear-and-simple-design An explicit immutable snapshot producer extends the existing query contract; the existing geometry reader, refit owner and single narrow phase handle new positions without another transform convention or collider system.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All original triples survive degeneracy transitions and all supplied coordinates are admitted. No inverse affine distance, active-area mask, geometry shrink, contact exemption, global cache or mutation of another query is used.
   * @evidence contracts/common.md#meaningful-documentation States metre/world frame, original scalar count/addressing, rigid/affine/articulated values, degenerate membership, complete finite/hole admission, failure effects, independent ownership and the possible traversal-cost limitation.
   * @evidence contracts/performance.md#efficient-algorithms For V supplied scalars and T source triangles, validates/copies actual corners, computes their boxes and world cell, and refits each tree node in O(V+T). No median sorting repeats; retained partition quality can increase subsequent query traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses only copied fixed indices and partition membership/order. Actual current geometry, exact bounds and ordering cell are recomputed; new index layout/cardinality requires a new factory call.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns O(T) new triangle/tree state sharing immutable O(T) indices. It retains no supplied coordinate array or parent geometry/query/history, so snapshots can be released independently.
   */
  withPositions(positions: readonly number[]): IAutoMovieMeshCrossingQuery;
}
