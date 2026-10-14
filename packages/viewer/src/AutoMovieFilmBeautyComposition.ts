import type { IAutoMovieFilmBeautyLayer } from "./IAutoMovieFilmBeautyLayer.js";

/**
 * Closed beauty-composition decision for one sampled film frame.
 * A fade mixes its layer against opaque black; dissolve alpha is the incoming
 * contribution, with the outgoing contribution equal to one minus alpha.
 * The resolver admits finite unit-interval weights and complementary layers.
 *
 * @evidence contracts/common.md#principled-implementation The kind discriminant separates a full-weight draw, one layer over black and two complementary layers; preserving the generic layer retains each sampled frame's scene and camera identity.
 * @evidence contracts/common.md#clear-and-simple-design Each branch contains only the operands its compositor needs, so renderAutoMovieFilmFrame dispatches without reconstructing a blend decision from optional fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These three cases describe supported film transitions for arbitrary layers; none names a shot, fixture or viewer consumer.
 * @evidence contracts/common.md#meaningful-documentation Defines black as the fade endpoint, incoming alpha for dissolves and resolver admission of finite complementary weights.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased discriminated union chooses no processing strategy; the frame renderer and compositor own pixel work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A beauty decision is a per-frame value and coordinates no cache or asynchronous operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handles; referenced layer resources remain with the sampled frame's owner.
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

