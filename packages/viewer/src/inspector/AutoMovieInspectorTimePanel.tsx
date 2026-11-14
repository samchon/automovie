import { type ChangeEvent, type JSX, useSyncExternalStore } from "react";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import { AutoMovieInspectorTimeReadout } from "./AutoMovieInspectorTimeReadout.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/** Preview speeds offered, as multiples of real time. */
const RATES: readonly number[] = [0.1, 0.25, 0.5, 1, 2];

/**
 * The transport under the canvas: one play or pause button, the scrubber and clock, and the preview speed.
 *
 * Play, pause and the speed move only the playhead; the readout turns a stop or a seek into a `time` edit, so the request names the picture left on screen. The button reads only whether the playhead plays, so playing frames do not re-render it; its label says what pressing it does, Play or Pause, and it carries no pressed state, since a toggle's label must not change with its state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each control changes, which of them edit the request, what the button reads and how it is labelled.
 * @evidence contracts/development/implementation.md#principled-implementation The speed changes no picture, so it stays with the playhead; a stop or seek fixes a picture, so the readout makes it the request's second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One toggle, the readout and a select.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The button subscribes to the playing flag alone, a boolean React compares by value, so moving seconds never re-render the panel.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant per render, one render per start or stop.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view with handlers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources React holds one playhead subscription while the panel is mounted and removes it on unmount; the readout holds its own.
 */
export function AutoMovieInspectorTimePanel(props: {
  /** The playhead driven. */
  playhead: AutoMovieInspectorPlayhead;

  /** The subject's frames per second, the slider's step, or null before a subject is ready. */
  fps: number | null;

  /** Where a paused or sought second goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const playing: boolean = useSyncExternalStore(
    props.playhead.subscribe,
    (): boolean => props.playhead.getSnapshot().playing,
  );
  return (
    <div
      role="group"
      aria-label="Playback"
      style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0" }}
    >
      <button
        type="button"
        style={{ minWidth: 64 }}
        onClick={(): void =>
          playing ? props.playhead.pause() : props.playhead.play()
        }
      >
        {playing ? "Pause" : "Play"}
      </button>
      <AutoMovieInspectorTimeReadout
        playhead={props.playhead}
        fps={props.fps}
        dispatch={props.dispatch}
      />
      <select
        aria-label="Speed"
        defaultValue="1"
        onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
          props.playhead.setRate(Number(event.target.value))
        }
      >
        {RATES.map(
          (rate: number): JSX.Element => (
            <option key={rate} value={String(rate)}>
              {rate}x
            </option>
          ),
        )}
      </select>
    </div>
  );
}
