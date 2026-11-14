import {
  type IAutoMovieDrawSubject,
  type IAutoMovieInspectionLegendEntry,
  selectAutoMovieDrawSubject,
} from "@automovie/render";
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
import { createAutoMovieInspectorState } from "./createAutoMovieInspectorState.js";
import { formatAutoMovieInspectorAddress } from "./formatAutoMovieInspectorAddress.js";
import { handleAutoMovieInspectorKey } from "./handleAutoMovieInspectorKey.js";
import { mountAutoMovieInspectorScene } from "./mountAutoMovieInspectorScene.js";
import { reduceAutoMovieInspectorState } from "./reduceAutoMovieInspectorState.js";

/** No labels, the state before a paused picture places any. */
const UNLABELLED: IAutoMovieInspectorScene.ILabels = {
  labels: [],
  lineHeight: 0,
  dropped: 0,
};

/**
 * The inspection page as a React component: one canvas showing a subject through one request, and the panels that edit that request.
 *
 * The request is the component's only state that changes the picture. Every panel dispatches an edit to `reduceAutoMovieInspectorState`, the canvas is a plain three.js scene from `@automovie/render` mounted by `mountAutoMovieInspectorScene` in an effect, and every change of the request reaches `onRequestChange` as address text, so the page keeps its address equal to the request. The playhead is an `AutoMovieInspectorPlayhead` outside React that the render loop advances, so a playing frame re-renders only the time readout, and starting or stopping also the play button.
 *
 * The canvas has the transport directly under it. Beside it, or under the transport when the inspector is narrower than 900 pixels, a column holds one collapsible section per panel, each heading saying what is active: View and Shade start open, Marks, Selection and Request start closed, so a first look shows the picture and how it is drawn. While focus is inside the inspector, the playback keys of `handleAutoMovieInspectorKey` drive the playhead, except a key held with Ctrl, Meta or Alt and a key that goes to a control answering it itself.
 *
 * The mount effect depends on the chosen subject object only, which selectAutoMovieDrawSubject picks by the request's subject key, so each subject must keep its identity across renders; the request reaches a mounted scene through its `apply`, and a request the scene refuses is set back to the one it still draws, with the reason shown. Under StrictMode the mount effect runs, cleans up and runs again on the same canvas, which the mount supports with one renderer alive at the end.
 *
 * ```tsx
 * createRoot(element).render(
 *   <AutoMovieInspector
 *     subjects={subjects}
 *     initialText={location.search}
 *     onRequestChange={createAutoMovieInspectorAddressWriter({ location, history })}
 *   />,
 * );
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the component shows and how it is laid out, where its state lives and changes, how the address follows it, why a playing frame renders only the readout and a start or stop the play button too, the keys, the effect split and the StrictMode behaviour, and shows the mount.
 * @evidence contracts/development/implementation.md#principled-implementation React owns layout and dispatch only: `useReducer` holds the request, `useEffect` owns the scene's lifetime per subject and forwards each request, and the canvas is drawn by three.js outside React's render, as the campaign decides against a React scene graph.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One component composes six panels, each a function of the request and a dispatch, five of them in collapsible sections of the platform's `details` element; every state change is the reducer's and every scene change the mount's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No panel writes the scene, and a scene refusal is answered by restoring the request, never by drawing a picture the address does not name.
 * @evidence contracts/development/implementation.md#efficient-algorithms A dispatched edit renders the panels once and re-applies the inspection only when its text changed; a playing frame renders the readout alone, and a start or stop the play button too.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The mount, its renderer and its instance live while the subject stays; a request change reuses them.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The component owns one playhead and at most one mount at a time, disposed by the effect cleanup when the subject changes or the component unmounts.
 */
export function AutoMovieInspector(
  props: IAutoMovieInspectorProps,
): JSX.Element {
  const [state, dispatch] = useReducer(
    reduceAutoMovieInspectorState,
    props.initialText,
    createAutoMovieInspectorState,
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
    name = selectAutoMovieDrawSubject(names, state.request.subject);
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
    const mounted: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({
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
      mounted.dispose();
    };
  }, [subject, name, playhead]);

  // Every request reaches the scene and the page's address.
  useEffect((): void => {
    scene.current?.apply(request);
    onRequestChange?.(formatAutoMovieInspectorAddress(request));
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
    const result: { handled: boolean; seconds: number | null } =
      handleAutoMovieInspectorKey(
        {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          altKey: event.altKey,
          target: event.target instanceof Element ? event.target : null,
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
            aria-label="The inspected picture; Space plays or pauses, comma and full stop step a frame"
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
        <AutoMovieInspectorTimePanel
          playhead={playhead}
          fps={facts?.fps ?? null}
          dispatch={dispatch}
        />
        {[unnamed, failure, state.error]
          .filter(
            (message: string | null): message is string => message !== null,
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
        <Section title="Request" note="address and capture command">
          <AutoMovieInspectorRequestPanel
            request={request}
            dispatch={dispatch}
          />
        </Section>
      </div>
    </div>
  );
}

/** Below this width, in pixels, the sections move under the transport. */
const NARROW: number = 900;

/** One collapsible section of the column: a heading that says what is active, over its panel. */
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
