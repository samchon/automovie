import type { IAutoMovieSectionPlane } from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * What one inspection picture shows of a scene: which objects and marks, under which shade, which kinds of marks, which objects' travel, and where it is cut.
 *
 * Every member has a value. The request `parseAutoMovieInspectionRequest` returns when nothing is asked changes nothing: every object, the `beauty` shade, no marks and no cut.
 *
 * @evidence contracts/development/design.md#principled-representation One record per picture separates the independent questions an inspection asks, selection, shade, marks and cut, so any combination is one value and the page and the command draw the same request.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Planes and passes are the engine's and the interface's own types; the renderer adds the selection patterns, the kind patterns, the two inspection shades, the sliver limit and the stroke width. Kinds are patterns, not a list of known kinds, because producers own them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a subject, a part or a kind of finding, and the sliver limit has no built-in value: a triangle is a sliver only against the aspect the caller states.
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it selects or draws, its unit where it has one and what its empty value means.
 */
export interface IAutoMovieInspectionRequest {
  /**
   * Path patterns of the objects and marks to draw, read by `matchAutoMovieInspectionPath`. Empty draws every object and every mark of the asked kinds.
   */
  parts: string[];

  /**
   * Path patterns of the objects and marks to leave out, applied after `parts`. A mark whose anchor object is left out is left out too.
   */
  hide: string[];

  /**
   * How surfaces are coloured.
   */
  shade: IAutoMovieInspectionRequest.Shade;

  /**
   * Whether surfaces are drawn. False leaves the marks alone in the picture.
   */
  surface: boolean;

  /**
   * Kind patterns of the marks to draw, read by `matchAutoMovieInspectionPath` against each mark's kind, such as `curve/section`, `defect` or `**`. Empty draws no mark.
   */
  marks: string[];

  /**
   * Aspect above which a triangle is a sliver: its longest edge over the height standing on that edge. The `defect/sliver` kind exists only while it is set. Null measures no sliver.
   */
  sliver: number | null;

  /**
   * World-space half-space cut away from every drawn object, or null for no cut.
   */
  section: IAutoMovieSectionPlane | null;

  /**
   * Whether marks are drawn over the surfaces that would hide them.
   */
  xray: boolean;

  /**
   * Width of mark lines in output pixels, in every renderer. A point is drawn three widths across.
   */
  stroke: number;

  /**
   * Path patterns of the drawn objects and marks to label with their names. Empty labels nothing.
   */
  label: string[];

  /**
   * Colours for one picture: each matched drawn object is shaded in its colour, under the `beauty` and `clay` shades only, and each matched mark kind is drawn in it instead of its default. A later entry wins over an earlier one.
   */
  color: IAutoMovieInspectionRequest.IColor[];

  /**
   * Path patterns of the objects whose travel is drawn as a trail, sampled by `sampleAutoMovieInspectionTrails` and drawn by `markAutoMovieInspectionTrails` as the `trail` and `trail/now` kinds, which `marks` must also ask for. Empty samples none.
   */
  trail: string[];

  /**
   * Seconds sampled before and after the drawn second for a trail, a positive duration; `planAutoMovieInspectionTrailTimes` clips the window to the subject's running time.
   */
  reach: number;

  /**
   * Trail samples per second, positive: one tick per sample, on a grid through the drawn second.
   */
  ticks: number;
}
export namespace IAutoMovieInspectionRequest {
  /**
   * A surface colouring: one of the guide passes, or one of the two inspection shades.
   *
   * `clay` replaces every material with one grey lit by the scene's lights, so form reads without colour. A scene without lights draws it black. `faces` draws each surface in one unlit colour by the side seen, so a flipped or open surface shows its back.
   *
   * Under `pose` the picture is the skeleton of the whole scene: a bone is not a drawn object and has no path, so `parts` and `hide` do not narrow it.
   *
   * @evidence contracts/development/design.md#principled-representation The guide passes keep the names the interface gives them, and the two shades that exist only for inspection extend that union instead of renaming any of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union serves the page and the command; the guide pass list stays owned by the interface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ordinary render is the `beauty` member of the same union, not an absent value with a second meaning.
   * @evidence contracts/development/common.md#meaningful-documentation States what each inspection shade replaces, what lights it and what it reveals, and that the pose pass is not narrowed by a selection.
   */
  export type Shade = AutoMovieGuidePass | "clay" | "faces";

  /**
   * One colour assignment of a request: a pattern and the colour what it matches takes.
   *
   * @evidence contracts/development/design.md#principled-representation A pattern under the path grammar and an sRGB hex integer; the pattern is matched against object paths and mark kinds alike, because the request names both by one grammar.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by `applyAutoMovieInspection` and written by the request formatter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member says whether the pattern means an object or a kind; a pattern that matches neither is refused where the request is applied.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member is and how the pattern is matched.
   */
  export interface IColor {
    /** Path pattern of the objects or mark kinds to colour. */
    pattern: string;

    /** The colour, sRGB hex. */
    color: number;
  }
}
