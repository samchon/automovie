import {
  restoreAutoMovieRenderModeOnce,
  restoreAutoMovieRenderModeState,
} from "@automovie/render";
import type * as THREE from "three";

import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";
import type { IViewerCameraStateSnapshot } from "./IViewerCameraStateSnapshot.js";
import type { IViewerFrameTransfer } from "./IViewerFrameTransfer.js";
import { createViewerCameraState } from "./createViewerCameraState.js";

/**
 * Own a mounted frame's camera/time controller and nested playback freezes.
 * Normal ticks run only outside a freeze; explicit redraw and restoration still
 * use the original producer. A producer-owned clock or audio supplies its own
 * freeze lease. Only the final normal release resumes it; disposal releases it
 * with resume=false. The borrowed camera is the mount's camera, so switching
 * active-camera or other application state needs that application's adapter.
 */
export function createViewerFrameControl(options: {
  /**
   * Native camera owned by this mount; other active cameras need their source
   * adapter.
   */
  camera: THREE.Camera;
  /** Actual completed scene time, in seconds. */
  currentSeconds: () => number;
  /** Refuse operations after the mounted owner has stopped. */
  assertActive: () => void;
  /** Rebase the mount clock before an explicit restored draw or resumed tick. */
  rebase: (seconds: number) => void;
  /** Complete an original draw at these authoritative scene seconds. */
  redraw: (seconds: number) => void;
  /**
   * Optional source pause; release(true) resumes, release(false) retires
   * without resuming.
   */
  freezeCompleted?: () => (resume: boolean) => void;
}): {
  control: NonNullable<IAutoMovieViewerCompletedFrame["control"]>;
  frame: (produce: () => void) => void;
  dispose: () => void;
} {
  const cameraState: ReturnType<typeof createViewerCameraState> =
    createViewerCameraState(options.camera);
  let leases: number = 0;
  let releaseProducer: ((resume: boolean) => void) | undefined;
  let closed: boolean = false;
  let failure: { error: unknown } | undefined;
  const active: () => void = (): void => {
    if (closed) throw new Error("The viewer frame controller is closed.");
    if (failure !== undefined) throw failure.error;
    options.assertActive();
  };
  const control: NonNullable<IAutoMovieViewerCompletedFrame["control"]> = {
    capture: (): IViewerFrameTransfer => {
      active();
      return {
        camera: cameraState.capture(),
        elapsedSeconds: options.currentSeconds(),
      };
    },
    restore: (state: IViewerFrameTransfer): void => {
      active();
      const seconds: number = state.elapsedSeconds;
      if (!Number.isFinite(seconds) || seconds < 0)
        throw new Error("Viewer transfer has no valid time.");
      const previousCamera: IViewerCameraStateSnapshot = cameraState.capture();
      const previousSeconds: number = options.currentSeconds();
      cameraState.restore(state.camera);
      try {
        options.rebase(seconds);
        options.redraw(seconds);
      } catch (error) {
        restoreAutoMovieRenderModeState(
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
      return restoreAutoMovieRenderModeOnce((): void => {
        if (closed || --leases !== 0) return;
        const release: ((resume: boolean) => void) | undefined =
          releaseProducer;
        releaseProducer = undefined;
        try {
          restoreAutoMovieRenderModeState([
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
    dispose: restoreAutoMovieRenderModeOnce((): void => {
      closed = true;
      leases = 0;
      const release: ((resume: boolean) => void) | undefined = releaseProducer;
      releaseProducer = undefined;
      release?.(false);
    }),
  };
}
