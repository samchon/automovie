import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieDesignScaleCandidate } from "./IAutoMovieDesignScaleCandidate";

/**
 * One page, sheet, or image of a design reference and how its own coordinates
 * are read as world coordinates.
 *
 * The frame owns the mapping, not the observation: a primitive is always
 * recorded in the source's own units, so a corrected scale or a corrected north
 * never rewrites what was seen. A frame whose {@link scale} is null has an
 * unsettled scale, and nothing read through it can become metric geometry.
 *
 * A source point `(x, y)` maps to `origin + unit(axisX) * (x - anchor.x) * s`
 * plus `unit(axisY) * (y - anchor.y) * s` for the settled metres per unit `s`,
 * and the sum then passes through {@link transform}. The two
 * axes must not be parallel but need not be perpendicular, so skewed axes
 * shear the mapping. {@link up}, {@link north}, {@link level}, and {@link view}
 * are validated but never read by the mapping or by promotion.
 *
 * @evidence contracts/common.md#principled-implementation An affine map from source units to world metres built from the anchor, the settled scale, normalized axes, and the origin, followed by the optional transform; validation refuses parallel axes but not skewed ones, which is an unresolved premise the mapping silently shears.
 * @evidence contracts/common.md#clear-and-simple-design The frame alone owns the mapping and the scale choice, so primitives stay in source units; bounds and anchor are source-space while axes, origin, up, and north are world-space.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null `scale` blocks promotion instead of defaulting to one metre per unit; axes are normalized rather than demanded unit length, and no drawing view changes the arithmetic.
 * @evidence contracts/common.md#meaningful-documentation States the mapping formula, page indexing and its single-page limit, source units of bounds, the anchor range, axis and origin meaning, null meanings, and which fields only record the drawing.
 * @author Samchon
 */
export interface IAutoMovieDesignSourceFrame {
  /** Stable frame identity within the document. */
  id: string;

  /**
   * One-based page or image index inside the asset; a PNG, JPEG, or SVG
   * reference carries exactly one page, so only `1` is accepted there.
   */
  page: number;

  /** Drawing family this frame shows. */
  view: "plan" | "section" | "elevation" | "detail" | "perspective";

  /** Storey or datum label this frame belongs to, or null. */
  level: string | null;

  /** Source-space extent: pixels for raster, user units for vector. */
  bounds: {
    /** Strictly positive width in source units. */
    width: number;

    /** Strictly positive height in source units. */
    height: number;
  };

  /** Source-space point that maps onto {@link origin}. */
  anchor: {
    /** Finite source-space x, inside `[0, bounds.width]`. */
    x: number;

    /** Finite source-space y, inside `[0, bounds.height]`. */
    y: number;
  };

  /**
   * Every scale reading recorded for this frame. Several may coexist; only the
   * one {@link scale} names is used.
   */
  scaleCandidates: IAutoMovieDesignScaleCandidate[];

  /** Chosen scale candidate id, or null while the scale is unknown. */
  scale: string | null;

  /** World direction the frame's own +x axis points along; non-zero. */
  axisX: IAutoMovieVector3;

  /** World direction the frame's own +y axis points along; non-zero. */
  axisY: IAutoMovieVector3;

  /** World position of {@link anchor}, in metres. */
  origin: IAutoMovieVector3;

  /** World direction the drawing calls up; non-zero. */
  up: IAutoMovieVector3;

  /** World direction the drawing calls north, or null when unmarked. */
  north: IAutoMovieVector3 | null;

  /**
   * Extra world placement applied after the axis mapping, or null: the mapped
   * point is scaled per axis, rotated by the normalized rotation, and then
   * translated, all about the world origin.
   */
  transform: IAutoMovieTransform | null;
}
