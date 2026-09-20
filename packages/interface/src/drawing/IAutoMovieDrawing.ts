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
 * The record is deterministic by construction. Page coordinates are rounded to
 * a fixed grid, every array is in a canonical order that does not depend on the
 * order the design happened to declare things in, and the digest covers the
 * whole of it — so the same design and the same view produce byte-identical
 * output on every machine and every run, which is what makes a drawing usable
 * as evidence at all.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawing` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawing` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawing {
  /**
   * Drawing format.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `version` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `version` for the interior space drawing schedule quantity system contract.
   */
  version: 1;

  /**
   * Versioned drawing protocol.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `protocol` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `protocol` for the interior space drawing schedule quantity system contract.
   */
  protocol: "automovie.drawing.v1";

  /**
   * View this drawing answers for.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `view` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `view` for the interior space drawing schedule quantity system contract.
   */
  view: string;

  /**
   * Cut and projection convention the view declared.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `projection` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `projection` for the interior space drawing schedule quantity system contract.
   */
  projection: AutoMovieDrawingProjection;

  /**
   * Discipline the view declared.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `discipline` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `discipline` for the interior space drawing schedule quantity system contract.
   */
  discipline: string;

  /**
   * Scale denominator the view declared.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `scale` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `scale` for the interior space drawing schedule quantity system contract.
   */
  scale: number;

  /**
   * Built environment this drawing was derived from.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `environment` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `environment` for the interior space drawing schedule quantity system contract.
   */
  environment: string;

  /**
   * Page basis the view resolved to.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `frame` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `frame` for the interior space drawing schedule quantity system contract.
   */
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
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `extent` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `extent` for the interior space drawing schedule quantity system contract.
   */
  extent: IAutoMovieDrawingExtent | null;

  /**
   * Drafted segments, in canonical order.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `lines` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `lines` for the interior space drawing schedule quantity system contract.
   */
  lines: IAutoMovieDrawingLine[];

  /**
   * Logical volume cross-sections, in canonical order; empty for an elevation.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `regions` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `regions` for the interior space drawing schedule quantity system contract.
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
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `openings` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `openings` for the interior space drawing schedule quantity system contract.
   */
  openings: IAutoMovieDrawingOpeningMark[];

  /**
   * Resolved dimensions, in the order the view authored them.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `dimensions` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `dimensions` for the interior space drawing schedule quantity system contract.
   */
  dimensions: IAutoMovieDrawingDimension[];

  /**
   * Resolved notes, in the order the view authored them.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `annotations` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `annotations` for the interior space drawing schedule quantity system contract.
   */
  annotations: IAutoMovieDrawingAnnotation[];

  /**
   * Derivations this drawing could not perform, in canonical order.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `gaps` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `gaps` for the interior space drawing schedule quantity system contract.
   */
  gaps: IAutoMovieDrawingGap[];

  /**
   * Digest over the whole record.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `digest` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `digest` for the interior space drawing schedule quantity system contract.
   */
  digest: AutoMovieContentDigest;
}
