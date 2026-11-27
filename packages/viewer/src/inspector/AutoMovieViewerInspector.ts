import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";
import type { IAutoMovieDrawSubject } from "@automovie/render";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import type { IAutoMovieInspectorPathNode } from "./IAutoMovieInspectorPathNode.js";
import type { IAutoMovieInspectorProps } from "./IAutoMovieInspectorProps.js";
import type { IAutoMovieInspectorScene } from "./IAutoMovieInspectorScene.js";
import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";
import type { IAutoMovieInspectorState } from "./IAutoMovieInspectorState.js";
import { buildAutoMovieInspectorPathTree } from "./internal/buildAutoMovieInspectorPathTree.js";
import { createAutoMovieInspectorAddressWriter } from "./internal/createAutoMovieInspectorAddressWriter.js";
import { createAutoMovieInspectorCanvasHost } from "./internal/createAutoMovieInspectorCanvasHost.js";
import { createAutoMovieInspectorState } from "./internal/createAutoMovieInspectorState.js";
import { reduceAutoMovieInspectorState } from "./internal/reduceAutoMovieInspectorState.js";
import { formatAutoMovieInspectorAddress } from "./internal/formatAutoMovieInspectorAddress.js";
import { formatAutoMovieInspectorCommand } from "./internal/formatAutoMovieInspectorCommand.js";
import { handleAutoMovieInspectorKey } from "./internal/handleAutoMovieInspectorKey.js";
import { locateAutoMovieInspectorFinding } from "./internal/locateAutoMovieInspectorFinding.js";
import { readAutoMovieInspectorAddress } from "./internal/readAutoMovieInspectorAddress.js";
import { mountAutoMovieInspectorPage } from "./internal/mountAutoMovieInspectorPage.js";
import { mountAutoMovieInspectorScene } from "./internal/mountAutoMovieInspectorScene.js";
import { showAutoMovieInspectorFinding } from "./internal/showAutoMovieInspectorFinding.js";
import { stopAutoMovieInspectorTime } from "./internal/stopAutoMovieInspectorTime.js";

/**
 * Owns the imperative entry points for the Viewer inspector.
 * Page and scene mounts retain their React and renderer lifecycles; helper
 * operations work from explicit values and host dependencies.
 */
export namespace AutoMovieViewerInspector {
  /** Witness and drawn paths used to create a request edit for a finding. */
  export interface IFindingLocationRequest {
    /** The inspection observation whose witness should be shown. */
    observation: IAutoMovieInspectionDiagnostics.IObservation;
    /** The identity paths drawn by the mounted subject. */
    paths: readonly string[];
  }

  /** Finding navigation dependencies supplied by the diagnostics panel. */
  export interface IShowFindingRequest extends IFindingLocationRequest {
    /** The inspector playhead moved to the witness. */
    playhead: AutoMovieInspectorPlayhead;
    /** Receives the location edit after the playhead is stopped. */
    dispatch: (action: IAutoMovieInspectorAction) => void;
  }

  /** Keyboard values inspected by the inspector playback shortcut handler. */
  export interface IHandleKeyEvent {
    /** Pressed key as reported by `KeyboardEvent.key`. */
    key: string;
    /** Whether Control is held, which leaves the shortcut to the page. */
    ctrlKey: boolean;
    /** Whether Meta is held, which leaves the shortcut to the page. */
    metaKey: boolean;
    /** Whether Alt is held, which leaves the shortcut to the page. */
    altKey: boolean;
    /** Target used to detect interactive controls, or null for a non-element. */
    target: IHandleKeyEventTarget | null;
  }

  /** The target object of {@link IHandleKeyEvent}. */
  export type IHandleKeyEventTarget = { closest(selectors: string): unknown };

  /** Whether a key was consumed and the resulting seek second, if any. */
  export interface IHandleKeyResult {
    /** True when the caller should prevent the event's default action. */
    handled: boolean;
    /** The resulting playhead time after a seek or step, otherwise null. */
    seconds: number | null;
  }
  /** Host address dependencies used to write inspector request text. */
  export interface IAddressWriterProps {
    /** The page location, read for the current path, query and fragment. */
    location: Pick<Location, "pathname" | "search" | "hash">;
    /** The page's history, whose current entry is replaced when text changes. */
    history: Pick<History, "replaceState" | "state">;
  }

  /** Inputs the host supplies to mount the complete inspector page. */
  export interface IPageProps {
    /** The element the page renders into. */
    root: Element;
    /** The subjects offered by name; keep each subject identity stable. */
    subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;
    /** The page location; its query initializes the request. */
    location: Pick<Location, "pathname" | "search" | "hash">;
    /** The page history, whose current entry follows the request. */
    history: Pick<History, "replaceState" | "state">;
    /** Executable and fixed capture arguments from the host, when available. */
    captureCommand?: IAutoMovieInspectorProps["captureCommand"];
  }

  /** Inputs the React inspector supplies to mount one subject scene. */
  export interface ISceneProps {
    /** The subject to build. */
    subject: IAutoMovieDrawSubject;
    /** The subject name used by the request and refusal reports. */
    name: string;
    /** The request in force when mounting starts. */
    request: IAutoMovieCapturePlanRequest;
    /** The playhead borrowed for the mount's lifetime. */
    playhead: AutoMovieInspectorPlayhead;
    /** Renderer, frame clock and size supplied by the host. */
    host: IAutoMovieInspectorSceneHost;
    /** Receives facts, labels, errors, refusals and diagnostics. */
    report: IAutoMovieInspectorScene.IReport;
  }

  /** Shell and host arguments for formatting a capture command. */
  export interface IFormatCommandProps {
    /** Executable and fixed arguments supplied by the capture host. */
    command?: readonly [string, ...string[]];
    /** Shell syntax for the copied text. Defaults to POSIX. */
    shell?: "posix" | "powershell";
  }

  /** Request options and shell-ready command text. */
  export interface IFormatCommandResult {
    /** Request options, one argument each. */
    options: string[];
    /** Command with host and request arguments quoted for the shell. */
    text: string;
  }

  /** Handle returned by `mountPage`, used to release the React root. */
  export interface IPageHandle {
    /** Unmount the page and release everything it holds. */
    unmount(): void;
  }

  /** Resolve the closest drawn owners for the paths named by one finding. */
  export function locateFinding(
    request: IFindingLocationRequest,
  ): IAutoMovieInspectorAction.ILocate {
    return locateAutoMovieInspectorFinding(request);
  }

  /** Stop at a finding witness and dispatch its location edit. */
  export function showFinding(request: IShowFindingRequest): void {
    showAutoMovieInspectorFinding(request);
  }

  /** Build the ordered path tree used by the inspector selection panel. */
  export function buildPathTree(paths: readonly string[]): IAutoMovieInspectorPathNode[] {
    return buildAutoMovieInspectorPathTree(paths);
  }

  /** Create a listener that writes request text through the supplied page history. */
  export function createAddressWriter(
    props: IAddressWriterProps,
  ): (text: string) => void {
    return createAutoMovieInspectorAddressWriter(props);
  }

  /** Create the inspector host for a canvas, preserving its owner-window frame clock. */
  export function createCanvasHost(
    canvas: HTMLCanvasElement,
  ): IAutoMovieInspectorSceneHost {
    return createAutoMovieInspectorCanvasHost(canvas);
  }

  /** Return the time edit implied when a previously playing playhead stops. */
  export function stopTime(
    playing: boolean,
    snapshot: AutoMovieInspectorPlayhead.ISnapshot,
  ): IAutoMovieInspectorAction.ITime | null {
    return stopAutoMovieInspectorTime(playing, snapshot);
  }

  /** Apply one action to inspector state, preserving refused requests. */
  export function reduceState(
    state: IAutoMovieInspectorState,
    action: IAutoMovieInspectorAction,
  ): IAutoMovieInspectorState {
    return reduceAutoMovieInspectorState(state, action);
  }

  /** Initialize inspector request state from the page's address text. */
  export function createState(text: string): IAutoMovieInspectorState {
    return createAutoMovieInspectorState(text);
  }

  /** Handle one inspector playback shortcut, preserving controls and browser modifiers. */
  export function handleKey(
    event: IHandleKeyEvent,
    playhead: AutoMovieInspectorPlayhead,
    fps: number | null,
  ): IHandleKeyResult {
    return handleAutoMovieInspectorKey(event, playhead, fps);
  }
  /** Format an inspection request as readable address query text. */
  export function formatAddress(request: IAutoMovieCapturePlanRequest): string {
    return formatAutoMovieInspectorAddress(request);
  }

  /** Read address query text through the capture request grammar. */
  export function readAddress(text: string): IAutoMovieCapturePlanRequest {
    return readAutoMovieInspectorAddress(text);
  }

  /** Format request options and an optional host command for the selected shell. */
  export function formatCommand(
    request: IAutoMovieCapturePlanRequest,
    props: IFormatCommandProps = {},
  ): IFormatCommandResult {
    return formatAutoMovieInspectorCommand(request, props);
  }

  /** Mount the React inspector page; unmount releases its React root and scene. */
  export function mountPage(props: IPageProps): IPageHandle {
    return mountAutoMovieInspectorPage(props);
  }

  /** Mount one scene; disposal cancels frames, restores inspection and releases its renderer. */
  export function mountScene(props: ISceneProps): IAutoMovieInspectorScene {
    return mountAutoMovieInspectorScene(props);
  }
}
