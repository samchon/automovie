import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/interface";
import { type IAutoMovieDrawSubject, AutoMovieRenderDraw } from "@automovie/render";
import {
  type ChangeEvent,
  type Dispatch,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { AutoMovieInspectorDiagnosticsPanel } from "./AutoMovieInspectorDiagnosticsPanel.js";
import { AutoMovieInspectorMarksPanel } from "./AutoMovieInspectorMarksPanel.js";
import { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import { AutoMovieInspectorRequestPanel } from "./AutoMovieInspectorRequestPanel.js";
import { AutoMovieInspectorSelectionPanel } from "./AutoMovieInspectorSelectionPanel.js";
import { AutoMovieInspectorShadePanel } from "./AutoMovieInspectorShadePanel.js";
import { AutoMovieInspectorTimePanel } from "./AutoMovieInspectorTimePanel.js";
import { AutoMovieInspectorViewPanel } from "./AutoMovieInspectorViewPanel.js";
import type { IAutoMovieInspectorProps } from "./IAutoMovieInspectorProps.js";
import type { IAutoMovieInspectorScene } from "./IAutoMovieInspectorScene.js";
import type { IAutoMovieInspectorState } from "./IAutoMovieInspectorState.js";
import { createAutoMovieInspectorCanvasHost } from "./createAutoMovieInspectorCanvasHost.js";



import { AutoMovieViewerInspector } from "./AutoMovieViewerInspector.js";
import { reduceAutoMovieInspectorState } from "./reduceAutoMovieInspectorState.js";

/**
 * The inspection page as a React component: one canvas showing a subject
 * through one request, and the panels that edit that request.
 *
 * The request is the component's only state that changes the picture. Every
 * panel dispatches an edit to `reduceAutoMovieInspectorState`, the canvas is a
 * plain three.js scene from `@automovie/render` mounted by
 * `AutoMovieViewerInspector.mountScene` in an effect, and every change of the request
 * reaches `onRequestChange` as address text, so the page keeps its address
 * equal to the request. The playhead is an `AutoMovieInspectorPlayhead` outside
 * React that the render loop advances, so a playing frame re-renders only the
 * time readout, and starting or stopping also the play button.
 *
 * The canvas has the transport directly under it. Beside it, or under the
 * transport when the inspector is narrower than 900 pixels, a column holds one
 * collapsible section per panel, each heading saying what is active: View and
 * Shade start open, Marks, Selection and Request start closed, so a first look
 * shows the picture and how it is drawn, and Diagnostics opens once the mount
 * reports a confirmed error. Diagnostics keeps the newest incidents the mount
 * reports, which the console also receives, and moves the picture to a chosen
 * witness through an ordinary request edit; hiding its witnesses hides the
 * cubes and the status line, not the checks. While focus is inside the
 * inspector, the playback keys of `AutoMovieViewerInspector.handleKey` drive the
 * playhead, except a key held with Ctrl, Meta or Alt and a key that goes to a
 * control answering it itself.
 *
 * The mount effect depends on the chosen subject object only, which
 * selectAutoMovieDrawSubject picks by the request's subject key, so each
 * subject must keep its identity across renders; the request reaches a mounted
 * scene through its `apply`, and a request the scene refuses is set back to the
 * one it still draws, with the reason shown. Under StrictMode the mount effect
 * runs, cleans up and runs again on the same canvas, which the mount supports
 * with one renderer alive at the end.
 *
 * ```tsx
 * createRoot(element).render(
 *   <AutoMovieInspector
 *     subjects={subjects}
 *     initialText={location.search}
 *     onRequestChange={AutoMovieViewerInspector.createAddressWriter({
 *       location,
 *       history,
 *     })}
 *   />,
 * );
 * ```
 */
export function AutoMovieInspector(
  props: IAutoMovieInspectorProps,
): JSX.Element {
  const [state, dispatch] = useReducer(
    reduceAutoMovieInspectorState,
    props.initialText,
    AutoMovieViewerInspector.createState,
  );
  const [playhead] = useState<AutoMovieInspectorPlayhead>(
    (): AutoMovieInspectorPlayhead => new AutoMovieInspectorPlayhead(),
  );
  const [facts, setFacts] = useState<IAutoMovieInspectorScene.IFacts | null>(
    null,
  );
  const [legend, setLegend] = useState<IAutoMovieInspectionLegendEntry[]>([]);
  const [labels, setLabels] =
    useState<IAutoMovieInspectorScene.ILabels>(UNLABELLED);
  const [failure, setFailure] = useState<string | null>(null);
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(
    null,
  );
  const [incidents, setIncidents] = useState<
    IAutoMovieInspectorScene.IIncident[]
  >([]);
  const [witnesses, setWitnesses] = useState<boolean>(true);
  const canvas: RefObject<HTMLCanvasElement | null> =
    useRef<HTMLCanvasElement>(null);
  const scene: RefObject<IAutoMovieInspectorScene | null> =
    useRef<IAutoMovieInspectorScene>(null);
  const { onRequestChange } = props;

  // A subject the request cannot name is shown as an error, with the subject choice still offered.
  const names: string[] = Object.keys(props.subjects);
  let name: string | null = null;
  let unnamed: string | null = null;
  try {
    name = AutoMovieRenderDraw.selectAutoMovieDrawSubject(names, state.request.subject);
  } catch (error) {
    unnamed = error instanceof Error ? error.message : String(error);
  }

  // The scene lives as long as its subject; the effect reruns only then, so the request it captures is the one in force at mount.
  const request: IAutoMovieInspectorState["request"] = state.request;
  const subject: IAutoMovieDrawSubject | null =
    name === null ? null : props.subjects[name]!;
  useEffect((): (() => void) | undefined => {
    if (canvas.current === null || subject === null || name === null)
      return undefined;
    const mounted: IAutoMovieInspectorScene = AutoMovieViewerInspector.mountScene({
      subject,
      name,
      request,
      playhead,
      host: createAutoMovieInspectorCanvasHost(canvas.current),
      report: {
        ready: setFacts,
        legend: setLegend,
        labels: setLabels,
        error: setFailure,
        diagnostics: (packet: IAutoMovieInspectionDiagnostics): void =>
          setDiagnosticMessage(describeDiagnostics(packet)),
        diagnosticIncident: (
          entry: IAutoMovieInspectorScene.IIncident,
        ): void => {
          setIncidents(
            (
              list: IAutoMovieInspectorScene.IIncident[],
            ): IAutoMovieInspectorScene.IIncident[] =>
              [entry, ...list].slice(0, INCIDENT_LIMIT),
          );
          if (entry.kind === "first")
            console.error(
              `AutoMovie ${describeFinding(entry.observation)}`,
              entry.observation,
            );
          else
            console.error(
              `AutoMovie ${entry.episode.first.finding.paths.join(" / ")} ${entry.basis === "frames" ? "on consecutive frames" : "in painted playback samples, unchecked between them,"} from ${describeTime(entry.firstSample)} to ${describeTime(entry.episode.last)}. Worst ${entry.basis === "frames" ? "measured" : "observed"} at ${describeFinding(entry.episode.worst)}`,
              entry.episode,
            );
        },
        refused: (
          drawn: IAutoMovieInspectorState["request"],
          message: string,
        ): void =>
          dispatch({ type: "restore", request: drawn, error: message }),
      },
    });
    scene.current = mounted;
    return (): void => {
      scene.current = null;
      setFacts(null);
      setLabels(UNLABELLED);
      setDiagnosticMessage(null);
      setIncidents([]);
      mounted.dispose();
    };
  }, [subject, name, playhead]);

  // Witness visibility is a display choice the mount reads on its next frame.
  useEffect((): void => {
    scene.current?.overlay(witnesses);
  }, [witnesses, subject]);

  // Every request reaches the scene and the page's address.
  useEffect((): void => {
    scene.current?.apply(request);
    onRequestChange?.(AutoMovieViewerInspector.formatAddress(request));
  }, [request, onRequestChange]);

  // The column of sections moves under the transport when the inspector is
  // too narrow for both, measured on the inspector itself, since the page's
  // width is not the component's.
  const root: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(false);
  useEffect((): (() => void) | undefined => {
    if (root.current === null || typeof ResizeObserver === "undefined")
      return undefined;
    const observer: ResizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]): void =>
        setNarrow((entries[0]?.contentRect.width ?? NARROW) < NARROW),
    );
    observer.observe(root.current);
    return (): void => observer.disconnect();
  }, []);

  // The playback keys, while focus is in the inspector; the handler leaves a
  // shortcut and a key a control answers itself to the page.
  const keys: (event: KeyboardEvent<HTMLDivElement>) => void = (
    event: KeyboardEvent<HTMLDivElement>,
  ): void => {
    const result: AutoMovieViewerInspector.IHandleKeyResult =
      AutoMovieViewerInspector.handleKey(
        {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          // The key goes to the focused element, which is the event's target.
          target: event.currentTarget.ownerDocument.activeElement,
        },
        playhead,
        facts?.fps ?? null,
      );
    if (!result.handled) return;
    event.preventDefault();
    if (result.seconds !== null)
      dispatch({ type: "time", seconds: result.seconds });
  };

  const inspection: IAutoMovieInspectorState["request"]["inspection"] =
    request.inspection;
  return (
    <div
      ref={root}
      onKeyDown={keys}
      style={{
        display: "flex",
        flexDirection: narrow ? "column" : "row",
        gap: 12,
        fontFamily: "sans-serif",
        fontSize: 13,
      }}
    >
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvas}
            tabIndex={0}
            role="application"
            aria-label="The inspected picture; Space or K plays or pauses, J and L seek a second, comma and full stop step a frame, Home and End go to the ends"
            style={{
              display: "block",
              width: "100%",
              aspectRatio:
                facts === null ? "16 / 9" : `${facts.width} / ${facts.height}`,
              background: "#222",
            }}
          />
          {labels.labels.map(
            (
              label: IAutoMovieInspectorScene.ILabels["labels"][number],
            ): JSX.Element => (
              <span
                key={label.path}
                style={{
                  position: "absolute",
                  left: label.left,
                  top: label.top,
                  height: labels.lineHeight,
                  fontSize: labels.lineHeight * 0.8,
                  lineHeight: `${labels.lineHeight}px`,
                  fontFamily: "monospace",
                  background: "#000",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {label.text}
              </span>
            ),
          )}
        </div>
        {witnesses && diagnosticMessage !== null && (
          <p role="status" style={{ margin: "4px 0" }}>
            {diagnosticMessage}
          </p>
        )}
        <AutoMovieInspectorTimePanel
          playhead={playhead}
          fps={facts?.fps ?? null}
          dispatch={dispatch}
        />
        {[unnamed, failure, state.error]
          .flatMap((message: string | null): string[] =>
            message === null ? [] : [message],
          )
          .map(
            (message: string): JSX.Element => (
              <p
                key={message}
                role="alert"
                style={{ color: "#c00", margin: "4px 0" }}
              >
                {message}
              </p>
            ),
          )}
      </div>
      <div
        style={
          narrow
            ? { width: "100%" }
            : { flex: "0 0 300px", overflowY: "auto", maxHeight: "100vh" }
        }
      >
        {names.length > 1 ? (
          <label style={{ display: "block", marginBottom: 8 }}>
            Subject{" "}
            <select
              value={request.subject ?? ""}
              onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                dispatch({
                  type: "subject",
                  name: event.target.value === "" ? null : event.target.value,
                })
              }
            >
              <option value="">(choose)</option>
              {names.map(
                (candidate: string): JSX.Element => (
                  <option key={candidate} value={candidate}>
                    {candidate}
                  </option>
                ),
              )}
            </select>
          </label>
        ) : null}
        <Section title="View" open>
          <AutoMovieInspectorViewPanel
            request={request}
            views={facts?.views ?? []}
            dispatch={dispatch}
          />
        </Section>
        <Section title="Shade" open>
          <AutoMovieInspectorShadePanel request={request} dispatch={dispatch} />
        </Section>
        <Section
          title="Marks"
          note={
            inspection.marks.length === 0
              ? "none on"
              : `${inspection.marks.length} on`
          }
        >
          <AutoMovieInspectorMarksPanel
            request={request}
            marks={facts?.marks ?? []}
            markKinds={facts?.markKinds ?? []}
            legend={legend}
            dispatch={dispatch}
          />
        </Section>
        <Section
          title="Selection"
          note={
            inspection.parts.length +
              inspection.hide.length +
              inspection.label.length +
              inspection.color.length ===
            0
              ? `${facts?.paths.length ?? 0} paths`
              : `${inspection.parts.length} selected, ${inspection.hide.length} hidden, ${inspection.label.length} labelled`
          }
        >
          <AutoMovieInspectorSelectionPanel
            request={request}
            paths={facts?.paths ?? []}
            dispatch={dispatch}
          />
        </Section>
        <Section
          title="Diagnostics"
          open={incidents.length !== 0}
          note={
            incidents.length === 0
              ? "none reported"
              : `${incidents.length} reported`
          }
        >
          <AutoMovieInspectorDiagnosticsPanel
            incidents={incidents}
            paths={facts?.paths ?? []}
            witnesses={witnesses}
            onWitnesses={setWitnesses}
            playhead={playhead}
            dispatch={dispatch}
          />
        </Section>
        <Section
          title="Request"
          note={props.captureCommand ? "address and capture command" : "address"}
        >
          <AutoMovieInspectorRequestPanel
            request={request}
            dispatch={dispatch}
            captureCommand={props.captureCommand}
          />
        </Section>
      </div>
    </div>
  );
}

/** No labels, the state before a paused picture places any. */
const UNLABELLED: IAutoMovieInspectorScene.ILabels = {
  labels: [],
  lineHeight: 0,
  dropped: 0,
};

/** Below this width, in pixels, the sections move under the transport. */
const NARROW: number = 900;

/**
 * Most recent incidents the Diagnostics section keeps; the console keeps every
 * one.
 */
const INCIDENT_LIMIT: number = 50;

/**
 * One collapsible section of the column: a heading that says what is active,
 * over its panel.
 */
function Section(props: {
  title: string;
  note?: string;
  open?: boolean;
  children: ReactNode;
}): JSX.Element {
  return (
    <details
      open={props.open === true}
      style={{ borderTop: "1px solid #ddd", padding: "6px 0" }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        {props.title}
        {props.note === undefined ? null : (
          <span style={{ fontWeight: "normal", color: "#666" }}>
            : {props.note}
          </span>
        )}
      </summary>
      <div style={{ paddingTop: 6 }}>{props.children}</div>
    </details>
  );
}

/**
 * Describe a sample's clock to the millisecond without inventing an output
 * frame; the logged object keeps the exact seconds.
 */
function describeTime(time: IAutoMovieInspectionDiagnostics.ITime): string {
  const seconds: string = `${Number(time.filmSeconds.toFixed(3))} s`;
  return time.outputFrame === undefined
    ? seconds
    : `${seconds} (frame ${time.outputFrame})`;
}

/** Display the named parts and the checker-owned measurements of one finding. */
function describeFinding(
  observation: IAutoMovieInspectionDiagnostics.IObservation,
): string {
  const { finding, time } = observation;
  const paths: string = finding.paths.join(" / ");
  const measures: string[] = (finding.witness.measurements ?? []).map(
    (entry: IAutoMovieInspectionDiagnostics.IMeasurement): string =>
      `${entry.name} ${entry.value} ${entry.unit}`,
  );
  return [
    `${describeTime(time)} · ${finding.message}`,
    ...(paths === "" ? [] : [paths]),
    ...measures,
  ].join(" · ");
}

/**
 * Show the strongest current finding and any limits on what this sample could
 * check.
 */
function describeDiagnostics(
  packet: IAutoMovieInspectionDiagnostics,
): string | null {
  const strongest: IAutoMovieInspectionDiagnostics.IFinding | undefined =
    packet.findings.find(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
        finding.confidence === "confirmed" && finding.category === "error",
    ) ?? packet.findings[0];
  const unavailable: string[] = [];
  for (const row of packet.coverage)
    if (
      row.status === "deferred" ||
      (row.status === "unsupported" && row.required)
    )
      if (!unavailable.includes(row.reason)) unavailable.push(row.reason);
  const messages: string[] = [];
  if (strongest !== undefined) {
    const status: string =
      strongest.confidence === "candidate" ? "Possible" : "Confirmed";
    messages.push(
      `${status} — ${describeFinding({ finding: strongest, time: strongest.witness.time ?? packet.time })}`,
    );
  }
  if (unavailable.length !== 0)
    messages.push(
      `At ${describeTime(packet.time)}. Inspection incomplete · ${unavailable.join(" · ")}`,
    );
  return messages.length === 0 ? null : messages.join(" · ");
}
