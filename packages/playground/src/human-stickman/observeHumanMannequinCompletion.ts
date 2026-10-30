import type * as THREE from "three";

import type { IAutoMovieViewerCompletedFrame } from "../../../viewer/src/IAutoMovieViewerCompletedFrame";
import { traceHumanViewerPhase } from "../human/traceHumanViewerPhase";

/** Observed draw state; sequence advances only on the original mount's completed-frame event. */
interface CompletionState {
  ready: boolean;
  sequence: number;
  elapsedSeconds: number | null;
  error: string | null;
  closed: boolean;
}

/** Observe actual draw completion and terminal page/context failures on this canvas.
 *
 * @evidence contracts/common.md#principled-implementation Opts into the existing public automovie:completed-frame DOM boundary and accepts only the borrowed scene/camera; readiness also requires the same small control/placement state observed at completion, while error, rejection, context loss and disposal refuse it.
 * @evidence contracts/common.md#clear-and-simple-design One page-owned observer records completion state; it does not render, alter Three methods or infer success from RAF scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the actual completed-draw publisher advances sequence; sticky terminal failures cannot be cleared by a later event or requested UI state.
 * @evidence contracts/common.md#meaningful-documentation Sequence is an observation counter, elapsedSeconds is the publisher's optional clock in seconds, and ready becomes false when the supplied current control/placement state differs from the completed draw; closed/error remain terminal refusal states.
 * @evidence contracts/performance.md#efficient-algorithms Completion and readiness compare only the supplied small controller/ancestor/camera/display record; no geometry traversal, PNG read or new animation loop runs here.
 * @evidence contracts/performance.md#reuse-equivalent-work One observer serves the existing page and capture consumers throughout its mount lifetime.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns four listeners and the canvas opt-in attribute; dispose removes listeners, restores the prior attribute and seals readiness without acquiring renderer or model ownership.
 */
export function observeHumanMannequinCompletion(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.Camera,
  readState: () => string,
): {
  state: CompletionState;
  begin: () => void;
  fail: (error: unknown) => void;
  dispose: () => void;
} {
  let drawn: boolean = false;
  let completedState: string | undefined;
  const state: CompletionState = {
    get ready(): boolean {
      if (!drawn || state.error !== null || state.closed) return false;
      try {
        return completedState === readState();
      } catch (error: unknown) {
        fail(error);
        return false;
      }
    },
    sequence: 0,
    elapsedSeconds: null,
    error: null,
    closed: false,
  };
  const prior: string | null = canvas.getAttribute(
    "data-automovie-frame-observer",
  );
  const host: Window = canvas.ownerDocument.defaultView ?? window;
  const fail: (error: unknown) => void = (error: unknown): void => {
    drawn = false;
    state.error ??= (
      error instanceof Error ? error.message : String(error)
    ).slice(0, 2048);
  };
  const completed: EventListener = (event: Event): void => {
    const frame: IAutoMovieViewerCompletedFrame = (
      event as CustomEvent<IAutoMovieViewerCompletedFrame>
    ).detail;
    if (
      state.closed ||
      state.error !== null ||
      frame.scene !== scene ||
      frame.camera !== camera
    )
      return;
    try {
      completedState = readState();
    } catch (error: unknown) {
      fail(error);
      return;
    }
    state.sequence++;
    state.elapsedSeconds = frame.elapsedSeconds ?? null;
    drawn = true;
    if (state.sequence === 1)
      traceHumanViewerPhase("mannequin.page.ready", "mannequin");
  };
  const failed: EventListener = (event: Event): void =>
    fail((event as ErrorEvent).error ?? (event as ErrorEvent).message);
  const rejected: EventListener = (event: Event): void =>
    fail((event as PromiseRejectionEvent).reason);
  const lost: EventListener = (): void =>
    fail(new Error("Mannequin WebGL context was lost"));
  canvas.setAttribute("data-automovie-frame-observer", "on");
  canvas.addEventListener("automovie:completed-frame", completed);
  canvas.addEventListener("webglcontextlost", lost);
  host.addEventListener("error", failed);
  host.addEventListener("unhandledrejection", rejected);
  return {
    state,
    begin: (): void => {
      drawn = false;
    },
    fail,
    dispose: (): void => {
      if (state.closed) return;
      state.closed = true;
      drawn = false;
      completedState = undefined;
      canvas.removeEventListener("automovie:completed-frame", completed);
      canvas.removeEventListener("webglcontextlost", lost);
      host.removeEventListener("error", failed);
      host.removeEventListener("unhandledrejection", rejected);
      if (prior === null)
        canvas.removeAttribute("data-automovie-frame-observer");
      else canvas.setAttribute("data-automovie-frame-observer", prior);
    },
  };
}
