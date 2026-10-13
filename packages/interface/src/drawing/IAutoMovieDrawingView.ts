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
 * @author Samchon
 */
export interface IAutoMovieDrawingView {
  /** Stable view identity within the production. */
  id: string;

  /** Cut and projection convention this view follows. */
  projection: AutoMovieDrawingProjection;

  /**
   * Open discipline label such as `architectural`, `finish`, `ceiling`,
   * `furniture`, `lighting` or `mechanical`.
   *
   * Open rather than closed for the same reason element kinds are: a discipline
   * a catalogue never anticipated must be expressible as a filter over the same
   * design rather than as a new drawing type nobody can add.
   */
  discipline: string;

  /**
   * World point the cut plane passes through, and the page origin.
   *
   * For a `plan` only the height matters; for a `section` only the offset along
   * the view direction does. The remaining components move the page origin,
   * which is what lets two views of the same building share a coordinate
   * origin.
   */
  origin: IAutoMovieVector3;

  /**
   * Direction the view looks, from the viewer into the design. Must be
   * non-zero.
   *
   * A plan looks along `-Y`, a reflected ceiling plan along `+Y`, and an
   * elevation or section along any horizontal direction. Nothing forbids an
   * oblique direction: an axonometric-style projection is the same math.
   */
  direction: IAutoMovieVector3;

  /**
   * Page-up hint. Must be non-zero and not parallel to {@link direction}.
   *
   * The hint is re-orthogonalized against the view direction, so an author may
   * write the nearest cardinal axis rather than an exact in-plane vector. A
   * plan conventionally writes `-Z`, so world north runs up the page; an
   * elevation writes `+Y`.
   */
  up: IAutoMovieVector3;

  /**
   * Drawing scale denominator: `50` means 1:50. Must be finite and positive.
   */
  scale: number;

  /**
   * How far past the cut plane the view reaches, in metres, or `null` for no
   * bound.
   *
   * Geometry entirely beyond this depth is drawn `hidden` rather than dropped,
   * because a footing under a slab is a thing the drawing has to be able to say
   * quietly instead of not saying at all.
   */
  depth: number | null;

  /**
   * How far back toward the viewer overhead geometry is still drawn, in metres,
   * or `null` to draw none.
   *
   * Material the cut removed is not simply gone: a beam, a mezzanine edge or a
   * wall cabinet above the cut is drawn `overhead` within this band, which is
   * the dashed convention every floor plan uses.
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
   */
  elementKinds: string[];

  /** Dimensions this view draws, in the order it draws them. */
  dimensions: IAutoMovieDrawingDimensionSpec[];

  /** Notes this view draws, in the order it draws them. */
  annotations: IAutoMovieDrawingAnnotationSpec[];

  /** Pen weights, dash patterns and text height this view is drawn with. */
  style: IAutoMovieDrawingStyle;
}
