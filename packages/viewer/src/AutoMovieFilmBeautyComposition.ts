import type { IAutoMovieFilmBeautyLayer } from "./IAutoMovieFilmBeautyLayer.js";

/**
 * Closed beauty-composition decision for one sampled film frame.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Names fade and dissolve as beauty-only compositions so a structural pass is never handed one.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-frame-schedule Preserves the builder-owned one- or two-layer schedule without inventing a fallback.
 */
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

