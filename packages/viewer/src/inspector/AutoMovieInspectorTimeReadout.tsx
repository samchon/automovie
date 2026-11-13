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

/**
 * The playhead's slider and clock, the one component that reads the playhead and so the only one playback re-renders.
 *
 * Dragging the slider, which steps by one frame of the subject's grid, seeks the playhead and dispatches the second as a `time` edit, and so does playback stopping, by a pause or at the end, so the request names the picture left on screen. The slider gives its second and frame as its value text, which a screen reader announces in place of the raw number.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it shows, why it alone reads the playhead, when it edits the request and what it announces.
 * @evidence contracts/development/implementation.md#principled-implementation `useSyncExternalStore` is React's contract for reading an external store without tearing; the playhead's cached snapshot keeps it from rendering when nothing moved.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One read of the store, one input and one output.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Playback frames dispatch nothing; only a seek and the change from playing to stopped edit the request, and the first render, which stops nothing, edits nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per render, one render per moved snapshot.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A view of one snapshot.
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
    if (was.current && !snapshot.playing)
      dispatch({ type: "time", seconds: snapshot.seconds });
    was.current = snapshot.playing;
  }, [snapshot, dispatch]);
  return (
    <>
      <input
        type="range"
        aria-label="Second"
        aria-valuetext={
          props.fps === null
            ? `${snapshot.seconds.toFixed(2)} seconds`
            : `${snapshot.seconds.toFixed(2)} seconds, frame ${Math.round(snapshot.seconds * props.fps)} of ${Math.round(snapshot.durationSeconds * props.fps)}`
        }
        min={0}
        max={snapshot.durationSeconds}
        step={props.fps === null ? "any" : 1 / props.fps}
        value={snapshot.seconds}
        style={{ flex: "1 1 auto" }}
        onChange={(event: ChangeEvent<HTMLInputElement>): void => {
          props.playhead.seek(Number(event.target.value));
          props.dispatch({
            type: "time",
            seconds: props.playhead.getSnapshot().seconds,
          });
        }}
      />
      <output style={{ fontVariantNumeric: "tabular-nums" }}>
        {snapshot.seconds.toFixed(2)} / {snapshot.durationSeconds.toFixed(2)} s
      </output>
    </>
  );
}
