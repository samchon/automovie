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
 * and the sum then passes through {@link transform}. The two axes must not be
 * parallel but need not be perpendicular, so skewed axes shear the mapping.
 * {@link up}, {@link north}, {@link level}, and {@link view} are validated but
 * never read by the mapping or by promotion.
 *
 * @evidence contracts/common.md#principled-implementation `designReferenceWorldPoint` spans normalized axes by settled-scale offsets around the anchor, adds origin, then applies optional scale/normalized rotation/translation. Frame admission requires finite axis X/Y computed lengths above 1e-12 and absolute normalized dot at most 1 - 1e-12, a finite in-sheet anchor and resolving chosen scale. These numeric predicates and finite source values do not prove finite world products/sums; promotion currently forwards mapped points without a separate finite-result gate.
 * @evidence contracts/common.md#clear-and-simple-design The frame owns every placement fact for its sheet and primitives own none, so correcting a scale, axis, or north is one edit here and never a rewrite of observed points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Axes retain authored skew instead of being orthogonalized and an unknown scale stays null. Up/north/level/view are informational to mapping/promotion. Single-page and measured-sheet width/height checks belong to production byte admission, not the engine frame gate; SVG viewBox origin and PDF/DXF page geometry are not reconstructed by those extent comparisons.
 * @evidence contracts/common.md#meaningful-documentation States the exact mapping formula and its order, that axes may be skewed, which members the mapping ignores, the units and ranges of the extent and anchor, the page rule for single-page containers, and the measured-sheet limit.
 * @author Samchon
 */
export interface IAutoMovieDesignSourceFrame {
  /** Stable, non-blank frame identity, unique within the document. */
  id: string;

  /**
   * One-based whole page or image index inside the asset; a PNG, JPEG, or SVG
   * reference carries exactly one page, so only `1` is accepted there.
   */
  page: number;

  /** Drawing family this frame shows. */
  view: "plan" | "section" | "elevation" | "detail" | "perspective";

  /** Non-blank storey or datum label this frame belongs to, or null. */
  level: string | null;

  /**
   * Source-space extent: pixels for raster, user units for vector.
   *
   * When the production gate can measure the sheet, neither side may exceed
   * the measured one; a PDF page or a DXF drawing is left unmeasured.
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
