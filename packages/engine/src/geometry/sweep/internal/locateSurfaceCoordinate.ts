import type {
  IAutoMovieLocateSurfaceCoordinate,
  IAutoMovieSubdivisionParameter,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
} from "@automovie/interface";

import { readSurfaceFaceCoordinates } from "./readSurfaceFaceCoordinates";

/*
 * Find the cage face and local coordinates of a surface coordinate on one
 * sampled tier.
 *
 * A patch's grid is even in `(s, t)`, so the face holding a coordinate is
 * column `floor(s * columns)` and row `floor(t * rows)`, the last column or row
 * taking `s` or `t` equal to 1, and the local coordinates are the fractional
 * parts. On a patch whose faces are no grid, a transition band, the face is the
 * first whose bilinear map of its corner coordinates reaches the coordinate,
 * inverted by Newton's method, and the local coordinates are that map's
 * parameters. They follow `IAutoMovieSubdivisionParameter`'s quad convention:
 * `(0, 0)` at corner 0, `u` toward corner 1 along `s`, `v` toward corner 3
 * along `t`, so the result addresses `subdivideSurface`'s output of
 * this cage directly.
 * Parameter props.cage: A sampled tier, only read.
 * Parameter props.coordinate: The surface coordinate.
 * Returns: The face's parameter, with `corner` null because every face is a
 * quad.
 * Error when the patch index is out of range or `s` or `t` lies outside
 * 0 to 1, or a coordinate of a non-grid patch lies on none of its faces.
 */
export const locateSurfaceCoordinate: (
  props: IAutoMovieLocateSurfaceCoordinate.IProps,
) => IAutoMovieSubdivisionParameter = (
  props: IAutoMovieLocateSurfaceCoordinate.IProps,
): IAutoMovieSubdivisionParameter => {
  const { patch, s, t }: typeof props.coordinate = props.coordinate;
  const grid: IAutoMovieSurfaceCage.IPatch | undefined =
    Number.isSafeInteger(patch) && patch >= 0
      ? props.cage.patches[patch]
      : undefined;
  if (grid === undefined)
    throw new Error(
      `surface coordinate names patch ${patch}, which the cage lacks`,
    );
  if (
    !Number.isFinite(s) ||
    !Number.isFinite(t) ||
    !(s >= 0 && s <= 1 && t >= 0 && t <= 1)
  )
    throw new Error("surface coordinate s and t must lie in 0 to 1");
  if (!grid.grid) return within(props.cage, patch, grid, s, t);
  if (
    !Number.isSafeInteger(grid.columns) ||
    grid.columns <= 0 ||
    !Number.isSafeInteger(grid.rows) ||
    grid.rows <= 0 ||
    grid.faces.length !== grid.columns * grid.rows
  )
    throw new Error("surface patch has an incomplete regular grid");
  const i: number = Math.min(grid.columns - 1, Math.floor(s * grid.columns));
  const j: number = Math.min(grid.rows - 1, Math.floor(t * grid.rows));
  const face: number = grid.faces[j * grid.columns + i]!;
  if (
    readSurfaceFaceCoordinates(props.cage, face, "surface coordinate")[0]
      .patch !== patch
  )
    throw new Error(`surface coordinate face ${face} belongs to another patch`);
  return {
    face,
    corner: null,
    u: s * grid.columns - i,
    v: t * grid.rows - j,
  };
};
/*
 * Newton steps that invert one face's bilinear map; each roughly squares the
 * error of a convex quad.
 */
const NEWTON: number = 30;
/*
 * How far outside a face its local coordinates may fall and still count as
 * inside, for points on a shared edge.
 */
const SLACK: number = 1e-9;
/*
 * At smaller scales, solve in axis-relative coordinates to keep products
 * of two chart derivatives inside the working range.
 */
const NORMALIZE_BELOW: number = 2 ** -450;

type IPoint = Pick<IAutoMovieSurfaceCoordinate, "s" | "t">;

function within(
  cage: IAutoMovieSurfaceCage,
  patch: number,
  grid: IAutoMovieSurfaceCage.IPatch,
  s: number,
  t: number,
): IAutoMovieSubdivisionParameter {
  for (const face of grid.faces) {
    const corners = readSurfaceFaceCoordinates(
      cage,
      face,
      "surface coordinate",
    );
    if (corners[0].patch !== patch)
      throw new Error(
        `surface coordinate face ${face} belongs to another patch`,
      );
    const minS: number = Math.min(
        corners[0].s,
        corners[1].s,
        corners[2].s,
        corners[3].s,
      ),
      maxS: number = Math.max(
        corners[0].s,
        corners[1].s,
        corners[2].s,
        corners[3].s,
      ),
      minT: number = Math.min(
        corners[0].t,
        corners[1].t,
        corners[2].t,
        corners[3].t,
      ),
      maxT: number = Math.max(
        corners[0].t,
        corners[1].t,
        corners[2].t,
        corners[3].t,
      );
    const width: number = maxS - minS,
      height: number = maxT - minT;
    if (width === 0 || height === 0) continue;
    const relativeS: number = (s - minS) / width,
      relativeT: number = (t - minT) / height;
    if (!inFace(relativeS) || !inFace(relativeT)) continue;
    const scaled: boolean = width < NORMALIZE_BELOW || height < NORMALIZE_BELOW;
    const c: readonly IPoint[] = scaled
      ? corners.map(
          (p): IPoint => ({
            s: (p.s - minS) / width,
            t: (p.t - minT) / height,
          }),
        )
      : corners;
    const found = invert(
      c,
      scaled ? relativeS : s,
      scaled ? relativeT : t,
      scaled ? 1 : width,
      scaled ? 1 : height,
    );
    if (found !== null) return { face, corner: null, ...found };
  }
  throw new Error(
    `surface coordinate (${s}, ${t}) lies on no face of patch ${grid.name}`,
  );
}

/* The Jacobian determinant of a bilinear chart is affine on the square. */
function invert(
  c: readonly IPoint[],
  s: number,
  t: number,
  width: number,
  height: number,
): { u: number; v: number } | null {
  const bottomS: number = c[1]!.s - c[0]!.s,
    bottomT: number = c[1]!.t - c[0]!.t,
    topS: number = c[2]!.s - c[3]!.s,
    topT: number = c[2]!.t - c[3]!.t,
    leftS: number = c[3]!.s - c[0]!.s,
    leftT: number = c[3]!.t - c[0]!.t,
    rightS: number = c[2]!.s - c[1]!.s,
    rightT: number = c[2]!.t - c[1]!.t;
  const determinants: number[] = [
    bottomS * leftT - leftS * bottomT,
    bottomS * rightT - rightS * bottomT,
    topS * rightT - rightS * topT,
    topS * leftT - leftS * topT,
  ];
  const lo: number = Math.min(...determinants),
    hi: number = Math.max(...determinants);
  if ((lo === 0 && hi === 0) || (lo < 0 && hi > 0)) return null;

  let a: number = 0.5,
    b: number = 0.5;
  for (let k: number = 0; k < NEWTON; ++k) {
    const fs: number = sample(c, "s", a, b) - s,
      ft: number = sample(c, "t", a, b) - t;
    const sa: number = (1 - b) * bottomS + b * topS,
      ta: number = (1 - b) * bottomT + b * topT,
      sb: number = (1 - a) * leftS + a * rightS,
      tb: number = (1 - a) * leftT + a * rightT;
    const det: number = sa * tb - sb * ta;
    if (!Number.isFinite(det) || det === 0) return null;
    const nextA: number = a - (fs * tb - sb * ft) / det,
      nextB: number = b - (sa * ft - fs * ta) / det;
    if (!Number.isFinite(nextA) || !Number.isFinite(nextB)) return null;
    if (nextA === a && nextB === b) break;
    a = nextA;
    b = nextB;
  }
  if (!inFace(a) || !inFace(b)) return null;
  const u: number = Math.min(1, Math.max(0, a)),
    v: number = Math.min(1, Math.max(0, b));
  const finalDet: number =
    ((1 - v) * bottomS + v * topS) * ((1 - u) * leftT + u * rightT) -
    ((1 - u) * leftS + u * rightS) * ((1 - v) * bottomT + v * topT);
  if (
    finalDet === 0 ||
    Math.abs(sample(c, "s", u, v) - s) / width > SLACK ||
    Math.abs(sample(c, "t", u, v) - t) / height > SLACK
  )
    return null;
  return { u, v };
}

function inFace(value: number): boolean {
  return value >= -SLACK && value <= 1 + SLACK;
}

function sample(
  c: readonly IPoint[],
  axis: keyof IPoint,
  u: number,
  v: number,
): number {
  return (
    (1 - u) * (1 - v) * c[0]![axis] +
    u * (1 - v) * c[1]![axis] +
    u * v * c[2]![axis] +
    (1 - u) * v * c[3]![axis]
  );
}
