import type { IViewerFrameTransfer } from "@automovie/viewer";
import { createViewerFrameControl } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `createViewerFrameControl` captures and restores the camera and clock, pauses
 * frame production while frozen, and closes on dispose.
 *
 * Scenarios, over a detached perspective camera at x = 1 and a clock at 3 s:
 *
 * 1. Capture reports the camera at x = 1 and 3 s.
 * 2. Restoring a capture taken at x = 2 rebases and redraws at that second.
 * 3. While frozen no frame is produced; releasing rebases and resumes.
 * 4. A failing redraw puts the camera back; after dispose capture throws.
 */
export function test_unit_viewer_root_frame_control(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  camera.position.set(1, 0, 0);
  let seconds: number = 3;
  const log: string[] = [];
  let failing: boolean = false;
  const controller: ReturnType<typeof createViewerFrameControl> =
    createViewerFrameControl({
      camera,
      currentSeconds: (): number => seconds,
      assertActive: (): void => {},
      rebase: (at: number): void => {
        seconds = at;
        log.push(`rebase ${at}`);
      },
      redraw: (at: number): void => {
        if (failing) throw new Error("redraw failed");
        log.push(`redraw ${at}`);
      },
      freezeCompleted:
        (): ((resume: boolean) => void) =>
        (resume: boolean): void => {
          log.push(`resume ${resume}`);
        },
    });
  const first: IViewerFrameTransfer = controller.control.capture();
  TestValidator.equals(
    "capture",
    [first.camera.position, first.elapsedSeconds],
    [[1, 0, 0], 3],
  );
  camera.position.set(2, 0, 0);
  const moved: IViewerFrameTransfer = controller.control.capture();
  camera.position.set(1, 0, 0);
  controller.control.restore({ ...moved, elapsedSeconds: 4 });
  TestValidator.equals(
    "restore",
    [camera.position.x, log],
    [2, ["rebase 4", "redraw 4"]],
  );
  log.length = 0;
  const freeze: (() => () => void) | undefined = controller.control.freeze;
  if (freeze === undefined) throw new Error("The frame control lends freezes.");
  const thaw: () => void = freeze();
  let produced: number = 0;
  controller.frame((): void => {
    produced++;
  });
  thaw();
  controller.frame((): void => {
    produced++;
  });
  TestValidator.equals(
    "freeze and release",
    [produced, log],
    [1, ["rebase 4", "resume true"]],
  );
  failing = true;
  TestValidator.error("a failing redraw", (): void =>
    controller.control.restore({ ...first, elapsedSeconds: 1 }),
  );
  TestValidator.equals("the camera put back", camera.position.x, 2);
  controller.dispose();
  TestValidator.error(
    "after dispose",
    (): IViewerFrameTransfer => controller.control.capture(),
  );
}
