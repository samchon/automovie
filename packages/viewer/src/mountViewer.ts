import * as THREE from "three";

import type {IAutoMovieViewerHandle} from "./IAutoMovieViewerHandle.js";
import {releaseMountedViewer} from "./releaseMountedViewer.js";
import { createViewerCameraState } from "./createViewerCameraState.js";
import { createViewerDisplayClock } from "./createViewerDisplayClock.js";
import { publishViewerCompletedFrame } from "./publishViewerCompletedFrame.js";
import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Mount a render loop onto a canvas: create a `WebGLRenderer`, drive
 * `onFrame(elapsedSeconds)` each animation frame, then render `scene` from
 * `camera`.
 *
 * This is the one browser-only entry point. `onFrame` is where a
 * {@link AutoMoviePlayer} advances: the viewer stays a thin shell around the
 * deterministic engine. `elapsedSeconds` is measured from the first frame. If
 * `onFrame` returns `true` it has **already drawn** the frame itself (e.g. a
 * multi-pass cross-dissolve composite), so the loop skips its own default
 * `render`; returning `void`/`false` keeps the plain single-pass render.
 * External seek/guide producers call the returned `completeFrame` immediately
 * after their original draw, before an unpreserved native buffer can clear.
 * A manual guide retains the completed clock; a seek supplies its own seconds.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Owns the browser renderer and animation loop until the returned handle releases them.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Keeps that interactive runtime state inside one explicit viewer lifecycle.
 * @author Samchon
 */
export const mountViewer = (
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  onFrame: (elapsedSeconds: number) => boolean | undefined,
  options?: {
    /**
     * Multisample antialiasing (#1169). Defaults to `true` for live viewing; a
     * CAPTURE path turns it off so structural guide passes (mask/pose/
     * outline/depth) read back crisp and GPU-independent. AA blends segment
     * colors across edges and varies by hardware, breaking byte-stable frames.
     * A WebGL context's AA is fixed at creation, so this is per-mount (the
     * capture route), not per-pass.
     */
    antialias?: boolean;

    /**
     * Canvas pixel ratio (#1169). Defaults to the renderer's own default; a
     * capture path pins `1` so frame pixel dimensions never follow the host's
     * device-pixel-ratio.
     */
    pixelRatio?: number;

    /**
     * Keep the last drawn framebuffer available to a deterministic capture host
     * after its explicit render call. Defaults to `false` for live playback;
     * screenshot and readback hosts opt in.
     */
    preserveDrawingBuffer?: boolean;
    /** Actual drawn scene/camera/pass from a handled-frame owner; absent means no completed observation. */
    completedFrame?: () => Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined;
    /** Reproduce the current handled frame through its original draw owner. */
    redrawCompleted?: () => void;
  },
): IAutoMovieViewerHandle => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: options?.antialias ?? true,
    preserveDrawingBuffer: options?.preserveDrawingBuffer ?? false,
  });
  if (options?.pixelRatio !== undefined)
    renderer.setPixelRatio(options.pixelRatio);
  const resize = (): void => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  let running = true;
  let startMs: number | null = null;
  const clock = createViewerDisplayClock();
  let timeOffset = 0;
  let pauses = 0;
  const cameraState = createViewerCameraState(camera);
  let lastCompleted: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined;
  let completions = 0;
  const control = {
    capture: () => ({ camera: cameraState.capture(), elapsedSeconds: clock.current() }),
    restore: (state: unknown): void => {
      if (state === null || typeof state !== "object") throw new Error("Viewer transfer is not an object.");
      const seconds: unknown = Reflect.get(state, "elapsedSeconds");
      if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0)
        throw new Error("Viewer transfer has no valid time.");
      cameraState.restore(Reflect.get(state, "camera"));
      timeOffset = seconds;
      startMs = null;
      redraw(seconds);
    },
    redraw: (): void => redraw(),
    freeze: (): (() => void) => {
      ++pauses;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        if (--pauses === 0) { timeOffset = clock.current(); startMs = null; }
      };
    },
  };
  const draw = (seconds: number, explicitDraw = false): void => {
    clock.run(seconds, () => {
      const handled = onFrame(seconds);
      if (handled !== true) renderer.render(scene, camera);
      complete(handled === true ? undefined : { scene, camera, pass: "beauty", elapsedSeconds: seconds }, explicitDraw ? seconds : undefined, explicitDraw);
    });
  };
  const complete = (ordinary?: Omit<IAutoMovieViewerCompletedFrame, "control">, seconds?: number, explicitDraw = false): void => {
    const completed = options?.completedFrame?.() ?? ordinary;
    if (completed === undefined || (!explicitDraw && completed === lastCompleted)) return;
    lastCompleted = completed;
    // An idle handled frame has not advanced the published viewport clock.
    const elapsedSeconds = clock.complete(seconds ?? completed.elapsedSeconds);
    ++completions;
    publishViewerCompletedFrame(canvas, { ...completed, elapsedSeconds, control }, explicitDraw);
  };
  const redraw = (seconds = clock.current()): void => {
    const before = completions;
    clock.run(seconds, () => {
      if (options?.redrawCompleted !== undefined) {
        options.redrawCompleted();
        if (completions === before) complete(undefined, seconds, true);
      } else draw(seconds, true);
    });
    if (completions === before) throw new Error("The original viewer producer did not complete its redraw.");
  };

  const loop = (nowMs: number): void => {
    if (!running) return;
    if (startMs === null) startMs = nowMs;
    draw(pauses > 0 ? clock.current() : timeOffset + (nowMs - startMs) / 1000);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return {
    renderer,
    completeFrame: (seconds): void => {
      const publish = (): void => complete({ scene, camera, pass: "beauty" }, seconds, true);
      if (seconds === undefined) publish();
      else clock.run(seconds, publish);
    },
    stop: (): void => {
      releaseMountedViewer(renderer,scene,()=>{running=false;});
    },
  };
};
