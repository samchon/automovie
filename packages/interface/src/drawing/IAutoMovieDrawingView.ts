import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieDrawingProjection } from "./AutoMovieDrawingProjection";
import { IAutoMovieDrawingAnnotationSpec } from "./IAutoMovieDrawingAnnotationSpec";
import { IAutoMovieDrawingDimensionSpec } from "./IAutoMovieDrawingDimensionSpec";
import { IAutoMovieDrawingStyle } from "./IAutoMovieDrawingStyle";

/**
 * How one drawing is taken from one design.
 *
 * This record is a **question asked of the design**, never a second copy of it.
 * Nothing here holds geometry, dimensions or names of its own: a view states a
 * cut plane, a direction, a scale, a filter and a pen, and every line, area and
 * quantity in the resulting drawing is derived from the built environment the
 * view is applied to. That is the whole reason drawings live in this package
 * instead of being drafted beside the model — a hand-drafted sheet and a 3D
 * design disagree the moment either one moves, and a view cannot disagree with
 * the thing it is a projection of.
 *
 * It is also the opposite direction of travel from
 * {@link IAutoMovieDesignReference}. An observed plan image is evidence the
 * design cites; a derived drawing is output the design produces. Neither may be
 * read back as the other, and a drawing never becomes a source of truth.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `IAutoMovieDrawingView` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `IAutoMovieDrawingView` for the interior space drawing schedule quantity system contract.
 * @author Samchon
 */
export interface IAutoMovieDrawingView {
  /**
   * Stable view identity within the production.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `id` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `id` for the interior space drawing schedule quantity system contract.
   */
  id: string;

  /**
   * Cut and projection convention this view follows.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `projection` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `projection` for the interior space drawing schedule quantity system contract.
   */
  projection: AutoMovieDrawingProjection;

  /**
   * Open discipline label such as `architectural`, `finish`, `ceiling`,
   * `furniture`, `lighting` or `mechanical`.
   *
   * Open rather than closed for the same reason element kinds are: a discipline
   * a catalogue never anticipated must be expressible as a filter over the same
   * design rather than as a new drawing type nobody can add.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `discipline` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `discipline` for the interior space drawing schedule quantity system contract.
   */
  discipline: string;

  /**
   * World point the cut plane passes through, and the page origin.
   *
   * For a `plan` only the height matters; for a `section` only the offset along
   * the view direction does. The remaining components move the page origin,
   * which is what lets two views of the same building share a coordinate
   * origin.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `origin` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `origin` for the interior space drawing schedule quantity system contract.
   */
  origin: IAutoMovieVector3;

  /**
   * Direction the view looks, from the viewer into the design. Must be
   * non-zero.
   *
   * A plan looks along `-Y`, a reflected ceiling plan along `+Y`, and an
   * elevation or section along any horizontal direction. Nothing forbids an
   * oblique direction: an axonometric-style projection is the same math.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `direction` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `direction` for the interior space drawing schedule quantity system contract.
   */
  direction: IAutoMovieVector3;

  /**
   * Page-up hint. Must be non-zero and not parallel to {@link direction}.
   *
   * The hint is re-orthogonalized against the view direction, so an author may
   * write the nearest cardinal axis rather than an exact in-plane vector. A
   * plan conventionally writes `-Z`, so world north runs up the page; an
   * elevation writes `+Y`.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `up` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `up` for the interior space drawing schedule quantity system contract.
   */
  up: IAutoMovieVector3;

  /**
   * Drawing scale denominator: `50` means 1:50. Must be finite and positive.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `scale` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `scale` for the interior space drawing schedule quantity system contract.
   */
  scale: number;

  /**
   * How far past the cut plane the view reaches, in metres, or `null` for no
   * bound.
   *
   * Geometry entirely beyond this depth is drawn `hidden` rather than dropped,
   * because a footing under a slab is a thing the drawing has to be able to say
   * quietly instead of not saying at all.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `depth` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `depth` for the interior space drawing schedule quantity system contract.
   */
  depth: number | null;

  /**
   * How far back toward the viewer overhead geometry is still drawn, in metres,
   * or `null` to draw none.
   *
   * Material the cut removed is not simply gone: a beam, a mezzanine edge or a
   * wall cabinet above the cut is drawn `overhead` within this band, which is
   * the dashed convention every floor plan uses.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `overhead` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `overhead` for the interior space drawing schedule quantity system contract.
   */
  overhead: number | null;

  /**
   * Logical spaces this view is restricted to, descendants included. Empty
   * includes every space.
   *
   * An element outside every listed space is dropped. A separation is kept when
   * either of the spaces it divides is listed, because a party wall belongs to
   * both of the rooms on its sides and neither sheet may lose it to the order
   * the design happened to name them in.
   *
   * A name the design does not declare selects nothing and is reported as a
   * gap. A filter is a reference into the design's own space graph, so a
   * dangling one is a mistake rather than a narrow sheet, and a drawing says so
   * instead of coming back blank.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `spaces` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `spaces` for the interior space drawing schedule quantity system contract.
   */
  spaces: string[];

  /**
   * Element kinds this view draws. Empty draws every kind.
   *
   * This is what makes a discipline view a filter rather than a separate model:
   * a mechanical view lists the kinds its discipline owns and gets the same
   * geometry kernel every other view uses.
   *
   * It decides linework and nothing else. A view's opening marks are bounded by
   * {@link spaces} alone, so a lighting plan of a room still answers for that
   * room's doors instead of reporting a room with none.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `elementKinds` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `elementKinds` for the interior space drawing schedule quantity system contract.
   */
  elementKinds: string[];

  /**
   * Dimensions this view draws, in the order it draws them.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `dimensions` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `dimensions` for the interior space drawing schedule quantity system contract.
   */
  dimensions: IAutoMovieDrawingDimensionSpec[];

  /**
   * Notes this view draws, in the order it draws them.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `annotations` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `annotations` for the interior space drawing schedule quantity system contract.
   */
  annotations: IAutoMovieDrawingAnnotationSpec[];

  /**
   * Pen weights, dash patterns and text height this view is drawn with.
   *
   * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `style` as the portable data boundary for the interior drawing views requirement.
   * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `style` for the interior space drawing schedule quantity system contract.
   */
  style: IAutoMovieDrawingStyle;
}
