import { AutoMovieFrameGrid } from "@automovie/render";

import type { AutoMovieViewerInspector } from "../AutoMovieViewerInspector.js";
import type { AutoMovieInspectorPlayhead } from "../AutoMovieInspectorPlayhead.js";

/*
 * The inspector's playback keys, as a video player's: Space and K play or
 * pause, J and L seek one second back and forward, comma and full stop step one
 * frame back and forward with playback paused, Home and End go to the first and
 * last second. K, J and L work in either case.
 *
 * Frame steps start at the slider's displayed frame and include the exact end
 * of the subject, even when it falls between regular frames.
 *
 * A key is left to the page, unhandled and moving nothing, when Ctrl, Meta or
 * Alt is held, so the browser's and the system's shortcuts keep working, and
 * when the key's target is or sits inside an element that takes the key itself
 * (a field, a button, a summary, a link, editable text, or a widget by its
 * role), so Space still presses a button and opens a section. Shift is allowed,
 * since it only changes a letter's case.
 *
 * A seek or a step returns the second the playhead now shows, which the caller
 * makes the request's `time`, as the slider does; play and pause return null,
 * because a stop already becomes the request's second through the time readout.
 * A key the inspector does not use is not handled either.
 * Parameter event: The pressed key's `KeyboardEvent` members the decision reads;
 * `target` is the element the key went to, or null when it is not an
 * element.
 * Parameter playhead: The playhead the keys drive.
 * Parameter fps: The subject's frames per second, the step of comma and full stop;
 * null before a subject is ready, when they step a twenty-fourth of a
 * second.
 * Returns: Whether the key was used, so the caller prevents its default, and
 * the second a seek left the playhead on.
 */
export function handleAutoMovieInspectorKey(
  event: AutoMovieViewerInspector.IHandleKeyEvent,
  playhead: AutoMovieInspectorPlayhead,
  fps: number | null,
): AutoMovieViewerInspector.IHandleKeyResult {
  // A shortcut, or a key a control answers itself, stays with the page.
  if (event.ctrlKey || event.metaKey || event.altKey)
    return { handled: false, seconds: null };
  if (event.target !== null && event.target.closest(INTERACTIVE) !== null)
    return { handled: false, seconds: null };

  const seek: (seconds: number) => number = (seconds: number): number => {
    playhead.seek(seconds);
    return playhead.getSnapshot().seconds;
  };
  const step: (direction: -1 | 1) => number = (direction: -1 | 1): number => {
    playhead.pause();
    const { seconds, durationSeconds }: AutoMovieInspectorPlayhead.ISnapshot =
      playhead.getSnapshot();
    if (fps === null) return seek(seconds + direction / 24);

    const last: number = AutoMovieFrameGrid.last(durationSeconds, fps);
    const frame: number = AutoMovieFrameGrid.nearest(
      seconds,
      durationSeconds,
      fps,
      last,
    );
    return seek(
      AutoMovieFrameGrid.time(frame + direction, durationSeconds, fps),
    );
  };
  const toggle: () => null = (): null => {
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
    ",": (): number => step(-1),
    ".": (): number => step(1),
    Home: (): number => seek(0),
    End: (): number => seek(playhead.getSnapshot().durationSeconds),
  };
  const move: (() => number | null) | undefined = moves[event.key];
  return move === undefined
    ? { handled: false, seconds: null }
    : { handled: true, seconds: move() };
}

/*
 * The elements that take a key themselves: fields, buttons, disclosure
 * summaries, links, editable text and the widgets that answer Space or arrows
 * by their role.
 */
const INTERACTIVE: string = [
  "input",
  "select",
  "textarea",
  "button",
  "summary",
  "a[href]",
  '[contenteditable]:not([contenteditable="false"])',
  "[role=button]",
  "[role=tab]",
  "[role=checkbox]",
  "[role=slider]",
  "[role=switch]",
].join(", ");
