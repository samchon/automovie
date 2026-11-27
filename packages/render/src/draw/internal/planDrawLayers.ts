import { AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMoviePlaybackLayer } from "@automovie/interface";

import type { IAutoMovieRenderDrawScene } from "../IAutoMovieRenderDrawScene";

/*
 * The layers a draw subject's film picture composites at a second, outgoing
 * first, or null when the picture is the live placement alone.
 *
 * The layers are `playbackLayersAt` of the subject's `sequence` and `cut`, so
 * they follow `IAutoMovieTransition` on the instants `playbackCursor` resolves.
 * The result is null for a subject without both, and for a second outside every
 * transition, where the one layer is the live entry at weight 1: such a picture
 * composites nothing, as a picture of a subject without a sequence does.
 *
 * It throws when a layer is an outgoing shot and the subject supplies no
 * `seekShot` to place it, naming the subject, the second, the entry and
 * `seekShot`.
 * Parameter name: The subject's name, which a refusal names.
 * Parameter scene: The created subject.
 * Parameter seconds: The second drawn.
 * Returns: The layers, or null for the live placement alone.
 */
export function planDrawLayers(
  name: string,
  scene: Pick<IAutoMovieRenderDrawScene, "sequence" | "cut" | "seekShot">,
  seconds: number,
): IAutoMoviePlaybackLayer[] | null {
  if (scene.sequence === undefined || scene.cut === undefined) return null;
  const layers: IAutoMoviePlaybackLayer[] = AutoMovieEngineFilm.playbackLayersAt(
    scene.sequence,
    scene.cut,
    seconds,
  );
  if (layers.length === 1 && layers[0]!.live && layers[0]!.weight === 1)
    return null;
  const outgoing: IAutoMoviePlaybackLayer | undefined = layers.find(
    (layer: IAutoMoviePlaybackLayer): boolean => !layer.live,
  );
  if (outgoing !== undefined && scene.seekShot === undefined) {
    const kind: string =
      scene.sequence.shots[outgoing.entry + 1]?.transition?.kind ??
      "transition";
    throw new Error(
      `Subject "${name}" draws a ${kind} into sequence entry ${outgoing.entry + 1} at ${seconds} s, but supplies no seekShot to place the outgoing shot "${outgoing.shot}"`,
    );
  }
  return layers;
}
