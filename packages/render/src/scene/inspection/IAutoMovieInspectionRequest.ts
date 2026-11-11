import type { IAutoMovieSectionPlane } from "@automovie/engine";
import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * What one inspection picture shows of a scene: which objects and marks, under which shade, which kinds of marks, and where it is cut.
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
}
export namespace IAutoMovieInspectionRequest {
  /**
   * A surface colouring: one of the guide passes, or one of the two inspection shades.
   *
   * `clay` replaces every material with one grey lit by the scene's lights, so form reads without colour. A scene without lights draws black in WebGL, and under the CPU rasterizer's own headlight in a Node still. `faces` draws each surface in one unlit colour by the side seen, so a flipped or open surface shows its back.
   *
   * Under `pose` the picture is the skeleton of the whole scene: a bone is not a drawn object and has no path, so `parts` and `hide` do not narrow it.
   *
   * @evidence contracts/development/design.md#principled-representation The guide passes keep the names the interface gives them, and the two shades that exist only for inspection extend that union instead of renaming any of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union serves the page and the command; the guide pass list stays owned by the interface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ordinary render is the `beauty` member of the same union, not an absent value with a second meaning.
   * @evidence contracts/development/common.md#meaningful-documentation States what each inspection shade replaces, what lights it and what it reveals, and that the pose pass is not narrowed by a selection.
   */
  export type Shade = AutoMovieGuidePass | "clay" | "faces";
}
