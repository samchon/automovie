import type { IAutoMovieDrawSubject } from "@automovie/render";
import { StrictMode } from "react";
import { type Root, createRoot } from "react-dom/client";

import { AutoMovieInspector } from "./AutoMovieInspector.js";
import { createAutoMovieInspectorAddressWriter } from "./createAutoMovieInspectorAddressWriter.js";

/**
 * Mount the inspector as a whole page in one call: render `AutoMovieInspector` into `root` under StrictMode, opening on the request `location`'s query names and keeping that query equal to the request through `history`.
 *
 * `location` and `history` are the host's, passed in rather than read from `window`, so the page's address is the only global state the inspector writes and a host decides which. The returned `unmount` disposes the scene and its renderer through the component's effect cleanup.
 *
 * ```ts
 * mountAutoMovieInspectorPage({ root: document.getElementById("root")!, subjects, location, history });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is rendered, where the first request comes from, how the address follows it, that nothing global is read, and what `unmount` releases.
 * @evidence contracts/development/implementation.md#principled-implementation `createRoot` is React 19's client entry, and StrictMode runs the canvas effect twice in development, which the scene mount is built to survive, so a page always exercises that path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three steps: build the address writer, create the root, render the component with the address's query.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No subject, request or address is chosen here; they are the host's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work beyond React's own render.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A page is mounted once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The React root owns the component tree until `unmount`, which unmounts it and so releases the scene, renderer and frame loop the component holds.
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
      />
    </StrictMode>,
  );
  return { unmount: (): void => root.unmount() };
}
