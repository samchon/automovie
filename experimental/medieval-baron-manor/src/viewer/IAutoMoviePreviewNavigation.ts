import type { IAutoMoviePreviewNavigationItem } from "./IAutoMoviePreviewNavigationItem";

/**
 * Camera destinations and the production callback that applies one.
 */
export interface IAutoMoviePreviewNavigation {
  /** Authored destinations displayed in the supplied order. */
  items: readonly IAutoMoviePreviewNavigationItem[];

  /** Production callback that applies the selected destination id. */
  apply: (id: string) => void;
}
