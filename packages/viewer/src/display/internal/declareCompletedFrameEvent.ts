import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay";

declare global {
  interface HTMLElementEventMap {
    /**
     * A frame the viewer completed, sent to a canvas whose
     * `data-automovie-frame-observer` attribute is `on`.
     */
    "automovie:completed-frame": CustomEvent<AutoMovieViewerDisplay.ICompletedFrame>;
  }
}
