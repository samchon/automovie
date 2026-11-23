import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieDesignScaleCandidate } from "./IAutoMovieDesignScaleCandidate";

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
 * and the sum then passes through {@link transform}. The two axes must not be
 * parallel but need not be perpendicular, so skewed axes shear the mapping.
 * {@link up}, {@link north}, {@link level}, and {@link view} are validated but
 * never read by the mapping or by promotion.
 */
export interface IAutoMovieDesignSourceFrame {
  /** Stable, non-blank frame identity, unique within the document. */
  id: string;

  /**
   * One-based whole page or image index inside the asset. PNG, JPEG and SVG are
   * intended to use page one; the Engine frame check alone does not enforce
   * container-specific page population.
   */
  page: number;

  /** Drawing family this frame shows. */
  view: "plan" | "section" | "elevation" | "detail" | "perspective";

  /** Non-blank storey or datum label this frame belongs to, or null. */
  level: string | null;

  /**
   * Source-space extent: pixels for raster, user units for vector.
   *
   * The host must compare these dimensions with the actual sheet where
   * measurement is available; this record and the Engine frame check do not
   * inspect its bytes.
   */
  bounds: {
    /** Finite, strictly positive width in source units. */
    width: number;

    /** Finite, strictly positive height in source units. */
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

  /**
   * World direction the frame's own +y axis points along; non-zero and not
   * parallel to {@link axisX}.
   */
  axisY: IAutoMovieVector3;

  /** Finite world position of {@link anchor}, in metres. */
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
