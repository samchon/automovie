import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";
import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";

/** Data and callback contracts shared by the MeshCrossingGeometry operations. */
export namespace IAutoMovieMeshCrossingGeometry {
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
      readonly triangles: IAutoMovieMeshCrossingGeometry.ITriangle[];
  
      /** Current exact enclosing tree; undefined precisely for an empty index run. */
      readonly hierarchy: IAutoMovieMeshQueryHierarchy<IAutoMovieMeshCrossingGeometry.ITriangle> | undefined;
    }
}
