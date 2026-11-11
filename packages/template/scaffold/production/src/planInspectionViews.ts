import {
  type IAutoMovieInspectionView,
  type IAutoMovieViewerViewpoint,
  autoMovieViewerNamedViewpoints,
  parseAutoMovieInspectionView,
} from "@automovie/render";

import type { InspectionView } from "./InspectionView";

/**
 * Read a view request, the text of the Viewer's `view` parameter and of the capture command's `--view` option, into the views it asks for.
 *
 * An absent request is the film camera alone. Text holding a colon is one fixed camera, `x,y,z:tx,ty,tz` in world metres. Any other text is a comma-separated list of views, each read by the renderer's `parseAutoMovieInspectionView`: `film`, a key of the production's `IFilmProduction.views` given in `presets`, or a named viewpoint such as `front` or `three-quarter`, the last optionally followed by `@ortho`, `@focus=<pattern>` or `@flagged`. A production's view wins a name over a named viewpoint.
 *
 * It throws for text the renderer's parser refuses, for a name that is neither a production view nor a named viewpoint, listing every name the production accepts, and for two views of one file name.
 *
 * ```ts
 * planInspectionViews("front@ortho,right,film", Object.keys(production.views ?? {}));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two callers, the forms, where each view is read, the precedence and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation One reader serves the page and the command, and each view's text is read by the renderer's parser, so the same text names the same view in every host; names are checked here so a request is refused before a film is mounted.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The absent case, then one parse per listed view and one name check; resolving a camera belongs to `placeInspectionView`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Named viewpoints come from the renderer's own list, and unreadable text throws instead of falling back to the film camera.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the request's length.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Parsing is the renderer's.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain records and keeps nothing.
 */
export function planInspectionViews(
  text: string | null | undefined,
  presets: readonly string[],
): InspectionView[] {
  if (text === null || text === undefined)
    return [{ id: "film", text: "film", view: { type: "film" } }];

  const named: string[] = autoMovieViewerNamedViewpoints().map(
    (viewpoint: IAutoMovieViewerViewpoint): string => viewpoint.id,
  );
  const texts: string[] = text.includes(":")
    ? [text]
    : text.split(",").map((item: string): string => item.trim());
  const views: InspectionView[] = texts.map((item: string): InspectionView => {
    const view: IAutoMovieInspectionView = parseAutoMovieInspectionView(item);
    if (view.type === "film") return { id: "film", text: item, view };
    if (view.type === "fixed") return { id: "inspection", text: item, view };
    if (!presets.includes(view.name) && !named.includes(view.name))
      throw new Error(
        `View "${item}" names none of ${[...new Set([...presets, "film", ...named])].join(", ")}, nor x,y,z:tx,ty,tz in metres`,
      );
    return {
      id:
        view.name +
        (view.orthographic ? "-ortho" : "") +
        (view.focus === null ? "" : view.focus.type === "flagged" ? "-flagged" : "-focus"),
      text: item,
      view,
    };
  });
  const ids: string[] = views.map((view: InspectionView): string => view.id);
  if (new Set(ids).size !== ids.length)
    throw new Error(`View request "${text}" names one view twice`);
  return views;
}
