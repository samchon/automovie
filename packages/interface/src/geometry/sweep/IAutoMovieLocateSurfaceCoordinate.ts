import type { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import type { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/** A network chart address and the sampled tier in which to locate it. */
export namespace IAutoMovieLocateSurfaceCoordinate {
  /**
   * Find the cage face and local coordinates of a surface coordinate on one
   * sampled tier.
   *
   * A patch's grid is even in `(s, t)`, so the face holding a coordinate is
   * column `floor(s * columns)` and row `floor(t * rows)`, the last column or
   * row taking `s` or `t` equal to 1, and the local coordinates are the
   * fractional parts. On a patch whose faces are no grid, a transition band,
   * the face is the first whose bilinear map of its corner coordinates reaches
   * the coordinate, inverted by Newton's method, and the local coordinates are
   * that map's parameters. They follow `IAutoMovieSubdivisionParameter`'s quad
   * convention: `(0, 0)` at corner 0, `u` toward corner 1 along `s`, `v` toward
   * corner 3 along `t`, so the result addresses `subdivideAutoMovieSurface`'s
   * output of this cage directly.
   *
   * @evidence contracts/development/design.md#principled-representation Dimensionless patch s/t addresses are separate from cage-face u/v; the locator checks patch presence and [0,1] bounds before chart inversion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface mapAutoMovieSurfaceTier reuses this locator on its destination cage; canonical cage and coordinate contracts own the topology and chart data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The lookup uses supplied patch charts rather than inferring correspondence from spatial proximity; non-grid inversion can refuse an unmatched coordinate.
   * @evidence contracts/development/common.md#meaningful-documentation Gives quad convention, borrowed chart ownership, range admission and lookup failure.
   */
  export type IProps = {
    /** Borrowed sampled tier whose patch grids and face-corner charts define the lookup. Cage geometry is not projected or read; callers must preserve the chart topology. */
    cage: IAutoMovieSurfaceCage;

    /** Patch index plus dimensionless s/t in [0,1]. The locator rejects a missing patch or out-of-range coordinates; a non-grid patch throws if no face accepts the inverted bilinear coordinates. */
    coordinate: IAutoMovieSurfaceCoordinate;
  };
}
