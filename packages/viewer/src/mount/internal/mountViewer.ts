import {
  guardAutoMovieRenderModeRetirement,
  guardAutoMovieSceneShadowRetirement,
  releaseViewerRenderer,
  restoreAutoMovieRenderModeOnce,
  restoreAutoMovieRenderModeState,
} from "@automovie/render";
import * as THREE from "three";

import type { IAutoMovieViewerCompletedFrame } from "../../IAutoMovieViewerCompletedFrame.js";
import type { IAutoMovieViewerHandle } from "../../IAutoMovieViewerHandle.js";
import type { IMountViewerOptions } from "../../IMountViewerOptions.js";
import { createViewerDisplayClock } from "../../createViewerDisplayClock.js";
import { createViewerFrameControl } from "../../createViewerFrameControl.js";
import { createViewerViewportResize } from "../../createViewerViewportResize.js";
import { publishViewerCompletedFrame } from "../../publishViewerCompletedFrame.js";
import { redrawViewerCompletedFrame } from "../../redrawViewerCompletedFrame.js";
import type { AutoMovieViewer } from "../AutoMovieViewer.js";
import { releaseMountedViewer } from "./releaseMountedViewer.js";

/**
 * Mount a render loop onto a canvas: create a `WebGLRenderer`, drive
 * `onFrame(elapsedSeconds)` each animation frame, then render `scene` from
 * `camera`.
 *
 * This is the one browser-only entry point. `onFrame` is where a
 * {@link AutoMovieRenderPlayer} advances: the viewer stays a thin shell around
 * the deterministic engine. `elapsedSeconds` is measured from the first frame. If
 * `onFrame` returns `true` it has **already drawn** the frame itself (e.g. a
 * multi-pass cross-dissolve composite), so the loop skips its own default
 * `render`; returning `undefined`/`false` keeps the plain single-pass render.
 * External seek/guide producers call the returned `completeFrame` immediately
 * after their original draw, before an unpreserved native buffer can clear. A
 * manual guide retains the completed clock; a seek supplies its own seconds.
 * Freezes suppress animation producer calls; explicit redraw/restoration still
 * uses the original producer. Independently advancing source clocks or audio
 * supply `freezeCompleted` and restore their source time through
 * `redrawCompleted`.
 */
export function mountViewer(
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  onFrame: AutoMovieViewer.FrameProducer,
  options?: IMountViewerOptions,
): IAutoMovieViewerHandle {
  const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    canvas,
    antialias: options?.antialias ?? true,
    preserveDrawingBuffer: options?.preserveDrawingBuffer ?? false,
  });
  let running: boolean = true;
  let scheduled: number | undefined;
  let frameControl: ReturnType<typeof createViewerFrameControl> | undefined;
  try {
    const resize: ReturnType<typeof createViewerViewportResize> =
      createViewerViewportResize(renderer, camera);
    function synchronizeViewport(): boolean {
      return resize(
        canvas.clientWidth || 1,
        canvas.clientHeight || 1,
        options?.pixelRatio ??
          (window.devicePixelRatio > 0 ? window.devicePixelRatio : 1),
      );
    }
    synchronizeViewport();

    let startMs: number | null = null;
    const clock: ReturnType<typeof createViewerDisplayClock> =
      createViewerDisplayClock();
    let timeOffset: number = 0;
    let lastCompleted:
      | Omit<IAutoMovieViewerCompletedFrame, "control">
      | undefined;
    let completions: number = 0;
    function active(): void {
      if (!running) throw new Error("The mounted viewer is closed.");
    }
    const ownedControl: ReturnType<typeof createViewerFrameControl> =
      createViewerFrameControl({
        camera,
        currentSeconds: (): number => clock.current(),
        assertActive: active,
        rebase: (seconds: number): void => {
          timeOffset = seconds;
          startMs = null;
        },
        redraw,
        freezeCompleted: options?.freezeCompleted,
      });
    frameControl = ownedControl;
    const control: NonNullable<IAutoMovieViewerCompletedFrame["control"]> =
      ownedControl.control;
    function draw(seconds: number, explicitDraw: boolean = false): void {
      active();
      clock.run(seconds, (): void => {
        const handled: unknown = onFrame(seconds);
        if (!running) return;
        if (handled !== true) {
          guardAutoMovieRenderModeRetirement(scene);
          guardAutoMovieSceneShadowRetirement(scene, renderer);
          renderer.render(scene, camera);
        }
        // Explicit handled redraws are admitted by the enclosing freshness
        // boundary, or by the original producer's own completeFrame call.
        // Automatic completion here would relabel an unchanged untimed record.
        if (handled === true && explicitDraw) return;
        complete(
          handled === true
            ? undefined
            : { scene, camera, pass: "beauty", elapsedSeconds: seconds },
          explicitDraw ? seconds : undefined,
          explicitDraw,
        );
      });
    }
    function complete(
      ordinary?: Omit<IAutoMovieViewerCompletedFrame, "control">,
      seconds?: number,
      explicitDraw: boolean = false,
    ): void {
      active();
      const completed:
        | Omit<IAutoMovieViewerCompletedFrame, "control">
        | undefined = options?.completedFrame?.() ?? ordinary;
      if (completed !== undefined)
        publishCompleted(completed, seconds, explicitDraw);
    }
    function publishCompleted(
      completed: Omit<IAutoMovieViewerCompletedFrame, "control">,
      seconds?: number,
      explicitDraw: boolean = false,
    ): void {
      active();
      if (!explicitDraw && completed === lastCompleted) return;
      if (
        seconds !== undefined &&
        completed.elapsedSeconds !== undefined &&
        seconds !== completed.elapsedSeconds
      )
        throw new Error(
          "Requested completion time differs from the original producer's completed time.",
        );

      // An idle handled frame has not advanced the published viewport clock.
      const elapsedSeconds: number = clock.complete(
        seconds ?? completed.elapsedSeconds,
      );
      lastCompleted = completed;
      ++completions;
      publishViewerCompletedFrame(
        canvas,
        { ...completed, elapsedSeconds, control },
        explicitDraw,
      );
    }
    function redraw(seconds: number = clock.current()): void {
      active();
      clock.run(seconds, (): void => {
        redrawViewerCompletedFrame(seconds, {
          completedCount: (): number => completions,
          completedSeconds: (): number => clock.current(),
          readFrame: ():
            | Omit<IAutoMovieViewerCompletedFrame, "control">
            | undefined => options?.completedFrame?.(),
          produce: (time: number): void => {
            if (options?.redrawCompleted !== undefined)
              options.redrawCompleted(time);
            else draw(time, true);
          },
          publish: (
            frame: Omit<IAutoMovieViewerCompletedFrame, "control">,
            time: number,
          ): void => publishCompleted(frame, time, true),
        });
      });
    }

    const stop: () => void = restoreAutoMovieRenderModeOnce((): void => {
      releaseMountedViewer(renderer, scene, (): void => {
        running = false;
        if (scheduled !== undefined) cancelAnimationFrame(scheduled);
        scheduled = undefined;
        ownedControl.dispose();
      });
    });
    function loop(nowMs: number): void {
      scheduled = undefined;
      if (!running) return;
      if (startMs === null) startMs = nowMs;
      try {
        if (synchronizeViewport() && completions > 0) redraw(clock.current());
        ownedControl.frame((): void =>
          draw(timeOffset + (nowMs - startMs!) / 1000),
        );
        if (running) scheduled = requestAnimationFrame(loop);
      } catch (error) {
        restoreAutoMovieRenderModeState([stop], { error });
      }
    }
    scheduled = requestAnimationFrame(loop);

    return {
      renderer,
      completeFrame: (seconds: number | undefined): void => {
        active();
        function publish(): void {
          complete({ scene, camera, pass: "beauty" }, seconds, true);
        }
        if (seconds === undefined) publish();
        else clock.run(seconds, publish);
      },
      stop,
    };
  } catch (error) {
    restoreAutoMovieRenderModeState(
      [
        (): void => {
          running = false;
          if (scheduled !== undefined) cancelAnimationFrame(scheduled);
        },
        (): void => {
          frameControl?.dispose();
        },
        (): void => {
          releaseViewerRenderer(renderer);
        },
      ],
      { error },
    );
  }
}
