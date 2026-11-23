import type { IAutoMovieMeshQueryHierarchy } from "./IAutoMovieMeshQueryHierarchy";
import type { IAutoMovieSpatialQueryEntry } from "./IAutoMovieSpatialQueryEntry";

/** Data and callback contracts shared by the MeshCrossingGeometry operations. */
export namespace IAutoMovieMeshCrossingGeometry {
  /** One original triangle, including degenerate triangles, in one snapshot. */
  export interface ITriangle extends IAutoMovieSpatialQueryEntry {
    /** Three copied XYZ corners in the snapshot's common metre frame. */
    readonly corners: number[][];
  }

  /** Internal immutable-layout/current-geometry pair held by one crossing query. */
  export interface ISnapshot {
    /** Fixed XYZ scalar count, including positions not referenced by indices. */
    readonly positionCount: number;

    /** Copied frozen source index run; original triples determine ordinals. */
    readonly indices: readonly number[];

    /**
     * Current copied triangles in original index-buffer order, without area
     * filtering.
     */
    readonly triangles: IAutoMovieMeshCrossingGeometry.ITriangle[];

    /** Current exact enclosing tree; undefined precisely for an empty index run. */
    readonly hierarchy:
      | IAutoMovieMeshQueryHierarchy<IAutoMovieMeshCrossingGeometry.ITriangle>
      | undefined;
  }
}
