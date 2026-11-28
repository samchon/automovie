import type {
  IAutoMovieMeshPlaneContour,
  IAutoMoviePlaneFrame,
  IAutoMovieRecoveryIndexedMesh,
} from "..";

/**
 * Callable triangle-plane observation with optional reusable scalar chart
 * preparation.
 */

export namespace IAutoMovieMeshPlaneCut {
  /**
   * Intersect the supplied registered triangle source with its physical plane.
   * An optional aligned scalar chart supplies the signed threshold and edge
   * fraction. Keep cycles, separate branch chains and isolated contacts in
   * observed order.
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    plane: IAutoMoviePlaneFrame,
    select?: (triangle: number) => boolean,
    chart?: {
      /** Aligned original-vertex scalar heights for this observation. */
      heights: readonly number[];
      /** Signed station coordinate whose threshold defines the slice. */
      level: number;
    },
  ) => IAutoMovieMeshPlaneContour[];

  /**
   * Prepare registered positions, original incidence and aligned scalar heights
   * for repeated plane cuts. Keep input arrays immutable. Optional provenance
   * retains emitting original faces and ordered edge witnesses. Queries may
   * restrict sorted candidate faces and apply an original-face filter.
   */

  export type Prepare = (
    skin: IAutoMovieRecoveryIndexedMesh,
    heights: readonly number[],
    retainSourceFaces?: boolean,
    retainOrderedSource?: boolean,
  ) => (
    plane: IAutoMoviePlaneFrame,
    level: number,
    candidates?: readonly number[],
    select?: (triangle: number) => boolean,
  ) => IAutoMovieMeshPlaneContour[];
}
