import { playbackEntryAt, playbackEntryTime } from "@automovie/engine";
import type {
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";

import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * Place a draw subject as one layer of its film picture shows it at an output
 * second: on that layer's own entry clock, never on another entry's.
 *
 * Without a layer or a `cut` the subject is placed by `seek`, the only clock it
 * has. Otherwise, at an output second the layer's entry is live at, the entry
 * `playbackEntryAt` resolves, `seek` places that entry on its own clock. At any
 * other second, a transition's outgoing tail, or a shutter sample that trails
 * back across the entry's start, `seekShot` places the layer's shot at
 * `playbackEntryTime` of its entry, with the output second for the film-clock
 * readings. Before the entry's in-point that time runs into the entry's handle,
 * the shot's own source before its trim, as an editor's handle frames supply a
 * shot's first exposure; before the shot's own zero the shot answers as its
 * clips clamp, holding their first state. So a frame at a hard cut integrates
 * only the incoming shot.
 *
 * It rejects, before placing anything, when the layer needs `seekShot` and the
 * subject supplies none, naming the subject, the second, the entry and
 * `seekShot`.
 *
 * @param name The subject's name, which a refusal names.
 * @param scene The created subject.
 * @param layer The layer's entry and shot, or null for a subject placed on the
 *   film clock alone.
 * @param seconds The output second placed: the drawn one or a sample's.
 * @returns The subject's placement promise.
 */
export async function placeAutoMovieDrawLayer(
  name: string,
  scene: Pick<IAutoMovieDrawScene, "cut" | "seek" | "seekShot">,
  layer: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null,
  seconds: number,
): Promise<void> {
  const entries: readonly IAutoMoviePlaybackEntry[] | undefined =
    scene.cut?.entries;
  if (
    layer === null ||
    entries === undefined ||
    playbackEntryAt(entries, seconds).entry === layer.entry
  )
    return scene.seek(seconds);
  if (scene.seekShot === undefined)
    throw new Error(
      `Subject "${name}" places sequence entry ${layer.entry} at ${seconds} s, outside the span it is live in, but supplies no seekShot to place the shot "${layer.shot}" on its own clock`,
    );
  return scene.seekShot(
    layer.shot,
    playbackEntryTime(entries[layer.entry]!, seconds),
    seconds,
  );
}
