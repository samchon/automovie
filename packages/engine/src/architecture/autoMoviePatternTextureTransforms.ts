import { positive } from "../geometry/positive";
import { Quaternion } from "../math/Quaternion";
import { AutoMoviePatternTextureSheet } from "./AutoMoviePatternTextureSheet";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";
import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";
import { IAutoMoviePatternTexturing } from "./IAutoMoviePatternTexturing";
import { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";

/** Greatest relative skew a UV transform is still counted as free of. */
const SHEAR_EPSILON: number = 1e-9;

/**
 * Say how each laid piece samples its material, in the UV transform the PBR
 * record already carries.
 *
 * A pattern is not a texture repeat, but what a laid piece finally shows is
 * still a texture, and the way to show it is the one the material record
 * already has: an `offset`, a `scale`, and a `rotationDeg` on its texture
 * reference. Nothing new is invented here and no second texturing path is
 * opened; what this adds is the arithmetic that turns a piece's own place,
 * size, rotation, grain, and flip into that transform, so a book-matched pair
 * is a real mirrored image rather than two slabs a viewer cannot tell apart.
 *
 * The mesh UV this is applied to is a point's place inside the module rectangle
 * the occurrence was generated at, normalized: the binding this fills in is a
 * `"normalized"` coordinate source and not the `"surface-metres"` one an
 * atlas-bearing procedural surface emits, so a prototype has to be a unit square
 * by construction rather than by luck, and the binding has to say which
 * arithmetic it was written in. A whole piece therefore spans
 * `[0, 1]` on both axes, which is what a unit-square prototype gives, and a cut
 * piece spans the sub-rectangle the cut left it rather than being renormalized
 * over its own outline, because a renormalized cut piece would show the whole
 * image squeezed into the surviving sliver. The sheet is turned by the piece's
 * own {@link IAutoMoviePatternPlacement.grainDeg}, so a board whose grain runs
 * along it samples straight while a slab set across the grain samples across
 * it.
 *
 * One call states one material's sheet. A run whose zones carry different
 * materials calls it once per material and keeps the occurrences belonging to
 * that material's zones, exactly as the prototype table is stated per call.
 *
 * At zero texture centre, the viewer/Three matrix is `diag(scale) · R(-rotationDeg) · uv + offset`: it rotates the UV column vector first, then applies axis scales. Orthogonal rows admit this ideal factorization; the implementation accepts their relative dot product within `1e-9` and reports larger residual skew by occurrence id.
 *
 * Every placement of the run lands in exactly one of the two lists, in
 * placement order. Throws when a tile length is not a finite number above zero
 * or a face sheet's origin is not finite.
 *
 * @evidence contracts/common.md#principled-implementation Builds `diag(1/tile) · R(rotation − grain) · diag(±width, height)` and factors rows whose relative dot product is within `1e-9`. Exact orthogonality permits the ideal factorization; tolerated residual skew is approximate. Valid generated placement fields and finite, non-underflowing intermediate row lengths/determinants are premises beyond the tile/origin input checks.
 * @evidence contracts/common.md#clear-and-simple-design Emits the offset, scale and rotation the material texture reference already carries, so no second texturing path is opened, and one call states one material's sheet as the prototype table is stated per call.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no material, module or production. Rows exceeding the stated relative skew tolerance are reported by id; smaller residual skew is admitted explicitly. Cut pieces retain module-rectangle mapping instead of renormalizing their surviving outlines.
 * @evidence contracts/common.md#meaningful-documentation States the normalized UV source a prototype must use, how whole and cut pieces span it, how grain and mirror enter, the per-material call rule, when a piece is sheared, the list order and partition, and both throws.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per placement, so linear in the placement count, with no intermediate matrix allocation beyond two small row records.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure map over one run's placements for one sheet; nothing coordinates work across calls, and a caller texturing several materials reuses the same run result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned transforms and sheared ids, together bounded by the placement count.
 */
export const autoMoviePatternTextureTransforms: (props: {
  result: IAutoMovieSurfacePatternResult;
  tile: { u: number; v: number };
  sheet: AutoMoviePatternTextureSheet;
}) => IAutoMoviePatternTexturing = (props: {
  result: IAutoMovieSurfacePatternResult;
  /** Metres one turn of the texture covers along its own two axes. */
  tile: {
    /** Metres one turn covers along the sheet's own U axis. */
    u: number;
    /** Metres one turn covers along the sheet's own V axis. */
    v: number;
  };
  /** Where the sheet is pinned. */
  sheet: AutoMoviePatternTextureSheet;
}): IAutoMoviePatternTexturing => {
  positive(props.tile.u, "pattern texture tile u");
  positive(props.tile.v, "pattern texture tile v");
  const sheet: AutoMoviePatternTextureSheet = props.sheet;
  if (sheet.kind === "face")
    finitePoint(sheet.origin, "pattern texture sheet origin");
  const transforms: IAutoMoviePatternTextureTransform[] = [];
  const sheared: string[] = [];
  for (const placement of props.result.placements) {
    const grain: number = placement.grainDeg * Quaternion.DEG2RAD;
    const turn: number = placement.rotationDeg * Quaternion.DEG2RAD - grain;
    const cosine: number = Math.cos(turn);
    const sine: number = Math.sin(turn);
    const width: number = placement.mirror
      ? -placement.size.u
      : placement.size.u;
    const height: number = placement.size.v;
    // The two rows of `diag(1/tile) · R(turn) · diag(width, height)`: the map
    // from the piece's own unit UV onto the sheet's.
    const first: IUvRow = {
      x: (cosine * width) / props.tile.u,
      y: (-sine * height) / props.tile.u,
    };
    const second: IUvRow = {
      x: (sine * width) / props.tile.v,
      y: (cosine * height) / props.tile.v,
    };
    const across: number = Math.hypot(first.x, first.y);
    const down: number = Math.hypot(second.x, second.y);
    if (
      Math.abs(first.x * second.x + first.y * second.y) >
      SHEAR_EPSILON * across * down
    ) {
      sheared.push(placement.id);
      continue;
    }
    // `diag(scale) · R(angle)` has second row `ry · (sin, cos)`, so
    // the angle is read off that row and `ry` is its length. That leaves the
    // first row as `rx · (cos, -sin)`, whose signed length along the same
    // direction is the pair's determinant over `ry`, which is where a flipped
    // piece shows up as a negative scale.
    const angle: number = Math.atan2(second.x, second.y);
    const base: IUvRow =
      sheet.kind === "module"
        ? { x: 0.5, y: 0.5 }
        : sheetPoint(placement.center, sheet.origin, grain, props.tile);
    transforms.push({
      id: placement.id,
      offset: {
        x: base.x - (first.x + first.y) / 2,
        y: base.y - (second.x + second.y) / 2,
      },
      scale: {
        x: (first.x * second.y - first.y * second.x) / down,
        y: down,
      },
      rotationDeg: -angle / Quaternion.DEG2RAD,
    });
  }
  return { transforms, sheared };
};

/**
 * A two-component UV quantity: a matrix row or sheet point, in turns.
 */
interface IUvRow {
  /** First component. */
  x: number;

  /** Second component. */
  y: number;
}

/** Where a face point falls on a sheet turned by the grain, in turns. */
const sheetPoint: (
  point: IAutoMoviePatternPoint,
  origin: IAutoMoviePatternPoint,
  grain: number,
  tile: { u: number; v: number },
) => IUvRow = (
  point: IAutoMoviePatternPoint,
  origin: IAutoMoviePatternPoint,
  grain: number,
  tile: { u: number; v: number },
): IUvRow => {
  const cosine: number = Math.cos(grain);
  const sine: number = Math.sin(grain);
  const alongU: number = point.u - origin.u;
  const alongV: number = point.v - origin.v;
  return {
    x: (cosine * alongU + sine * alongV) / tile.u,
    y: (-sine * alongU + cosine * alongV) / tile.v,
  };
};

/** Refuse a point with a non-finite coordinate. */
const finitePoint: (point: IAutoMoviePatternPoint, label: string) => void = (
  point: IAutoMoviePatternPoint,
  label: string,
): void => {
  if (!Number.isFinite(point.u) || !Number.isFinite(point.v))
    throw new Error(`${label} must be finite`);
};
