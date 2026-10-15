import { IAutoMovieSubdivisionParameter } from "../IAutoMovieSubdivisionParameter";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";

/**
 * Find the cage face and local coordinates of a surface coordinate on one
 * sampled tier.
 *
 * A patch's grid is even in `(s, t)`, so the face holding a coordinate is
 * column `floor(s * columns)` and row `floor(t * rows)`, the last column or
 * row taking `s` or `t` equal to 1, and the local coordinates are the
 * fractional parts. They follow `IAutoMovieSubdivisionParameter`'s quad
 * convention: `(0, 0)` at corner 0, `u` toward corner 1 along `s`, `v` toward
 * corner 3 along `t`, so the result addresses `subdivideAutoMovieSurface`'s
 * output of this cage directly.
 *
 * @param props.cage A sampled tier, only read.
 * @param props.coordinate The surface coordinate.
 * @returns The face's parameter, with `corner` null because every face is a quad.
 * @throws Error when the patch index is out of range or `s` or `t` lies outside 0 to 1.
 *
 * @evidence contracts/common.md#principled-implementation Inverting the even grid map of a structured block is exact: column and row are the integer parts of the scaled coordinates and the local coordinates their fractional parts.
 * @evidence contracts/common.md#clear-and-simple-design Reads the per-patch grids the sampler publishes; no search over faces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates outside a patch are refused instead of clamped onto its edge.
 * @evidence contracts/common.md#meaningful-documentation States the face rule, the boundary case, the local coordinate convention and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: two products, two floors and one array read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const locateAutoMovieSurfaceCoordinate: (props: {
  cage: IAutoMovieSurfaceCage;
  coordinate: IAutoMovieSurfaceCoordinate;
}) => IAutoMovieSubdivisionParameter = (props: {
  cage: IAutoMovieSurfaceCage;
  coordinate: IAutoMovieSurfaceCoordinate;
}): IAutoMovieSubdivisionParameter => {
  const { patch, s, t } = props.coordinate;
  const grid: IAutoMovieSurfaceCage.IPatch | undefined = props.cage.patches[patch];
  if (grid === undefined) throw new Error(`surface coordinate names patch ${patch}, which the cage lacks`);
  if (!(s >= 0 && s <= 1 && t >= 0 && t <= 1))
    throw new Error("surface coordinate s and t must lie in 0 to 1");
  const i: number = Math.min(grid.columns - 1, Math.floor(s * grid.columns));
  const j: number = Math.min(grid.rows - 1, Math.floor(t * grid.rows));
  return {
    face: grid.faces[j * grid.columns + i]!,
    corner: null,
    u: s * grid.columns - i,
    v: t * grid.rows - j,
  };
};
