import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { AutoMovieDrawingProjection } from "./AutoMovieDrawingProjection";
import { IAutoMovieDrawingAnnotation } from "./IAutoMovieDrawingAnnotation";
import { IAutoMovieDrawingDimension } from "./IAutoMovieDrawingDimension";
import { IAutoMovieDrawingExtent } from "./IAutoMovieDrawingExtent";
import { IAutoMovieDrawingFrame } from "./IAutoMovieDrawingFrame";
import { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import { IAutoMovieDrawingLine } from "./IAutoMovieDrawingLine";
import { IAutoMovieDrawingOpeningMark } from "./IAutoMovieDrawingOpeningMark";
import { IAutoMovieDrawingRegion } from "./IAutoMovieDrawingRegion";

/**
 * One drawing, derived from one design at one revision.
 *
 * Every line, region, opening mark, dimension and note below was computed from
 * the built environment the view was applied to, which `deriveAutoMovieDrawing`
 * validates first and refuses when invalid. Nothing was drafted, and nothing
 * may be edited back into the design: a sheet cannot become a second source of
 * truth for the building it depicts.
 *
 * Page coordinates are world metres along the frame's axes, rounded to six
 * decimals; `scale` is applied only when `autoMovieDrawingToSvg` prints the
 * sheet. Lines, regions, openings and gaps are sorted into a canonical order
 * independent of the order the design declares things in, and dimensions and
 * notes keep the view's authored order, so the same design and view produce
 * the same record on every run.
 *
 * The digest is a SHA-256 over the canonical JSON of every other field, so two
 * records share a digest only when they are equal field by field, whatever
 * characters their authored text contains.
 *
 * @evidence contracts/common.md#principled-implementation The record is a pure function of design and view: geometry is projected through the resolved frame, every page scalar passes through `roundAutoMovieDrawingScalar` at six decimals with negative zero folded to zero, identical strokes are merged by key, and arrays are sorted with `compareAutoMovieRenderIds` before the digest is taken over the record's canonical JSON.
 * @evidence contracts/common.md#clear-and-simple-design One flat record per sheet with each kind of content in its own typed array, and the view's identity fields copied in, so the serializer and any checker read the drawing without the view except for its pen.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts What the derivation cannot compute is listed in `gaps` instead of being omitted, and the digest covers every field through canonical JSON, so no field or authored character escapes it.
 * @evidence contracts/common.md#meaningful-documentation States the provenance and one-way direction, the page units and rounding, where scale is applied, the ordering of every array, what the extent contains, why openings ignore the kind filter, and exactly what the digest covers.
 * @author Samchon
 */
export interface IAutoMovieDrawing {
  /** Record format version. */
  version: 1;

  /** Versioned drawing protocol. */
  protocol: "automovie.drawing.v1";

  /** Id of the view this drawing answers for. */
  view: string;

  /** Cut and projection convention the view declared. */
  projection: AutoMovieDrawingProjection;

  /** Open discipline label the view declared. */
  discipline: string;

  /**
   * Scale denominator the view declared (`50` means 1:50); page coordinates do
   * not include it.
   */
  scale: number;

  /** Id of the built environment this drawing was derived from. */
  environment: string;

  /** Page basis the view resolved to, rounded to six decimals. */
  frame: IAutoMovieDrawingFrame;

  /**
   * Page bounding box of everything the sheet draws, or `null` when it draws
   * nothing.
   *
   * It holds linework, region outlines, opening voids and every dimension and
   * note that resolved, because a dimension string sits beside the plan rather
   * than across it and a box sized from the geometry alone would put the
   * sheet's own annotation off the paper. A note contributes the point its text
   * is set from rather than the glyphs it sets, which the derivation cannot
   * measure without font metrics and declares as the `note-text-extent` gap.
   */
  extent: IAutoMovieDrawingExtent | null;

  /**
   * Drafted segments, sorted by role, layer, owner and then endpoints, with
   * identical strokes kept once.
   */
  lines: IAutoMovieDrawingLine[];

  /**
   * Cross-sections of cell-stated logical spaces, sorted by space and cell;
   * empty for an elevation, and a shell-stated space contributes none.
   */
  regions: IAutoMovieDrawingRegion[];

  /**
   * Every opening whose host boundary reaches a space this view covers, sorted
   * by opening id.
   *
   * The view's element-kind filter does not reach these. A mark is how a sheet
   * and the design are reconciled by id, so a lighting plan of a room still
   * answers for the room's doors; the kind filter decides which linework is
   * drafted, not which openings exist.
   */
  openings: IAutoMovieDrawingOpeningMark[];

  /** Resolved dimensions, in the order the view authored them. */
  dimensions: IAutoMovieDrawingDimension[];

  /** Resolved notes, in the order the view authored them. */
  annotations: IAutoMovieDrawingAnnotation[];

  /** Derivations this drawing could not perform, sorted by subject. */
  gaps: IAutoMovieDrawingGap[];

  /** SHA-256 digest over the canonical JSON of every other field. */
  digest: AutoMovieContentDigest;
}
