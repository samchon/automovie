import type { IAutoMovieFilmBeautyLayer } from "./IAutoMovieFilmBeautyLayer.js";

/**
 * Closed beauty-composition decision for one sampled film frame.
 * A fade mixes its layer against opaque black; dissolve alpha is the incoming
 * contribution, with the outgoing contribution equal to one minus alpha.
 * The resolver admits finite unit-interval weights and complementary layers.
 *
 * @evidence contracts/development/design.md#principled-representation The kind discriminant separates a full-weight draw, one layer over black and two complementary layers; preserving the generic layer retains each sampled frame's scene and camera identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each branch contains only the operands its compositor needs, so renderAutoMovieFilmFrame dispatches without reconstructing a blend decision from optional fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These three cases describe supported film transitions for arbitrary layers; none names a shot, fixture or viewer consumer.
 * @evidence contracts/development/common.md#meaningful-documentation Defines black as the fade endpoint, incoming alpha for dissolves and resolver admission of finite complementary weights.
 */
export type IAutoMovieFilmBeautyComposition<
  Layer extends IAutoMovieFilmBeautyLayer = IAutoMovieFilmBeautyLayer,
> =
  | {
      /** Composition branch selecting direct output, black fade, or two-layer dissolve. */
      kind: "direct";
      /** Caller layer retained without cloning; direct output uses full contribution. */
      layer: Layer;
    }
  | {
      /** Composition branch selecting direct output, black fade, or two-layer dissolve. */
      kind: "fade";
      /** Caller layer retained without cloning; direct output uses full contribution. */
      layer: Layer;
      /** Layer contribution against opaque black, finite in [0,1] after resolver admission. */
      weight: number;
    }
  | {
      /** Composition branch selecting direct output, black fade, or two-layer dissolve. */
      kind: "dissolve";
      /** Earlier layer whose contribution is one minus alpha. */
      outgoing: Layer;
      /** Later layer whose contribution is alpha. */
      incoming: Layer;
      /** Incoming contribution, finite in [0,1] after complementary-weight admission. */
      alpha: number;
    };
