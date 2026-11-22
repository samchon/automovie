import { AutoMovieFrameGrid } from "@automovie/render";
import {
  type ChangeEvent,
  type JSX,
  type RefObject,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import { stopAutoMovieInspectorTime } from "./stopAutoMovieInspectorTime.js";

/**
 * The playhead's slider and clock, the one component that reads the playhead's second and so the only one a playing frame re-renders; the time panel reads only whether it plays.
 *
 * Moving the slider seeks to a regular frame or the exact end and dispatches the second as a `time` edit. Without a frame rate, the slider seeks directly in seconds. A pause or playback reaching the end also dispatches its second, so the request names the picture left on screen. The slider announces its second and, when available, its frame number.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it shows, why it alone reads the playhead's second, when it edits the request and what it announces.
 * @evidence contracts/development/implementation.md#principled-implementation `useSyncExternalStore` reads the cached playhead snapshot without tearing. Native range inputs enforce their step grid, so integer positions give every frame and the exact end a valid slider value.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One store read, one slider that converts its position to seconds on seek, and one clock output.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Playback frames dispatch nothing; only a seek and the change from playing to stopped edit the request, and the first render, which stops nothing, edits nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per render, one render per moved snapshot.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared presentation grid and computes its last frame number once per render.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources React holds one playhead subscription while the readout is mounted and removes it on unmount.
 */
export function AutoMovieInspectorTimeReadout(props: {
  /** The playhead shown and sought. */
  playhead: AutoMovieInspectorPlayhead;

  /** The subject's frames per second, so the slider steps from frame to frame of its grid, as a capture's seconds do; null before a subject is ready, when the slider steps freely. */
  fps: number | null;

  /** Where the sought second goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const snapshot: AutoMovieInspectorPlayhead.ISnapshot = useSyncExternalStore(
    props.playhead.subscribe,
    props.playhead.getSnapshot,
  );

  // When playback stops, by a pause or at the end, the stopped second becomes the request's.
  const was: RefObject<boolean> = useRef<boolean>(snapshot.playing);
  const { dispatch } = props;
  useEffect((): void => {
    const stop: IAutoMovieInspectorAction.ITime | null =
      stopAutoMovieInspectorTime(was.current, snapshot);
    if (stop !== null) dispatch(stop);
    was.current = snapshot.playing;
  }, [snapshot, dispatch]);

  // Integer slider positions keep the end reachable even between regular frames.
  const { fps }: typeof props = props;
  const { durationSeconds, seconds }: AutoMovieInspectorPlayhead.ISnapshot =
    snapshot;
  const last: number =
    fps === null
      ? durationSeconds
      : AutoMovieFrameGrid.last(durationSeconds, fps);
  const position: number =
    fps === null
      ? seconds
      : AutoMovieFrameGrid.nearest(seconds, durationSeconds, fps, last);

  return (
    <>
      <input
        type="range"
        aria-label="Second"
        aria-valuetext={
          fps === null
            ? `${seconds.toFixed(2)} seconds`
            : `${seconds.toFixed(2)} seconds, frame ${position} of ${last}`
        }
        min={0}
        max={last}
        step={fps === null ? "any" : 1}
        value={position}
        style={{ flex: "1 1 auto" }}
        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
          const value: number = event.currentTarget.valueAsNumber;
          props.playhead.seek(
            fps === null
              ? value
              : AutoMovieFrameGrid.time(value, durationSeconds, fps),
          );
          props.dispatch({
            type: "time",
            seconds: props.playhead.getSnapshot().seconds,
          });
        }}
      />
      <output style={{ fontVariantNumeric: "tabular-nums" }}>
        {seconds.toFixed(2)} / {durationSeconds.toFixed(2)} s
      </output>
    </>
  );
}
