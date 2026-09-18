import { AutoMovieDrawingOpeningBasis } from "./AutoMovieDrawingOpeningBasis";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One opening as the drawing can see it.
 *
 * The mark exists so a plan's openings and the 3D design's openings can be
 * compared by id rather than by eye: every opening the view covers appears
 * here, whether or not the design gave it a shape.
 *
 * {@link basis} says where the shape came from, and the three answers are not
 * interchangeable. `profile` is the opening's own void placed on its host
 * boundary's face — the design answering the question directly. `fill` is the
 * filling element's extent standing in for a void nobody authored, which is a
 * door's size and not the hole's. `none` is the design declining to answer, and
 * the mark then carries no geometry at all rather than a zero-sized one.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingOpeningMark` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingOpeningMark` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingOpeningMark {
  /**
   * Opening identity, matching the design's own opening id.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `opening` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `opening` for the interior space drawing schedule quantity system contract.
   */
  opening: string;

  /**
   * Boundary the opening is cut through.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `boundary` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `boundary` for the interior space drawing schedule quantity system contract.
   */
  boundary: string;

  /**
   * Opening kind, such as `door`, `window`, `arch` or `passage`.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `kind` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `kind` for the interior space drawing schedule quantity system contract.
   */
  kind: string;

  /**
   * Filling element id, or `null` for an open cut.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `fill` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `fill` for the interior space drawing schedule quantity system contract.
   */
  fill: string | null;

  /**
   * Where the geometry below came from.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `basis` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `basis` for the interior space drawing schedule quantity system contract.
   */
  basis: AutoMovieDrawingOpeningBasis;

  /**
   * The void's own outline projected onto the page, and empty for every other
   * basis.
   *
   * A `fill` mark carries a size and no outline on purpose: it measures the
   * leaf standing in the hole, and drafting that leaf's extent as the void's
   * shape would put a rectangle on the sheet the building has no hole for.
   *
   * Arc edges are drafted as chords at a fixed density, which is what vector
   * linework is; the dimensions below are computed from the arcs themselves and
   * never from these chords.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `polygon` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `polygon` for the interior space drawing schedule quantity system contract.
   */
  polygon: IAutoMovieDrawingPoint[];

  /**
   * Width in metres of whatever {@link basis} says was measured, or `null` when
   * it says `none`.
   *
   * A `profile` mark measures the void; a `fill` mark measures the leaf that
   * stands in one. Reading either as the other is the mistake {@link basis}
   * exists to prevent, so neither is called the void's size here.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `width` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `width` for the interior space drawing schedule quantity system contract.
   */
  width: number | null;

  /**
   * Height in metres of the same thing, or `null` when `basis` is `none`.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `height` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `height` for the interior space drawing schedule quantity system contract.
   */
  height: number | null;
}
