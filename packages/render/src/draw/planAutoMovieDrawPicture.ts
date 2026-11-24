import { playbackShownLayer } from "@automovie/engine";
import type { IAutoMoviePlaybackLayer } from "@automovie/interface";

import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { planAutoMovieDrawLayers } from "./planAutoMovieDrawLayers.js";

/**
 * Plan a draw subject's picture at a second: the layers a film picture
 * composites and the layer the picture shows most of, which every record of the
 * frame follows.
 *
 * The layers are `planAutoMovieDrawLayers`', null outside every transition, and
 * the shown layer is `playbackShownLayer` of them, the larger weight and the
 * live layer on a tie, or null outside every transition, where the live entry
 * is shown. The draw page and the Viewer both plan through it, so a delivered
 * frame, a capture and a painted frame show and record the same shot.
 *
 * It throws what `planAutoMovieDrawLayers` throws for an outgoing shot the
 * subject cannot place.
 *
 * @param name The subject's name, which a refusal names.
 * @param scene The created subject.
 * @param seconds The second drawn.
 * @returns The layers and the shown layer, both null outside a transition.
 */
export function planAutoMovieDrawPicture(
  name: string,
  scene: Pick<IAutoMovieDrawScene, "sequence" | "cut" | "seekShot">,
  seconds: number,
): {
  /** The layers a film picture composites, outgoing first, or null. */
  layers: IAutoMoviePlaybackLayer[] | null;

  /** One of `layers`, the shot the picture shows most of, or null. */
  shown: IAutoMoviePlaybackLayer | null;
} {
  const layers: IAutoMoviePlaybackLayer[] | null = planAutoMovieDrawLayers(
    name,
    scene,
    seconds,
  );
  return {
    layers,
    shown: layers === null ? null : playbackShownLayer(layers),
  };
}
