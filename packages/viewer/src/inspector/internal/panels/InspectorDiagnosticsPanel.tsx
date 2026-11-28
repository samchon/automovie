import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type { AutoMovieRenderInspectionMarks } from "@automovie/render";
import { type ChangeEvent, type JSX, useState } from "react";

import { AutoMovieViewerInspector } from "../../AutoMovieViewerInspector";
import type { AutoMovieViewerInspectorPlayhead } from "../../AutoMovieViewerInspectorPlayhead";
import type { IAutoMovieViewerInspectorAction } from "../../IAutoMovieViewerInspectorAction";
import type { IAutoMovieViewerInspectorScene } from "../../IAutoMovieViewerInspectorScene";

/*
 * Diagnostics: the confirmed errors this mount has reported, newest first, each with buttons that show its evidence.
 *
 * A first visit offers its witness; a span offers its first and its worst witness and says whether consecutive frames or uninterrupted playback joined it. A button stops the playhead at the witness and locates the request there through `AutoMovieViewerInspector.showFinding`, so the picture, the address and the capture command name that second with the finding's drawn entities labelled. The checkbox shows or hides the witness cubes and the status line; checks and reports continue either way.
 */
export function InspectorDiagnosticsPanel(props: {
  /*
   * Reported incidents, newest first.
   */
  incidents: readonly IAutoMovieViewerInspectorScene.IIncident[];

  /* Current path text and original records matched by it. */
  coveragePath: string;
  selectedCoverage: AutoMovieRenderInspectionMarks.ISelectedDiagnostics | null;
  onCoveragePath: (path: string) => void;

  /*
   * The identity paths the scene draws.
   */
  paths: readonly string[];

  /*
   * Whether the witness cubes and the status line are shown.
   */
  witnesses: boolean;

  /*
   * Show or hide the witnesses.
   */
  onWitnesses: (show: boolean) => void;

  /*
   * The playhead a located finding stops at.
   */
  playhead: AutoMovieViewerInspectorPlayhead;

  /*
   * Where edits go.
   */
  dispatch: (action: IAutoMovieViewerInspectorAction) => void;
}): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const maximum = expanded ? undefined : 12;
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
      <label>
        Coverage path{" "}
        <input
          type="text"
          value={props.coveragePath}
          onChange={(event): void => props.onCoveragePath(event.target.value)}
        />
      </label>
      {props.coveragePath.trim() === "" ? null : props.selectedCoverage ===
        null ? (
        <p>No diagnostic sample recorded.</p>
      ) : (
        <div>
          <p>
            {props.selectedCoverage.coverage.length} of{" "}
            {props.selectedCoverage.totalCoverage} coverage ranges,{" "}
            {props.selectedCoverage.episodes.length} of{" "}
            {props.selectedCoverage.totalEpisodes} finding episodes
          </p>
          {props.selectedCoverage.coverage.length === 0 ? (
            <p>No coverage recorded for this path.</p>
          ) : (
            <ul>
              {props.selectedCoverage.coverage
                .slice(0, maximum)
                .map(({ range, status }, index) => (
                  <li key={index}>
                    <code>{range.coverage.check}</code>{" "}
                    {range.coverage.paths?.join(" / ")}{" "}
                    {range.coverage.basis === undefined
                      ? ""
                      : range.coverage.basis + " "}
                    {status.replaceAll("-", " ")}
                    {" at "}
                    {clock(range.first)}
                    {range.samples === 1 ? "" : " to " + clock(range.last)}
                    {range.coverage.status === "checked"
                      ? ""
                      : " (" + range.coverage.reason + ")"}
                  </li>
                ))}
            </ul>
          )}
          {props.selectedCoverage.episodes
            .slice(0, maximum)
            .map((episode, index) => (
              <p key={index}>
                <code>{episode.worst.finding.code}</code>{" "}
                {episode.worst.finding.paths.join(" / ")}{" "}
                <button type="button" onClick={(): void => show(episode.first)}>
                  first
                </button>{" "}
                <button type="button" onClick={(): void => show(episode.worst)}>
                  worst
                </button>
              </p>
            ))}
          {Math.max(
            props.selectedCoverage.coverage.length,
            props.selectedCoverage.episodes.length,
          ) > 12 ? (
            <button type="button" onClick={(): void => setExpanded(!expanded)}>
              {expanded ? "Show fewer records" : "Show all selected records"}
            </button>
          ) : null}
        </div>
      )}
      {props.incidents.length === 0 ? (
        <p style={{ margin: 0, color: "#666" }}>
          No confirmed error reported yet.
        </p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {props.incidents.map(
            (
              incident: IAutoMovieViewerInspectorScene.IIncident,
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

/*
 * A clock as seconds to the millisecond and, when it has one, its exact output frame; navigation still uses the exact seconds.
 */
function clock(time: IAutoMovieInspectionDiagnostics.ITime): string {
  const seconds: string = `${Number(time.filmSeconds.toFixed(3))} s`;
  return time.outputFrame === undefined
    ? seconds
    : `${seconds} (frame ${time.outputFrame})`;
}
