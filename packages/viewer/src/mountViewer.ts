import * as THREE from "three";

import type {IAutoMovieViewerHandle} from "./IAutoMovieViewerHandle.js";
import {releaseMountedViewer} from "./releaseMountedViewer.js";
import { createViewerCameraState } from "./createViewerCameraState.js";
import { createViewerDisplayClock } from "./createViewerDisplayClock.js";
import { publishViewerCompletedFrame } from "./publishViewerCompletedFrame.js";
import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";
import type { IMountViewerOptions } from "./IMountViewerOptions.js";
import { releaseViewerRenderer } from "./releaseViewerRenderer.js";
import { restoreAutoMovieRenderModeOnce } from "./restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";
import { guardAutoMovieRenderModeRetirement } from "./guardAutoMovieRenderModeRetirement.js";
import { guardAutoMovieSceneShadowRetirement } from "./guardAutoMovieSceneShadowRetirement.js";

/** A synchronous producer may report a handled draw or discard its return. */
type ViewerFrameProducer = ((elapsedSeconds: number) => boolean) | ((elapsedSeconds: number) => void);

/**
 * Mount a render loop onto a canvas: create a `WebGLRenderer`, drive `onFrame(elapsedSeconds)` each animation frame, then render `scene` from `camera`.
 *
 * This is the one browser-only entry point. `onFrame` is where a {@link AutoMoviePlayer} advances: the viewer stays a thin shell around the deterministic engine. `elapsedSeconds` is measured from the first frame. If `onFrame` returns `true` it has **already drawn** the frame itself (e.g. a multi-pass cross-dissolve composite), so the loop skips its own default `render`; returning `undefined`/`false` keeps the plain single-pass render. External seek/guide producers call the returned `completeFrame` immediately after their original draw, before an unpreserved native buffer can clear. A manual guide retains the completed clock; a seek supplies its own seconds.
 *
 * @evidence contracts/common.md#principled-implementation Owns one browser renderer/RAF loop, runs the original producer under a validated display clock and publishes actual handled or ordinary completion through the existing observer boundary.
 * @evidence contracts/common.md#clear-and-simple-design Clock and camera transfer stay in their existing owners; named context options distinguish original handled-frame hooks from native renderer creation and terminal mount shutdown.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native render method is replaced, a handled frame without producer facts is not invented, and stopped controls cannot redraw a retired renderer; ordinary native drawing preflights the existing failed scene/shadow owners, preserving active settings and clock calculations.
 * @evidence contracts/common.md#meaningful-documentation Documentation gives handled-frame responsibility, explicit draw-before-completion, preserved guide clock, finite transfer time, terminal controls and public cleanup's native-proof limits.
 * @evidence contracts/performance.md#efficient-algorithms Per-frame coordination is fixed plus producer/render/observer cost; no scene traversal is added to active draws, while shutdown delegates shadow traversal and fixed renderer/compositor retirement.
 * @evidence contracts/performance.md#reuse-equivalent-work Handled record identity suppresses repeated idle publication and the current completed clock is preserved for guides; stop shares one sticky attempt and equal frame metadata is not independent pixel/source equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one scheduled RAF is retained and cancelled on stop; initialization/frame failure attempts acquired renderer cleanup, closed controls refuse new effects and borrowed model resources remain caller-owned. Public disposal is not independent OS/GPU kernel release proof.
 */
export const mountViewer: (canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.PerspectiveCamera, onFrame: ViewerFrameProducer, options?: IMountViewerOptions) => IAutoMovieViewerHandle = (
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  onFrame: ViewerFrameProducer,
  options?: IMountViewerOptions,
): IAutoMovieViewerHandle => {
  const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    canvas,
    antialias: options?.antialias ?? true,
    preserveDrawingBuffer: options?.preserveDrawingBuffer ?? false,
  });
  let running: boolean = true;
  let scheduled: number | undefined;
  try {
  if (options?.pixelRatio !== undefined)
    renderer.setPixelRatio(options.pixelRatio);
  const resize: () => void = (): void => {
    const w: number = canvas.clientWidth || 1;
    const h: number = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  let startMs: number | null = null;
  const clock: ReturnType<typeof createViewerDisplayClock> = createViewerDisplayClock();
  let timeOffset: number = 0;
  let pauses: number = 0;
  const cameraState: ReturnType<typeof createViewerCameraState> = createViewerCameraState(camera);
  let lastCompleted: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined;
  let completions: number = 0;
  function active(): void { if (!running) throw new Error("The mounted viewer is closed."); }
  const control: NonNullable<IAutoMovieViewerCompletedFrame["control"]> = {
    capture: (): unknown => ({ camera: cameraState.capture(), elapsedSeconds: clock.current() }),
    restore: (state: unknown): void => {
      active();
      if (state === null || typeof state !== "object") throw new Error("Viewer transfer is not an object.");
      const seconds: unknown = Reflect.get(state, "elapsedSeconds");
      if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0)
        throw new Error("Viewer transfer has no valid time.");
      cameraState.restore(Reflect.get(state, "camera"));
      timeOffset = seconds;
      startMs = null;
      redraw(seconds);
    },
    redraw: (): void => { active(); redraw(); },
    freeze: (): (() => void) => {
      active();
      ++pauses;
      let released: boolean = false;
      return (): void => {
        if (released) return;
        released = true;
        if (--pauses === 0) { timeOffset = clock.current(); startMs = null; }
      };
    },
  };
  const draw: (seconds: number, explicitDraw?: boolean) => void = (seconds: number, explicitDraw: boolean = false): void => {
    active();
    clock.run(seconds, (): void => {
      const handled: unknown = onFrame(seconds);
      if (!running) return;
      if (handled !== true) {
        guardAutoMovieRenderModeRetirement(scene);
        guardAutoMovieSceneShadowRetirement(scene, renderer);
        renderer.render(scene, camera);
      }
      complete(handled === true ? undefined : { scene, camera, pass: "beauty", elapsedSeconds: seconds }, explicitDraw ? seconds : undefined, explicitDraw);
    });
  };
  const complete: (ordinary?: Omit<IAutoMovieViewerCompletedFrame, "control">, seconds?: number, explicitDraw?: boolean) => void = (ordinary?: Omit<IAutoMovieViewerCompletedFrame, "control">, seconds?: number, explicitDraw: boolean = false): void => {
    active();
    const completed: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined = options?.completedFrame?.() ?? ordinary;
    active();
    if (completed === undefined || (!explicitDraw && completed === lastCompleted)) return;
    lastCompleted = completed;
    // An idle handled frame has not advanced the published viewport clock.
    const elapsedSeconds: number = clock.complete(seconds ?? completed.elapsedSeconds);
    ++completions;
    publishViewerCompletedFrame(canvas, { ...completed, elapsedSeconds, control }, explicitDraw);
  };
  const redraw: (seconds?: number) => void = (seconds: number = clock.current()): void => {
    active();
    const before: number = completions;
    clock.run(seconds, (): void => {
      if (options?.redrawCompleted !== undefined) {
        options.redrawCompleted();
        if (completions === before) complete(undefined, seconds, true);
      } else draw(seconds, true);
    });
    if (completions === before) throw new Error("The original viewer producer did not complete its redraw.");
  };

  const stop: () => void = restoreAutoMovieRenderModeOnce((): void => {
    releaseMountedViewer(renderer, scene, (): void => {
      running = false;
      if (scheduled !== undefined) cancelAnimationFrame(scheduled);
      scheduled = undefined;
    });
  });
  const loop: (nowMs: number) => void = (nowMs: number): void => {
    scheduled = undefined;
    if (!running) return;
    if (startMs === null) startMs = nowMs;
    try {
      draw(pauses > 0 ? clock.current() : timeOffset + (nowMs - startMs) / 1000);
      if (running) scheduled = requestAnimationFrame(loop);
    } catch (error) {
      restoreAutoMovieRenderModeState([stop], { error });
    }
  };
  scheduled = requestAnimationFrame(loop);

  return {
    renderer,
    completeFrame: (seconds: number | undefined): void => {
      active();
      const publish: () => void = (): void => complete({ scene, camera, pass: "beauty" }, seconds, true);
      if (seconds === undefined) publish();
      else clock.run(seconds, publish);
    },
    stop,
  };
  } catch (error) {
    restoreAutoMovieRenderModeState([
      (): void => { running = false; if (scheduled !== undefined) cancelAnimationFrame(scheduled); },
      (): void => { releaseViewerRenderer(renderer); },
    ], { error });
  }
};
