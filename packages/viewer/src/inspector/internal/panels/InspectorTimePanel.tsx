import { type ChangeEvent, type JSX, useSyncExternalStore } from "react";

import type { AutoMovieViewerInspectorPlayhead } from "../../AutoMovieViewerInspectorPlayhead";
import { InspectorTimeReadout } from "../InspectorTimeReadout";
import type { IAutoMovieViewerInspectorAction } from "../../IAutoMovieViewerInspectorAction";

/*
 * The transport under the canvas: one play or pause button, the scrubber and clock, and the preview speed.
 *
 * Play, pause and the speed move only the playhead; the readout turns a stop or a seek into a `time` edit, so the request names the picture left on screen. The button reads only whether the playhead plays, so playing frames do not re-render it; its label says what pressing it does, Play or Pause, and it carries no pressed state, since a toggle's label must not change with its state.
 */
export function InspectorTimePanel(
  props: InspectorTimePanel.IProps,
): JSX.Element {
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
      <InspectorTimeReadout
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

export namespace InspectorTimePanel {
  export interface IProps {
    /*
     * The playhead driven.
     */
    playhead: AutoMovieViewerInspectorPlayhead;

    /*
     * The subject's frames per second, the slider's step, or null before a subject is ready.
     */
    fps: number | null;

    /*
     * Where a paused or sought second goes.
     */
    dispatch: (action: IAutoMovieViewerInspectorAction) => void;
  }
}

/*
 * Preview speeds offered, as multiples of real time.
 */
const RATES: readonly number[] = [0.1, 0.25, 0.5, 1, 2];
