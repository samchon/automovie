import {
  restoreAutoMovieRenderModeOnce,
  restoreAutoMovieRenderModeState,
} from "@automovie/render";
import type * as THREE from "three";

import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";
import { createViewerCameraState } from "./createViewerCameraState.js";

/**
 * Own a mounted frame's camera/time controller and nested playback freezes.
 * Normal ticks run only outside a freeze; explicit redraw and restoration still
 * use the original producer. A producer-owned clock or audio supplies its own
 * freeze lease. Only the final normal release resumes it; disposal releases it
 * with resume=false. The borrowed camera is the mount's camera, so switching
 * active-camera or other application state needs that application's adapter.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Transfers the existing native camera snapshot and finite nonnegative completed seconds, then rebases and redraws through the original producer. Failed redraw independently restores the previous borrowed camera and mount base, preserving the source refusal before rollback causes; application graph/pixel rollback remains source-owned. Reference-counted freeze leases suppress producer ticks and pair the outermost producer pause with one final release, distinguishing resume from terminal disposal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the actual controller used by mountViewer without creating a renderer or a second clock. Camera transfer stays with createViewerCameraState, and source clocks/audio remain behind an explicit producer lease.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No timer, foreign method or synthetic completed frame is substituted. Invalid state refuses before camera mutation; a failed release preserves its cause and refuses further playback until terminal cleanup.
 * @evidence contracts/development/common.md#meaningful-documentation States nested ownership, explicit-draw behavior, terminal versus resumable release, borrowed camera scope and independent source-state responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Tick gating and lease accounting use constant work/storage; camera snapshots use the existing fixed-size native adapter and producer operations retain their own cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nested freezes share one outer producer lease; every returned release and terminal cleanup has one sticky attempt. Distinct redraws remain real producer effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one borrowed camera, callbacks, scalar lease count and at most one producer release. Final release or dispose consumes that release once; disposed controllers reject later effects and acquired producer resources remain governed by the producer's release callback.
 */
export function createViewerFrameControl(options: {
  /** Native camera owned by this mount; other active cameras need their source adapter. */
  camera: THREE.Camera;
  /** Actual completed scene time, in seconds. */
  currentSeconds: () => number;
  /** Refuse operations after the mounted owner has stopped. */
  assertActive: () => void;
  /** Rebase the mount clock before an explicit restored draw or resumed tick. */
  rebase: (seconds: number) => void;
  /** Complete an original draw at these authoritative scene seconds. */
  redraw: (seconds: number) => void;
  /** Optional source pause; release(true) resumes, release(false) retires without resuming. */
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
    capture: (): unknown => {
      active();
      return {
        camera: cameraState.capture(),
        elapsedSeconds: options.currentSeconds(),
      };
    },
    restore: (state: unknown): void => {
      active();
      if (state === null || typeof state !== "object")
        throw new Error("Viewer transfer is not an object.");
      const seconds: unknown = Reflect.get(state, "elapsedSeconds");
      if (
        typeof seconds !== "number" ||
        !Number.isFinite(seconds) ||
        seconds < 0
      )
        throw new Error("Viewer transfer has no valid time.");
      const previousCamera: ReturnType<typeof cameraState.capture> =
        cameraState.capture();
      const previousSeconds: number = options.currentSeconds();
      cameraState.restore(Reflect.get(state, "camera"));
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
