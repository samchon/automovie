import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  AutoMovieInspectorPlayhead,
  type IAutoMovieInspectorAction,
  type IAutoMovieInspectorState,
  createAutoMovieInspectorState,
  locateAutoMovieInspectorFinding,
  reduceAutoMovieInspectorState,
  showAutoMovieInspectorFinding,
  stopAutoMovieInspectorTime,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Showing a finding during playback leaves the request, the playhead and the labels at the witness, in the order the page runs them.
 *
 * Scenarios:
 *
 * 1. Playing at 3 s, the panel's handler runs, then the time readout's effect applies its stop rule to the snapshot it renders. Reducing both edits in that order leaves `at` at the 1.5 s witness with the arm and bed labelled, and the playhead stopped at 1.5 s.
 * 2. The earlier order, pausing in place and then locating, lets the readout's stop edit overwrite `at` with 3 s while keeping the labels: the defect this order removes.
 * 3. The stop rule implies no edit for a playing snapshot or for a snapshot that was already stopped.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public playhead, the panel's public handler, the readout's public stop rule and the public reducer in the page's order.
 * @evidence contracts/development/testing.md#independent-expectations The expected seconds are the test's own witness and playing positions; the labels are the drawn paths the test lists.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts the new order with the earlier pause-then-locate order, and a stop with no stop.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit discovered as test_inspector_show_finding. React is not rendered; the readout's effect is its stop rule applied after the handler, as React runs effects after the event.
 * @evidence contracts/development/common.md#meaningful-documentation Three numbered scenarios identify the sequence and the behaviour pinned.
 */
export function test_inspector_show_finding(): void {
  const paths: string[] = ["actor", "actor/arm", "bed", "bed/base"];
  const witness: IAutoMovieInspectionDiagnostics.IObservation = {
    time: { filmSeconds: 1.5 },
    finding: {
      check: "collision",
      key: "pair",
      code: "scene-penetration",
      paths: ["actor/arm", "bed/base"],
      category: "error",
      confidence: "confirmed",
      message: "Overlap.",
      witness: {},
    },
  };

  // 1. The handler, then the readout's effect.
  const shown: IRun = run(
    (playhead: AutoMovieInspectorPlayhead, dispatch: IDispatch): void =>
      showAutoMovieInspectorFinding({
        observation: witness,
        paths,
        playhead,
        dispatch,
      }),
  );
  TestValidator.equals(
    "the request and the playhead stop at the witness with its entities labelled",
    [
      shown.state.error,
      shown.state.request.sampling,
      shown.state.request.inspection.label,
      shown.playhead.getSnapshot().seconds,
      shown.playhead.getSnapshot().playing,
    ],
    [
      null,
      { kind: "at", seconds: [1.5] },
      ["actor/arm", "bed/base"],
      1.5,
      false,
    ],
  );

  // 2. Pausing in place first lets the stop edit win.
  const earlier: IRun = run(
    (playhead: AutoMovieInspectorPlayhead, dispatch: IDispatch): void => {
      playhead.pause();
      dispatch(locateAutoMovieInspectorFinding(witness, paths));
    },
  );
  TestValidator.equals(
    "the earlier order returns to the paused second with only the labels",
    [earlier.state.request.sampling, earlier.state.request.inspection.label],
    [{ kind: "at", seconds: [3] }, ["actor/arm", "bed/base"]],
  );

  // 3. No stop, no edit.
  const playing: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  playing.setDuration(4);
  playing.play();
  TestValidator.equals(
    "playing and already stopped snapshots imply nothing",
    [
      stopAutoMovieInspectorTime(true, playing.getSnapshot()),
      stopAutoMovieInspectorTime(false, {
        ...playing.getSnapshot(),
        playing: false,
      }),
    ],
    [null, null],
  );
}

/** Where a handler sends its request edits. */
type IDispatch = (action: IAutoMovieInspectorAction) => void;

/** The reduced request and the playhead after one handled click. */
interface IRun {
  state: IAutoMovieInspectorState;
  playhead: AutoMovieInspectorPlayhead;
}

/** Play from 3 s of a 4 s subject under an even sampling, run a click handler, then the readout's stop rule, and reduce every edit in order. */
function run(
  handler: (playhead: AutoMovieInspectorPlayhead, dispatch: IDispatch) => void,
): IRun {
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  playhead.setDuration(4);
  playhead.seek(3);
  playhead.play();
  const actions: IAutoMovieInspectorAction[] = [];
  const was: boolean = playhead.getSnapshot().playing;
  handler(playhead, (action: IAutoMovieInspectorAction): void => {
    actions.push(action);
  });
  const stop: IAutoMovieInspectorAction.ITime | null =
    stopAutoMovieInspectorTime(was, playhead.getSnapshot());
  if (stop !== null) actions.push(stop);
  return {
    state: actions.reduce(
      reduceAutoMovieInspectorState,
      createAutoMovieInspectorState("?from=0&to=4&rate=24"),
    ),
    playhead,
  };
}
