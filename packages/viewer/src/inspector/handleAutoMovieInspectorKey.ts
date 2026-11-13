import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";

/**
 * The inspector's playback keys, as a video player's: Space and K play or pause, J and L seek one second back and forward, comma and full stop step one frame back and forward with playback paused, Home and End go to the first and last second.
 *
 * A seek or a step returns the second the playhead now shows, which the caller makes the request's `time`, as the slider does; play and pause return null, because a stop already becomes the request's second through the time readout. A key the inspector does not use is not handled, so the page keeps it.
 *
 * @param key The pressed key's `KeyboardEvent.key`.
 * @param playhead The playhead the keys drive.
 * @param fps The subject's frames per second, the step of comma and full stop; null before a subject is ready, when they step a twenty-fourth of a second.
 * @returns Whether the key was used, and the second a seek left the playhead on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every key, what each returns and why play and pause return no second.
 * @evidence contracts/development/implementation.md#principled-implementation The keys follow the web's established video-player bindings, and every move goes through the playhead's own `play`, `pause` and `seek`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One table from key to move, one lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The playhead clamps every seek to the film; nothing here restates its bounds.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per key.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure dispatch with nothing to reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing between calls.
 */
export function handleAutoMovieInspectorKey(
  key: string,
  playhead: AutoMovieInspectorPlayhead,
  fps: number | null,
): { handled: boolean; seconds: number | null } {
  const step: number = 1 / (fps ?? 24);
  const seek = (seconds: number): number => {
    playhead.seek(seconds);
    return playhead.getSnapshot().seconds;
  };
  const toggle = (): null => {
    if (playhead.getSnapshot().playing) playhead.pause();
    else playhead.play();
    return null;
  };
  const moves: Readonly<Record<string, () => number | null>> = {
    " ": toggle,
    k: toggle,
    K: toggle,
    j: (): number => seek(playhead.getSnapshot().seconds - 1),
    J: (): number => seek(playhead.getSnapshot().seconds - 1),
    l: (): number => seek(playhead.getSnapshot().seconds + 1),
    L: (): number => seek(playhead.getSnapshot().seconds + 1),
    ",": (): number => {
      playhead.pause();
      return seek(playhead.getSnapshot().seconds - step);
    },
    ".": (): number => {
      playhead.pause();
      return seek(playhead.getSnapshot().seconds + step);
    },
    Home: (): number => seek(0),
    End: (): number => seek(playhead.getSnapshot().durationSeconds),
  };
  const move: (() => number | null) | undefined = moves[key];
  return move === undefined
    ? { handled: false, seconds: null }
    : { handled: true, seconds: move() };
}
