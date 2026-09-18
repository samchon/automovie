import { Quaternion } from "../math/Quaternion";
import { AutoMoviePatternTextureSheet } from "./AutoMoviePatternTextureSheet";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";
import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";
import { IAutoMoviePatternTexturing } from "./IAutoMoviePatternTexturing";
import { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";

/** Greatest relative skew a UV transform is still counted as free of. */
const SHEAR_EPSILON = 1e-9;

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
 * The renderer's texture matrix scales and then rotates, so a piece samples
 * exactly when its own two axes stay perpendicular under the map, which they do
 * when the piece is square or when it is laid square to its grain. A long piece
 * turned off its grain by anything else needs a shear the transform has no term
 * for, and is reported by id rather than handed back as a transform that
 * quietly skews the image.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `autoMoviePatternTextureTransforms` says how each laid piece samples its material, in the UV transform the PBR record already carries. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `autoMoviePatternTextureTransforms` performs pattern texture transforms derivation when the engine resolves the declared physical-module pattern deterministically.
 * @evidence requirements/interior/grain-seams-and-continuity.md#interior-grain-bookmatch `autoMoviePatternTextureTransforms` derives each piece's mirror, grain, stable sheet offset, scale, and rotation so declared bookmatch relations survive texture sampling.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-joint-edge-grain-continuity The UV transforms retain the declared mirror and grain relation across neighboring pieces without claiming a raw-stock catalogue.
 */
export const autoMoviePatternTextureTransforms = (props: {
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
  const sheet = props.sheet;
  if (sheet.kind === "face")
    finitePoint(sheet.origin, "pattern texture sheet origin");
  const transforms: IAutoMoviePatternTextureTransform[] = [];
  const sheared: string[] = [];
  for (const placement of props.result.placements) {
    const grain = placement.grainDeg * Quaternion.DEG2RAD;
    const turn = placement.rotationDeg * Quaternion.DEG2RAD - grain;
    const cosine = Math.cos(turn);
    const sine = Math.sin(turn);
    const width = placement.mirror ? -placement.size.u : placement.size.u;
    const height = placement.size.v;
    // The two rows of `diag(1/tile) · R(turn) · diag(width, height)`: the map
    // from the piece's own unit UV onto the sheet's.
    const first = {
      x: (cosine * width) / props.tile.u,
      y: (-sine * height) / props.tile.u,
    };
    const second = {
      x: (sine * width) / props.tile.v,
      y: (cosine * height) / props.tile.v,
    };
    const across = Math.hypot(first.x, first.y);
    const down = Math.hypot(second.x, second.y);
    if (
      Math.abs(first.x * second.x + first.y * second.y) >
      SHEAR_EPSILON * across * down
    ) {
      sheared.push(placement.id);
      continue;
    }
    // Scaling and then rotating carries the second row to `ry · (sin, cos)`, so
    // the angle is read off that row and `ry` is its length. That leaves the
    // first row as `rx · (cos, -sin)`, whose signed length along the same
    // direction is the pair's determinant over `ry`, which is where a flipped
    // piece shows up as a negative scale.
    const angle = Math.atan2(second.x, second.y);
    const base =
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

/** Where a face point falls on a sheet turned by the grain, in turns. */
const sheetPoint = (
  point: IAutoMoviePatternPoint,
  origin: IAutoMoviePatternPoint,
  grain: number,
  tile: { u: number; v: number },
): { x: number; y: number } => {
  const cosine = Math.cos(grain);
  const sine = Math.sin(grain);
  const alongU = point.u - origin.u;
  const alongV = point.v - origin.v;
  return {
    x: (cosine * alongU + sine * alongV) / tile.u,
    y: (-sine * alongU + cosine * alongV) / tile.v,
  };
};

const finitePoint = (point: IAutoMoviePatternPoint, label: string): void => {
  if (!Number.isFinite(point.u) || !Number.isFinite(point.v))
    throw new Error(`${label} must be finite`);
};

const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};
