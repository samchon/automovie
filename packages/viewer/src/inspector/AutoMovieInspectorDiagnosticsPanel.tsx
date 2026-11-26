import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type { ChangeEvent, JSX } from "react";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import type { IAutoMovieInspectorScene } from "./IAutoMovieInspectorScene.js";
import { AutoMovieViewerInspector } from "./AutoMovieViewerInspector.js";

/**
 * Diagnostics: the confirmed errors this mount has reported, newest first, each with buttons that show its evidence.
 *
 * A first visit offers its witness; a span offers its first and its worst witness and says whether consecutive frames or uninterrupted playback joined it. A button stops the playhead at the witness and locates the request there through `AutoMovieViewerInspector.showFinding`, so the picture, the address and the capture command name that second with the finding's drawn entities labelled. The checkbox shows or hides the witness cubes and the status line; checks and reports continue either way.
 */
export function AutoMovieInspectorDiagnosticsPanel(props: {
  /** Reported incidents, newest first. */
  incidents: readonly IAutoMovieInspectorScene.IIncident[];

  /** The identity paths the scene draws. */
  paths: readonly string[];

  /** Whether the witness cubes and the status line are shown. */
  witnesses: boolean;

  /** Show or hide the witnesses. */
  onWitnesses: (show: boolean) => void;

  /** The playhead a located finding stops at. */
  playhead: AutoMovieInspectorPlayhead;

  /** Where edits go. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): JSX.Element {
  const show: (
    observation: IAutoMovieInspectionDiagnostics.IObservation,
  ) => void = (
    observation: IAutoMovieInspectionDiagnostics.IObservation,
  ): void =>
    AutoMovieViewerInspector.showFinding({
      observation,
      paths: props.paths,
      playhead: props.playhead,
      dispatch: props.dispatch,
    });
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={props.witnesses}
          onChange={(event: ChangeEvent<HTMLInputElement>): void =>
            props.onWitnesses(event.target.checked)
          }
        />{" "}
        show witnesses
      </label>
      {props.incidents.length === 0 ? (
        <p style={{ margin: 0, color: "#666" }}>
          No confirmed error reported yet.
        </p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {props.incidents.map(
            (
              incident: IAutoMovieInspectorScene.IIncident,
              index: number,
            ): JSX.Element => {
              const witness: IAutoMovieInspectionDiagnostics.IObservation =
                incident.kind === "first"
                  ? incident.observation
                  : incident.episode.worst;
              const { finding } = witness;
              return (
                <li key={index} style={{ marginBottom: 4 }}>
                  <div>
                    <code>{finding.code}</code>{" "}
                    {finding.paths.length === 0
                      ? finding.check
                      : finding.paths.join(" / ")}
                  </div>
                  <div style={{ color: "#666" }}>
                    {incident.kind === "first"
                      ? `first seen at ${clock(witness.time)}`
                      : `${incident.episode.samples} ${incident.basis === "frames" ? "consecutive frames" : "painted samples in playback"} from ${clock(incident.firstSample)} to ${clock(incident.episode.last)}`}
                  </div>
                  {incident.kind === "first" ? (
                    <button type="button" onClick={(): void => show(witness)}>
                      show
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(): void => show(incident.episode.first)}
                      >
                        first
                      </button>{" "}
                      <button type="button" onClick={(): void => show(witness)}>
                        worst
                      </button>
                    </>
                  )}
                </li>
              );
            },
          )}
        </ol>
      )}
    </div>
  );
}

/** A clock as seconds to the millisecond and, when it has one, its exact output frame; navigation still uses the exact seconds. */
function clock(time: IAutoMovieInspectionDiagnostics.ITime): string {
  const seconds: string = `${Number(time.filmSeconds.toFixed(3))} s`;
  return time.outputFrame === undefined
    ? seconds
    : `${seconds} (frame ${time.outputFrame})`;
}
