import { playbackEntryAt, playbackShownLayer } from "@automovie/engine";
import type { IAutoMoviePlaybackLayer } from "@automovie/interface";

import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";
import { planAutoMovieDrawLayers } from "./planAutoMovieDrawLayers.js";

/**
 * Plan a draw subject's picture at a second: the layers a film picture
 * composites, the layer the picture shows most of, which every record of the
 * frame follows, and the entry that layer is placed as.
 *
 * The layers are `planAutoMovieDrawLayers`', null outside every transition, and
 * the shown layer is `playbackShownLayer` of them, the larger weight and the
 * live layer on a tie, or null outside every transition. The placed entry is
 * the shown layer, or outside a transition the entry `playbackEntryAt` finds
 * live at the second, or null without a `cut`; `placeAutoMovieDrawLayer` places
 * it on its own clock at the second and at every trail or framing time. The
 * draw page and the Viewer both plan through it, so a delivered frame, a
 * capture and a painted frame show and record the same shot.
 *
 * It throws what `planAutoMovieDrawLayers` throws for an outgoing shot the
 * subject cannot place.
 *
 * @param name The subject's name, which a refusal names.
 * @param scene The created subject.
 * @param seconds The second drawn.
 * @returns The layers and the shown layer, both null outside a transition, and
 *   the placed entry.
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

  /** The entry and shot the picture is placed as, or null without a `cut`. */
  placed: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null;
} {
  const layers: IAutoMoviePlaybackLayer[] | null = planAutoMovieDrawLayers(
    name,
    scene,
    seconds,
  );
  const shown: IAutoMoviePlaybackLayer | null =
    layers === null ? null : playbackShownLayer(layers);
  return {
    layers,
    shown,
    placed:
      shown ??
      (scene.cut === undefined
        ? null
        : playbackEntryAt(scene.cut.entries, seconds)),
  };
}
