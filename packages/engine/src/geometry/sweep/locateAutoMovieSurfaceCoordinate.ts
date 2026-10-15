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
 * fractional parts. On a patch whose faces are no grid, a transition band,
 * the face is the first whose bilinear map of its corner coordinates reaches
 * the coordinate, inverted by Newton's method, and the local coordinates are
 * that map's parameters. They follow `IAutoMovieSubdivisionParameter`'s quad
 * convention: `(0, 0)` at corner 0, `u` toward corner 1 along `s`, `v` toward
 * corner 3 along `t`, so the result addresses `subdivideAutoMovieSurface`'s
 * output of this cage directly.
 *
 * @param props.cage A sampled tier, only read.
 * @param props.coordinate The surface coordinate.
 * @returns The face's parameter, with `corner` null because every face is a quad.
 * @throws Error when the patch index is out of range or `s` or `t` lies outside 0 to 1, or a coordinate of a non-grid patch lies on none of its faces.
 *
 * @evidence contracts/common.md#principled-implementation Inverting the even grid map of a structured block is exact: column and row are the integer parts of the scaled coordinates and the local coordinates their fractional parts; a non-grid band inverts each face's bilinear corner map, the map `mapAutoMovieSurfaceTier` applies, by Newton's method.
 * @evidence contracts/common.md#clear-and-simple-design Reads the per-patch grids the sampler publishes; only a non-grid band searches its own faces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates outside a patch are refused instead of clamped onto its edge.
 * @evidence contracts/common.md#meaningful-documentation States the face rule, the boundary case, the local coordinate convention and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms Constant time on a grid: two products, two floors and one array read; on a band, at most 30 Newton steps per face of that band.
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
  if (!grid.grid) return within(props.cage, grid, s, t);
  const i: number = Math.min(grid.columns - 1, Math.floor(s * grid.columns));
  const j: number = Math.min(grid.rows - 1, Math.floor(t * grid.rows));
  return {
    face: grid.faces[j * grid.columns + i]!,
    corner: null,
    u: s * grid.columns - i,
    v: t * grid.rows - j,
  };
};

/** Newton steps that invert one face's bilinear map; each roughly squares the error of a convex quad. */
const NEWTON: number = 30;

/** How far outside a face its local coordinates may fall and still count as inside, for points on a shared edge. */
const SLACK: number = 1e-9;

/** The face of a non-grid patch whose bilinear corner map reaches `(s, t)`, and the local coordinates there. */
const within = (cage: IAutoMovieSurfaceCage, grid: IAutoMovieSurfaceCage.IPatch, s: number, t: number): IAutoMovieSubdivisionParameter => {
  for (const face of grid.faces) {
    const c: IAutoMovieSurfaceCage["corners"][number] = cage.corners[face]!;
    let a: number = 0.5;
    let b: number = 0.5;
    for (let k: number = 0; k < NEWTON; ++k) {
      const fs: number = (1 - a) * (1 - b) * c[0].s + a * (1 - b) * c[1].s + a * b * c[2].s + (1 - a) * b * c[3].s - s;
      const ft: number = (1 - a) * (1 - b) * c[0].t + a * (1 - b) * c[1].t + a * b * c[2].t + (1 - a) * b * c[3].t - t;
      const sa: number = (1 - b) * (c[1].s - c[0].s) + b * (c[2].s - c[3].s);
      const ta: number = (1 - b) * (c[1].t - c[0].t) + b * (c[2].t - c[3].t);
      const sb: number = (1 - a) * (c[3].s - c[0].s) + a * (c[2].s - c[1].s);
      const tb: number = (1 - a) * (c[3].t - c[0].t) + a * (c[2].t - c[1].t);
      const det: number = sa * tb - sb * ta;
      if (det === 0) break;
      a -= (fs * tb - sb * ft) / det;
      b -= (sa * ft - fs * ta) / det;
    }
    if (a >= -SLACK && a <= 1 + SLACK && b >= -SLACK && b <= 1 + SLACK)
      return { face, corner: null, u: Math.min(1, Math.max(0, a)), v: Math.min(1, Math.max(0, b)) };
  }
  throw new Error(`surface coordinate (${s}, ${t}) lies on no face of patch ${grid.name}`);
};
