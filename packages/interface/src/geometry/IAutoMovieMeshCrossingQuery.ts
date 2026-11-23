import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
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
 * @evidence contracts/development/design.md#principled-representation Both operations share the producer's exact edge-through-triangle and coplanar-overlap predicates over the same target snapshot; their boolean differs only by termination after a true witness.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A callable census and boolean share one target snapshot; withPositions explicitly produces another immutable snapshot using the same fixed layout instead of introducing a transform cache or second narrow phase.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original ordinal identity and strict contact rules remain intact; no proxy, actor exclusion or cached answer replaces actual triangle tests, and a clear surface census does not infer inside/outside.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, common metre frame, original ordinal/order, independent fixed-layout snapshots and the distinction between crossing evidence, an existential answer and absent volume/continuous proof.
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
   */
  withPositions(positions: readonly number[]): IAutoMovieMeshCrossingQuery;
}
