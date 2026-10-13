import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieDrawingProjection } from "./AutoMovieDrawingProjection";
import { IAutoMovieDrawingAnnotationSpec } from "./IAutoMovieDrawingAnnotationSpec";
import { IAutoMovieDrawingDimensionSpec } from "./IAutoMovieDrawingDimensionSpec";
import { IAutoMovieDrawingStyle } from "./IAutoMovieDrawingStyle";

/**
 * How one drawing is taken from one design.
 *
 * A view is a question asked of the design, never a second copy of it: it
 * states a cut plane, a direction, a scale, filters and a pen, and every line,
 * area and mark in the resulting drawing is derived from the built environment
 * it is applied to, so a sheet cannot disagree with the model. A derived drawing
 * is output the design produces, the opposite direction from an
 * {@link IAutoMovieDesignReference}, which is evidence the design cites; neither
 * is read back as the other.
 *
 * `deriveAutoMovieDrawing` validates the design first and throws for an
 * invalid one. It then throws before drafting when `origin`, `direction` or
 * `up` is not finite, when `direction` or `up` is zero or the two are
 * parallel, when `scale` is not a finite positive number, or when `depth` or
 * `overhead` is negative or not finite.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingFrame` resolves an orthonormal page basis from the view, with normal `-direction`, right `up x normal` and up re-orthogonalized as `normal x right`, negating right for a reflected ceiling plan; the drafter classifies geometry by signed distance to the plane through `origin` against `depth` and `overhead`, and filters by `spaces` and `elementKinds`.
 * @evidence contracts/common.md#clear-and-simple-design The view holds only the parameters of the question and no geometry of its own, and the pen sits in a nested style the serializer alone reads, so derivation and presentation stay separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown filter space is reported as the `view-space-filter` gap instead of yielding a silently blank sheet, invalid placement throws instead of being repaired, and a discipline label never changes what is drawn.
 * @evidence contracts/common.md#meaningful-documentation States that the view holds no geometry, its relation to design references, and every refusal; members give units, axis conventions, which origin components matter per projection, the null meanings of `depth` and `overhead`, how each filter selects and what it leaves alone, and draw order.
 * @author Samchon
 */
export interface IAutoMovieDrawingView {
  /** Stable view identity within the production; the drawing repeats it. */
  id: string;

  /** Cut and projection convention this view follows. */
  projection: AutoMovieDrawingProjection;

  /**
   * Open discipline label, such as `architectural`, `finish`, `ceiling`,
   * `furniture`, `lighting` or `mechanical`.
   *
   * The label is copied onto the drawing and selects nothing; a discipline
   * view selects its content through {@link elementKinds} and {@link spaces}.
   */
  discipline: string;

  /**
   * World point the cut plane passes through, and the page origin, in metres.
   *
   * For a `plan` only the height decides the cut, and for a `section` only the
   * offset along the view direction does. The remaining components move the
   * page origin, which lets two views of one building share page coordinates.
   */
  origin: IAutoMovieVector3;

  /**
   * Direction the view looks, from the viewer into the design; finite and
   * non-zero, with any length.
   *
   * A plan looks along `-Y`, a reflected ceiling plan along `+Y`, and an
   * elevation or section along a horizontal direction. An oblique direction
   * is accepted and drafted with the same orthographic projection.
   */
  direction: IAutoMovieVector3;

  /**
   * Page-up hint; finite, non-zero and not parallel to {@link direction}.
   *
   * The hint is re-orthogonalized against the view direction, so an author may
   * write the nearest cardinal axis rather than an exact in-plane vector. A
   * plan that writes `-Z` puts world `-Z` up the page and world `+X` to the
   * right; an elevation writes `+Y`.
   */
  up: IAutoMovieVector3;

  /**
   * Drawing scale denominator, so `50` means 1:50; finite and positive.
   *
   * Derived coordinates stay in model metres whatever the scale; only the SVG
   * serializer applies it, at `1000 / scale` page millimetres per metre.
   */
  scale: number;

  /**
   * How far past the cut plane the view reaches, in metres, or `null` for no
   * bound; finite and not negative.
   *
   * An element lying wholly deeper than this is drawn `hidden` rather than
   * dropped, so a footing under a slab is still stated.
   */
  depth: number | null;

  /**
   * How far toward the viewer geometry the cut removed is still drawn, in
   * metres, or `null` to draw none of it; finite and not negative.
   *
   * An element wholly on the viewer's side whose closest corner to the plane
   * lies within this band is drawn `overhead`, the dashed convention floor
   * plans use for beams and wall cabinets above the cut. An `elevation` cuts
   * nothing and ignores the band.
   */
  overhead: number | null;

  /**
   * Logical spaces this view is restricted to, descendants included; empty
   * includes every space.
   *
   * Lines, regions and opening marks outside every included space are left
   * out, and an element bound to no space is left out of a filtered view. A
   * boundary that draws its own face is kept when any space it separates is
   * included, and an opening is kept when its host boundary touches one, so a
   * party wall and its door appear on both rooms' sheets.
   *
   * An id the design does not declare selects nothing and is reported once as
   * the `view-space-filter` gap.
   */
  spaces: string[];

  /**
   * Element kinds this view draws; empty draws every kind. A boundary that
   * draws its own face is matched by its boundary kind.
   *
   * The filter decides linework only. Regions and opening marks are bounded by
   * {@link spaces} alone, so a lighting plan of a room still answers for that
   * room's doors. A kind that matches nothing yields an empty sheet without a
   * gap, because kinds are an open vocabulary.
   */
  elementKinds: string[];

  /** Dimensions this view draws, in the order it draws them. */
  dimensions: IAutoMovieDrawingDimensionSpec[];

  /** Notes this view draws, in the order it draws them. */
  annotations: IAutoMovieDrawingAnnotationSpec[];

  /** Pen weights, dash patterns and text height the SVG serializer applies. */
  style: IAutoMovieDrawingStyle;
}
