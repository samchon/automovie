import type { IAutoMovieFilmBeautyLayer } from "./IAutoMovieFilmBeautyLayer.js";

/** Closed beauty-composition decision for one sampled film frame. */
export type AutoMovieFilmBeautyComposition<
  Layer extends IAutoMovieFilmBeautyLayer = IAutoMovieFilmBeautyLayer,
> =
  | { kind: "direct"; layer: Layer }
  | { kind: "fade"; layer: Layer; weight: number }
  | {
      kind: "dissolve";
      outgoing: Layer;
      incoming: Layer;
      alpha: number;
    };

