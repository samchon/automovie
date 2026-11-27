import type { IAutoMovieSectionPlane } from "../index.js";
import type { AutoMovieInspectionShade } from "./AutoMovieInspectionShade.js";
import type { IAutoMovieInspectionColorAssignment } from "./IAutoMovieInspectionColorAssignment.js";

/**
 * What one inspection picture shows of a scene: which objects and marks, under
 * which shade, which kinds of marks, which objects' travel, and where it is
 * cut.
 *
 * Every member has a value. The request `parseAutoMovieInspectionRequest`
 * returns when nothing is asked changes nothing: every object, the `beauty`
 * shade, no marks and no cut.
 */
export interface IAutoMovieInspectionRequest {
  /**
   * Path patterns of the objects and marks to draw, read by
   * `matchAutoMovieInspectionPath`. Empty draws every object and every mark of
   * the asked kinds.
   */
  parts: string[];

  /**
   * Path patterns of the objects and marks to leave out, applied after `parts`.
   * A mark whose anchor object is left out is left out too.
   */
  hide: string[];

  /** How surfaces are coloured. */
  shade: AutoMovieInspectionShade;

  /** Whether surfaces are drawn. False leaves the marks alone in the picture. */
  surface: boolean;

  /**
   * Kind patterns of the marks to draw, read by `matchAutoMovieInspectionPath`
   * against each mark's kind, such as `curve/section`, `defect` or `**`. Empty
   * draws no mark.
   */
  marks: string[];

  /**
   * Aspect above which a triangle is a sliver: its longest edge over the height
   * standing on that edge. The `defect/sliver` kind exists only while it is
   * set. Null measures no sliver.
   */
  sliver: number | null;

  /**
   * World-space half-space cut away from every drawn object, or null for no
   * cut.
   */
  section: IAutoMovieSectionPlane | null;

  /** Whether marks are drawn over the surfaces that would hide them. */
  xray: boolean;

  /**
   * Width of mark lines in output pixels, in every renderer. A point is drawn
   * three widths across.
   */
  stroke: number;

  /**
   * Path patterns of the drawn objects and marks to label with their names.
   * Empty labels nothing.
   */
  label: string[];

  /**
   * Colours for one picture: each matched drawn object is shaded in its colour,
   * under the `beauty` and `clay` shades only, and each matched mark kind is
   * drawn in it instead of its default. A later entry wins over an earlier
   * one.
   */
  color: IAutoMovieInspectionColorAssignment[];

  /**
   * Path patterns of the objects whose travel is drawn as a trail, sampled by
   * `AutoMovieRenderInspection.sampleTrails` and drawn by
   * `AutoMovieRenderInspection.markTrails` as the `trail` and `trail/now` kinds, which
   * `marks` must also ask for. Empty samples none.
   */
  trail: string[];

  /**
   * Seconds sampled before and after the drawn second for a trail, a positive
   * duration; `AutoMovieRenderInspection.planTrailTimes` clips the window to the
   * subject's running time.
   */
  reach: number;

  /**
   * Trail samples per second, positive: one tick per sample, on a grid through
   * the drawn second.
   */
  ticks: number;
}
