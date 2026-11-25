import type { IAutoMovieWallOpening } from "./IAutoMovieWallOpening";

/** Data and callback contracts shared by the BuildWall operations. */
export namespace IAutoMovieBuildWall {
  /**
   * Build a rectangular wall in local XY, depth along Z, with rectangular door
   * and window openings cut through it.
   *
   * The wall is partitioned at every opening edge, the cells an opening covers
   * are dropped, and each standing cell emits only the faces no standing
   * neighbour hides. Openings are therefore real holes in beauty, depth, normal
   * and mask passes rather than metadata over an uncut wall, and the standing
   * wall is a closed 2-manifold: a union of one box per cell would leave an
   * interior face between every adjacent pair, an edge shared by four triangles
   * that `validateMeshTopology`, and so `validateModel`, refuses, plus
   * triangles no camera reaches that a budget still counts.
   *
   * Every cell corner is a lattice coordinate minus one half-extent, so the
   * face two adjacent cells share reads the same pair of doubles from both
   * sides and welds exactly. The result is centred on the wall and spans
   * `-depth / 2` to `+depth / 2`; it carries flat per-face normals and no
   * texture coordinates, because which cell a point belongs to depends on the
   * opening list, and an atlas laid on that lattice would shift whenever an
   * opening moves. `extrudeAutoMovieRegion`, with the panel as its outer ring
   * and the openings as holes, is the atlas-bearing form that also cuts
   * arbitrary outlines.
   *
   * All openings are admitted before the lattice is built, so a refusal never
   * leaves a partial mesh. Refused: a nonpositive or non-finite wall size; an
   * opening with a blank or repeated id, a non-finite origin, a nonpositive
   * size, or a rectangle outside the wall; two overlapping openings; openings
   * meeting only at a corner, which would pinch the wall to a line that needs a
   * general boolean this kernel does not have; and openings that remove the
   * whole wall. Opening records are only read.
   */
  export type IProps = {
    /** Wall width along X, in metres. */
    width: number;

    /** Wall height along Y, in metres. */
    height: number;

    /** Wall thickness along Z, in metres. */
    depth: number;

    /** Rectangles to cut, from the wall's bottom-left corner. */
    openings: readonly IAutoMovieWallOpening[];
  };
}
