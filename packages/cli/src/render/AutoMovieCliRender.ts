import type { AutoMovieCliRenderTypes } from "./AutoMovieCliRenderTypes";
import { AUTOMOVIE_RENDER_OPTIONS } from "./internal/AUTOMOVIE_RENDER_OPTIONS";
import { readAutoMovieRenderOptions } from "./internal/readAutoMovieRenderOptions";
import { renderAutoMovie } from "./internal/renderAutoMovie";

/** Public operations for the `automovie render` command. */
export namespace AutoMovieCliRender {
  /** Command options admitted by `readOptions`. */
  export const OPTIONS: readonly string[] = AUTOMOVIE_RENDER_OPTIONS;

  /** Separate render-owned options from the remaining capture request. */
  export function readOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliRenderTypes.Options {
    return readAutoMovieRenderOptions(values);
  }

  /** Run `automovie render` in a production. */
  export function render(
    props: AutoMovieCliRenderTypes.RenderProps,
  ): Promise<number> {
    return renderAutoMovie(props);
  }
}
