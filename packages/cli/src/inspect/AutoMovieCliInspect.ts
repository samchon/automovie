import type { AutoMovieCliInspectTypes } from "./AutoMovieCliInspectTypes";
import { formatAutoMovieInspectUrl } from "./internal/formatAutoMovieInspectUrl";
import { inspectAutoMovie } from "./internal/inspectAutoMovie";
import { readAutoMovieInspectHostOptions } from "./internal/readAutoMovieInspectHostOptions";
import { serveAutoMovieInspectorPage } from "./internal/serveAutoMovieInspectorPage";
import { AUTOMOVIE_INSPECT_OPTIONS } from "./internal/AUTOMOVIE_INSPECT_OPTIONS";

/** Public operations for the `automovie inspect` command and Inspector page. */
export namespace AutoMovieCliInspect {
  /** Command options admitted by `readHostOptions`. */
  export const OPTIONS: readonly string[] = AUTOMOVIE_INSPECT_OPTIONS;

  /** Separate Inspector host options from the page's request options. */
  export function readHostOptions(
    values: ReadonlyMap<string, string>,
  ): AutoMovieCliInspectTypes.HostOptions {
    return readAutoMovieInspectHostOptions(values);
  }

  /** Format request values as the Inspector URL's query in their given order. */
  export function formatUrl(
    base: string,
    values: readonly AutoMovieCliInspectTypes.QueryPair[],
  ): string {
    return formatAutoMovieInspectUrl(base, values);
  }

  /** Run `automovie inspect`, printing its URL and serving until interrupted. */
  export function inspect(
    props: AutoMovieCliInspectTypes.InspectProps,
  ): Promise<number> {
    return inspectAutoMovie(props);
  }

  /** Start the Inspector page and return its address and cleanup operation. */
  export function servePage(
    props: AutoMovieCliInspectTypes.ServePageProps,
  ): Promise<AutoMovieCliInspectTypes.ServedPage> {
    return serveAutoMovieInspectorPage(props);
  }
}
