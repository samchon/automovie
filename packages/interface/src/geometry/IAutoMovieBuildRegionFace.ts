import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/** Data and callback contracts shared by the BuildRegionFace operations. */
export namespace IAutoMovieBuildRegionFace {
  /**
   * Build one open planar region, holes cut out, facing local +Z.
   *
   * This is the single-sided counterpart of `extrudeAutoMovieRegion`: one
   * visible side rather than a zero-thickness solid with coincident front and
   * back faces, so two independently placed copies can carry different
   * materials. A window, for example, keeps a dark exterior pane and a
   * separately lit interior pane without a camera-dependent shader. Rotate a
   * second copy by 180 degrees for the opposite side and separate the copies by
   * a real construction offset rather than leaving them coplanar.
   *
   * Positions and texture coordinates are the authored XY metres at Z = 0, and
   * every normal is +Z. The canonical winding makes every triangle face +Z. A
   * malformed ring throws the triangulator's own diagnostic instead of being
   * repaired here. The returned buffers are new.
   */
  export type IProps = {
    /** Boundary of the visible region in local XY metres. */
    outer: readonly IAutoMovieProfilePoint[];

    /** Optional voids cut out of the visible region. */
    holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
  };
}
