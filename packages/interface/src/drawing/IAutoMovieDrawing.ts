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
 * the built environment the view was applied to. Nothing was drafted, and
 * nothing may be edited back into the design: the arrow points one way, from
 * design to drawing, so a sheet cannot become a second source of truth for the
 * building it depicts.
 *
 * The record is deterministic by construction. Page coordinates are world
 * metres along the frame's axes, rounded to six decimals; `scale` is applied
 * only when a serializer prints the sheet. Every array is in a canonical order
 * that does not depend on the order the design happened to declare things in,
 * so the same design and the same view produce byte-identical output on every
 * machine and every run, which is what makes a drawing usable as evidence at
 * all.
 *
 * The digest is a SHA-256 over a canonical text of the record. That text omits
 * `version` and every dimension's `from` and `to` points, and it joins fields
 * with unescaped `|` and newline separators, so authored text containing them
 * can make two different records hash alike.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawing {
  /** Drawing format. */
  version: 1;

  /** Versioned drawing protocol. */
  protocol: "automovie.drawing.v1";

  /** View this drawing answers for. */
  view: string;

  /** Cut and projection convention the view declared. */
  projection: AutoMovieDrawingProjection;

  /** Discipline the view declared. */
  discipline: string;

  /**
   * Scale denominator the view declared (`50` means 1:50); page coordinates do
   * not include it.
   */
  scale: number;

  /** Built environment this drawing was derived from. */
  environment: string;

  /** Page basis the view resolved to. */
  frame: IAutoMovieDrawingFrame;

  /**
   * Page bounding box of everything the sheet draws, or `null` when it draws
   * nothing.
   *
   * Linework, region outlines, opening voids and every dimension and note that
   * resolved. The annotation is inside the box on purpose: a dimension string
   * sits beside the plan rather than across it, and a page sized from the
   * geometry alone would put the sheet's own annotation off the paper.
   *
   * A note contributes the point its text is set from rather than the glyphs it
   * sets, which the derivation cannot measure without font metrics and declares
   * as a gap instead of pretending to.
   */
  extent: IAutoMovieDrawingExtent | null;

  /**
   * Drafted segments, sorted by role, layer, owner and then endpoints, with
   * identical strokes kept once.
   */
  lines: IAutoMovieDrawingLine[];

  /**
   * Logical volume cross-sections, in canonical order; empty for an elevation.
   */
  regions: IAutoMovieDrawingRegion[];

  /**
   * Every opening whose host boundary reaches a space this view covers, in
   * canonical order.
   *
   * The view's element-kind filter deliberately does not reach these. A mark is
   * how a sheet and the design are reconciled by id, so a lighting plan of a
   * room still answers for the room's doors rather than reporting a room with
   * none; what the kind filter decides is which linework is drafted, not which
   * openings exist.
   */
  openings: IAutoMovieDrawingOpeningMark[];

  /** Resolved dimensions, in the order the view authored them. */
  dimensions: IAutoMovieDrawingDimension[];

  /** Resolved notes, in the order the view authored them. */
  annotations: IAutoMovieDrawingAnnotation[];

  /** Derivations this drawing could not perform, sorted by subject. */
  gaps: IAutoMovieDrawingGap[];

  /** SHA-256 digest over the canonical text described above. */
  digest: AutoMovieContentDigest;
}
