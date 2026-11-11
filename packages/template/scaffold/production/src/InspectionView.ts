import type { IAutoMovieInspectionView } from "@automovie/render";

/**
 * One camera an inspection draws through, as `planInspectionViews` reads it from a view request.
 *
 * `id` names the view in file names, captions and records, and `text` is the request's own text for the view, which the record keeps beside the camera it resolved to.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer and what each member is for.
 * @evidence contracts/development/design.md#principled-representation The view itself is the renderer's parsed form, so every host resolves it by one rule; the production adds only a file-safe name and the text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parsed view is `@automovie/render`'s own type; the production adds the two members its files and records need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The film camera is a parsed view like any other, not an absent value, so a request for several views can include it.
 */
export interface InspectionView {
  /** File-safe name: `film`, `inspection` for a fixed camera, or the view's name followed by `-ortho`, `-focus` or `-flagged` for each switch. */
  id: string;

  /** The view's text as the request wrote it. */
  text: string;

  /** The parsed view. */
  view: IAutoMovieInspectionView;
}
