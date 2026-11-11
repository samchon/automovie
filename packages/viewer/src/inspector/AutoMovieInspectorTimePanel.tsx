import type { ChangeEvent, JSX } from "react";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import { AutoMovieInspectorTimeReadout } from "./AutoMovieInspectorTimeReadout.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/** Preview speeds offered, as multiples of real time. */
const RATES: readonly number[] = [0.1, 0.25, 0.5, 1, 2];

/**
 * Play, pause, seek and preview speed.
 *
 * Play, pause and the speed move only the playhead; the readout turns a stop or a seek into a `time` edit, so the request names the picture left on screen.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each control changes and which of them edit the request.
 * @evidence contracts/development/implementation.md#principled-implementation The speed changes no picture, so it stays with the playhead; a stop or seek fixes a picture, so the readout makes it the request's second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two buttons, a select and the readout, which alone reads the playhead and edits the request's second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The panel itself never reads the playhead during render, so playback does not re-render it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant per render.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view with handlers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing; the readout holds the subscription.
 */
export function AutoMovieInspectorTimePanel(props: {
  /** The playhead driven. */
  playhead: AutoMovieInspectorPlayhead;

  /** The subject's frames per second, the slider's step, or null before a subject is ready. */
  fps: number | null;

  /** Where a paused or sought second goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0" }}>
      <button type="button" onClick={(): void => props.playhead.play()}>
        Play
      </button>
      <button type="button" onClick={(): void => props.playhead.pause()}>
        Pause
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
