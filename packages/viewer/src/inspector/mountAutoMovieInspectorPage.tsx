import type { IAutoMovieDrawSubject } from "@automovie/render";
import { StrictMode } from "react";
import { type Root, createRoot } from "react-dom/client";

import { AutoMovieInspector } from "./AutoMovieInspector.js";
import type { IAutoMovieInspectorProps } from "./IAutoMovieInspectorProps.js";
import { createAutoMovieInspectorAddressWriter } from "./createAutoMovieInspectorAddressWriter.js";

/**
 * Mount the inspector as a whole page in one call: render `AutoMovieInspector` into `root` under StrictMode, opening on the request `location`'s query names and keeping that query equal to the request through `history`.
 *
 * `location` and `history` are the host's, passed in rather than read from `window`, so the page's address is the only global state the inspector writes and a host decides which. The returned `unmount` disposes the scene and its renderer through the component's effect cleanup.
 *
 * A host that can reproduce its subjects in a terminal also supplies `captureCommand`.
 *
 * ```ts
 * mountAutoMovieInspectorPage({ root: document.getElementById("root")!, subjects, location, history });
 * ```
 */
export function mountAutoMovieInspectorPage(props: {
  /** The element the page renders into. */
  root: Element;

  /** The subjects offered by name; create the record once, since each subject's identity keys the canvas mount. */
  subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;

  /** The page's location: its query is the first request, and its path and fragment are kept. */
  location: Pick<Location, "pathname" | "search" | "hash">;

  /** The page's history, whose current entry follows the request. */
  history: Pick<History, "replaceState" | "state">;

  /** Executable and fixed capture arguments from the host, when available. */
  captureCommand?: IAutoMovieInspectorProps["captureCommand"];
}): {
  /** Unmount the page and release everything it holds. */
  unmount: () => void;
} {
  const onRequestChange: (text: string) => void =
    createAutoMovieInspectorAddressWriter({
      location: props.location,
      history: props.history,
    });
  const root: Root = createRoot(props.root);
  root.render(
    <StrictMode>
      <AutoMovieInspector
        subjects={props.subjects}
        initialText={props.location.search}
        onRequestChange={onRequestChange}
        captureCommand={props.captureCommand}
      />
    </StrictMode>,
  );
  return { unmount: (): void => root.unmount() };
}
