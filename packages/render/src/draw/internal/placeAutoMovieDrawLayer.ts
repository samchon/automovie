import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackLayer,
} from "@automovie/interface";

import type { IAutoMovieDrawScene } from "../IAutoMovieDrawScene.js";

/*
 * Place a draw subject as one layer of its film picture shows it at an output
 * second: on that layer's own entry clock, never on another entry's.
 *
 * Without a layer or a `cut` the subject is placed by `seek`, the only clock it
 * has. Otherwise, at an output second inside the entry's live span, from its
 * start to the next entry's, where `playbackEntryAt` resolves it, `seek` places
 * that entry on its own clock. At any other second, a transition's outgoing
 * tail, a shutter sample or trail time before the in-point, the film's first
 * frame included, or a trail time after the out-point, `seekShot` places the
 * layer's shot at `playbackEntryTime` of its entry, with the output second for
 * the film-clock readings. Outside the trimmed span that time runs into the
 * entry's handles, the shot's own source before the trim's start or after its
 * end, as an editor's handle frames supply a shot's edge; beyond the shot's own
 * ends the shot answers as its clips clamp, holding their end states. So a
 * frame or a trail at a hard cut shows only the entry's own shot.
 *
 * A subject without `seekShot`, which only a transition requires and whose
 * transitions `AutoMovieRenderDraw.planLayers` refuses, has no clock but `seek`: a
 * second outside the entry's live span is held at the nearest second the entry
 * is live at, its in-point or the last representable second before the next
 * entry's start, so a cut's first frame shows nothing of the previous shot and
 * only its shutter trail is shorter.
 * Parameter name: The subject's name, which an error names.
 * Parameter scene: The created subject.
 * Parameter layer: The layer's entry and shot, or null for a subject placed on the
 * film clock alone.
 * Parameter seconds: The output second placed: the drawn one, a sample's or a
 * trail's.
 * Returns: The subject's placement promise.
 */
export async function placeAutoMovieDrawLayer(
  name: string,
  scene: Pick<IAutoMovieDrawScene, "cut" | "seek" | "seekShot">,
  layer: Pick<IAutoMoviePlaybackLayer, "entry" | "shot"> | null,
  seconds: number,
): Promise<void> {
  const entries: readonly IAutoMoviePlaybackEntry[] | undefined =
    scene.cut?.entries;
  if (layer === null || entries === undefined) return scene.seek(seconds);
  const entry: IAutoMoviePlaybackEntry | undefined = entries[layer.entry];
  if (entry === undefined)
    throw new Error(
      `Subject "${name}" has no sequence entry ${layer.entry} to place the shot "${layer.shot}" as`,
    );
  if (
    seconds >= entry.start &&
    AutoMovieEngineFilm.playbackEntryAt(entries, seconds).entry === layer.entry
  )
    return scene.seek(seconds);
  if (scene.seekShot !== undefined)
    return scene.seekShot(
      layer.shot,
      AutoMovieEngineFilm.playbackEntryTime(entry, seconds),
      seconds,
    );

  // The live span ends where the next entry starts; the last entry's never.
  const next: number =
    entries[layer.entry + 1]?.start ?? Number.POSITIVE_INFINITY;
  return scene.seek(
    seconds < entry.start ? entry.start : Math.max(entry.start, below(next)),
  );
}

/*
 * The largest double below a positive finite `value`, the last second before
 * it; `value` itself for zero, and for an infinite value, which no second
 * reaches.
 */
function below(value: number): number {
  if (!(value > 0)) return value;
  const view: DataView = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  view.setBigUint64(0, view.getBigUint64(0) - 1n);
  return view.getFloat64(0);
}
