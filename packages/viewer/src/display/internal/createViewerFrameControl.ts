import { AutoMovieRenderSceneRenderMode } from "@automovie/render";
import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay.js";
import { createViewerCameraState } from "./createViewerCameraState.js";

/*
 * Own a mounted frame's camera/time controller and nested playback freezes.
 * Normal ticks run only outside a freeze; explicit redraw and restoration still
 * use the original producer. A producer-owned clock or audio supplies its own
 * freeze lease. Only the final normal release resumes it; disposal releases it
 * with resume=false. The borrowed camera is the mount's camera, so switching
 * active-camera or other application state needs that application's adapter.
 */
export function createViewerFrameControl(
  options: AutoMovieViewerDisplay.IFrameControlRequest,
): AutoMovieViewerDisplay.IFrameControl {
  const cameraState: ReturnType<typeof createViewerCameraState> =
    createViewerCameraState({ camera: options.camera });
  let leases: number = 0;
  let releaseProducer: ((resume: boolean) => void) | undefined;
  let closed: boolean = false;
  let failure: { error: unknown } | undefined;
  const active: () => void = (): void => {
    if (closed) throw new Error("The viewer frame controller is closed.");
    if (failure !== undefined) throw failure.error;
    options.assertActive();
  };
  const control: NonNullable<AutoMovieViewerDisplay.ICompletedFrame["control"]> = {
    capture: (): AutoMovieViewerDisplay.IFrameTransfer => {
      active();
      return {
        camera: cameraState.capture(),
        elapsedSeconds: options.currentSeconds(),
      };
    },
    restore: (state: AutoMovieViewerDisplay.IFrameTransfer): void => {
      active();
      const seconds: number = state.elapsedSeconds;
      if (seconds < 0) throw new Error("Viewer transfer has no valid time.");
      const previousCamera: AutoMovieViewerDisplay.ICameraStateSnapshot = cameraState.capture();
      const previousSeconds: number = options.currentSeconds();
      cameraState.restore(state.camera);
      try {
        options.rebase(seconds);
        options.redraw(seconds);
      } catch (error) {
        AutoMovieRenderSceneRenderMode.restoreState(
          [
            (): void => cameraState.restore(previousCamera),
            (): void => options.rebase(previousSeconds),
          ],
          { error },
        );
      }
    },
    redraw: (): void => {
      active();
      options.redraw(options.currentSeconds());
    },
    freeze: (): (() => void) => {
      active();
      if (leases === 0) releaseProducer = options.freezeCompleted?.();
      ++leases;
      return AutoMovieRenderSceneRenderMode.restoreOnce((): void => {
        if (closed || --leases !== 0) return;
        const release: ((resume: boolean) => void) | undefined =
          releaseProducer;
        releaseProducer = undefined;
        try {
          AutoMovieRenderSceneRenderMode.restoreState([
            (): void => options.rebase(options.currentSeconds()),
            (): void => {
              release?.(true);
            },
          ]);
        } catch (error) {
          failure = { error };
          throw error;
        }
      });
    },
  };
  return {
    control,
    frame: (produce: () => void): void => {
      active();
      if (leases === 0) produce();
    },
    dispose: AutoMovieRenderSceneRenderMode.restoreOnce((): void => {
      closed = true;
      leases = 0;
      const release: ((resume: boolean) => void) | undefined = releaseProducer;
      releaseProducer = undefined;
      release?.(false);
    }),
  };
}
