import type { IAutoMovieDrawScene } from "@automovie/render";

/*
 * Whether a subject reads its placed scene before each picture, so the
 * inspector must lift an inspection that changes the scene around the seek: a
 * subject that observes its placed scene (`inspectPlaced`), or one whose
 * render-target work (`beforeDraw`), such as surface feeds, draws the scene
 * with its own materials.
 */
export function readsAutoMovieInspectorPlacedScene(
  instance: Pick<IAutoMovieDrawScene, "inspectPlaced" | "beforeDraw">,
): boolean {
  return (
    instance.inspectPlaced !== undefined || instance.beforeDraw !== undefined
  );
}
