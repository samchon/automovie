import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";

/**
 * The elements that take a key themselves: fields, buttons, disclosure summaries, links, editable text and the widgets that answer Space or arrows by their role.
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

/**
 * The inspector's playback keys, as a video player's: Space and K play or pause, J and L seek one second back and forward, comma and full stop step one frame back and forward with playback paused, Home and End go to the first and last second. K, J and L work in either case.
 *
 * A key is left to the page, unhandled and moving nothing, when Ctrl, Meta or Alt is held, so the browser's and the system's shortcuts keep working, and when the key's target is or sits inside an element that takes the key itself (a field, a button, a summary, a link, editable text, or a widget by its role), so Space still presses a button and opens a section. Shift is allowed, since it only changes a letter's case.
 *
 * A seek or a step returns the second the playhead now shows, which the caller makes the request's `time`, as the slider does; play and pause return null, because a stop already becomes the request's second through the time readout. A key the inspector does not use is not handled either.
 *
 * @param event The pressed key's `KeyboardEvent` members the decision reads; `target` is the element the key went to, or null when it is not an element.
 * @param playhead The playhead the keys drive.
 * @param fps The subject's frames per second, the step of comma and full stop; null before a subject is ready, when they step a twenty-fourth of a second.
 * @returns Whether the key was used, so the caller prevents its default, and the second a seek left the playhead on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every key, when a key is left to the page and why, what each returns and why play and pause return no second.
 * @evidence contracts/development/implementation.md#principled-implementation The keys follow the web's established video-player bindings, every move goes through the playhead's own `play`, `pause` and `seek`, and the interactive target is found with the platform's `Element.closest` over one selector list.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two early returns, then one table from key to move and one lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The playhead clamps every seek to the film, so nothing here restates its bounds; a key is never taken from a control that answers it, so no control loses its own keyboard behaviour.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per key, besides one `closest` walk up the target's ancestors.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure dispatch with nothing to reuse.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing between calls.
 */
export function handleAutoMovieInspectorKey(
  event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    target: { closest(selectors: string): unknown } | null;
  },
  playhead: AutoMovieInspectorPlayhead,
  fps: number | null,
): { handled: boolean; seconds: number | null } {
  // A shortcut, or a key a control answers itself, stays with the page.
  if (event.ctrlKey || event.metaKey || event.altKey)
    return { handled: false, seconds: null };
  if (event.target !== null && event.target.closest(INTERACTIVE) !== null)
    return { handled: false, seconds: null };

  const step: number = 1 / (fps ?? 24);
  const seek: (seconds: number) => number = (seconds: number): number => {
    playhead.seek(seconds);
    return playhead.getSnapshot().seconds;
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
  const move: (() => number | null) | undefined = moves[event.key];
  return move === undefined
    ? { handled: false, seconds: null }
    : { handled: true, seconds: move() };
}
