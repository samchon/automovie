import type { IAutoMoviePlaybackLayer } from "@automovie/interface";

/**
 * The layer a picture shows most of: the one with the larger weight among the
 * layers `playbackLayersAt` gives, the incoming live layer on a tie.
 *
 * Every per-frame record keyed to "the shot at this frame" follows it, so a
 * caption, a pose or a mask names the shot the picture shows: during a fade the
 * outgoing shot until the midpoint and the incoming one from it, during a cross
 * dissolve the outgoing shot before the midpoint and the incoming one from it,
 * and outside a transition the live shot.
 *
 * @param layers One or two layers of one instant, as `playbackLayersAt` gives
 *   them.
 * @returns The shown layer.
 * @throws When `layers` is empty.
 */
export function playbackShownLayer(
  layers: readonly IAutoMoviePlaybackLayer[],
): IAutoMoviePlaybackLayer {
  let shown: IAutoMoviePlaybackLayer | undefined;
  for (const layer of layers)
    if (
      shown === undefined ||
      layer.weight > shown.weight ||
      (layer.weight === shown.weight && layer.live)
    )
      shown = layer;
  if (shown === undefined)
    throw new Error("playbackShownLayer: an instant draws at least one layer");
  return shown;
}
