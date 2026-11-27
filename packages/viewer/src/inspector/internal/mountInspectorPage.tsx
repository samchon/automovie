import { StrictMode } from "react";
import { type Root, createRoot } from "react-dom/client";

import { AutoMovieViewerInspectorPage } from "../AutoMovieViewerInspectorPage";
import type { AutoMovieViewerInspector } from "../AutoMovieViewerInspector";
import { createInspectorAddressWriter } from "./createInspectorAddressWriter";

/*
 * Mount the inspector as a whole page in one call: render `AutoMovieViewerInspectorPage` into `root` under StrictMode, opening on the request `location`'s query names and keeping that query equal to the request through `history`.
 *
 * `location` and `history` are the host's, passed in rather than read from `window`, so the page's address is the only global state the inspector writes and a host decides which. The returned `unmount` disposes the scene and its renderer through the component's effect cleanup.
 *
 * A host that can reproduce its subjects in a terminal also supplies `captureCommand`.
 *
 * ```ts
 * AutoMovieViewerInspector.mountPage({ root: document.getElementById("root")!, subjects, location, history });
 * ```
 */
export function mountInspectorPage(
  props: AutoMovieViewerInspector.IPageProps,
): {
  /*
   * Unmount the page and release everything it holds.
   */
  unmount: () => void;
} {
  const onRequestChange: (text: string) => void =
    createInspectorAddressWriter({
      location: props.location,
      history: props.history,
    });
  const root: Root = createRoot(props.root);
  root.render(
    <StrictMode>
      <AutoMovieViewerInspectorPage
        subjects={props.subjects}
        initialText={props.location.search}
        onRequestChange={onRequestChange}
        captureCommand={props.captureCommand}
      />
    </StrictMode>,
  );
  return { unmount: (): void => root.unmount() };
}
