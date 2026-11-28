import { AutoMovieViewerDisplay } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

/**
 * Original redraw admission distinguishes a new completion from retained
 * pixels.
 *
 * Scenarios:
 *
 * 1. Retained timed and untimed records cannot attest different- or same-time
 *    redraws.
 * 2. A legacy void producer can expose a fresh matching or untimed record.
 * 3. Explicit completion is not duplicated; mismatched clocks and original refusal
 *    reject.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Accepts fresh matching completion from original redraw and refuses stale records and wrong clocks.
 * @evidence contracts/development/testing.md#behavioral-verification Calls redraw with retained and new timed or untimed records, explicit completion, mismatched time, and a throwing producer.
 * @evidence contracts/development/testing.md#independent-expectations The known requested and completed seconds and event counts distinguish independent fresh work from retained pixels. One explicit completion must not produce a duplicate event.
 */
export function test_viewer_root_redraw_completed_frame(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const clock: AutoMovieViewerDisplay.IClock =
    AutoMovieViewerDisplay.createClock();
  clock.complete(3.4);
  let count: number = 1;
  let current: Omit<AutoMovieViewerDisplay.ICompletedFrame, "control"> | undefined = {
    scene,
    camera,
    pass: "beauty",
    elapsedSeconds: 3.4,
  };
  const publish: (
    frame: Omit<AutoMovieViewerDisplay.ICompletedFrame, "control">,
    seconds: number,
  ) => void = (
    _frame: Omit<AutoMovieViewerDisplay.ICompletedFrame, "control">,
    seconds: number,
  ): void => {
    ++count;
    clock.complete(seconds);
  };
  const redraw: (
    seconds: number,
    produce: (seconds: number) => void,
  ) => void = (seconds: number, produce: (seconds: number) => void): void =>
    AutoMovieViewerDisplay.redrawCompletedFrame({
      seconds,
      options: {
        completedCount: (): number => count,
        completedSeconds: (): number => clock.current(),
        readFrame: (): typeof current => current,
        produce,
        publish,
      },
    });
  assert.throws((): void => redraw(0, (): void => {}));
  TestValidator.equals("stale frame was not published", count, 1);
  TestValidator.equals(
    "stale request kept actual completed clock",
    clock.current(),
    3.4,
  );
  assert.throws((): void => redraw(3.4, (): void => {}));
  current = { scene, camera, pass: "beauty" };
  assert.throws((): void => redraw(0, (): void => {}));
  assert.throws((): void => redraw(3.4, (): void => {}));
  TestValidator.equals(
    "retained untimed handled record never attests a redraw",
    count,
    1,
  );
  TestValidator.equals(
    "untimed refusal preserves the last actual completed clock",
    clock.current(),
    3.4,
  );
  redraw(4, (): void => {
    current = { scene, camera, pass: "beauty", elapsedSeconds: 4 };
  });
  TestValidator.equals("legacy void matching frame publishes once", count, 2);
  TestValidator.equals("legacy frame actual clock", clock.current(), 4);
  redraw(5, (): void => {
    current = { scene, camera, pass: "beauty" };
  });
  TestValidator.equals(
    "fresh untimed original draw inherits requested clock",
    clock.current(),
    5,
  );
  redraw(6, (): void => {
    current = { scene, camera, pass: "beauty", elapsedSeconds: 6 };
    publish(current, 6);
  });
  TestValidator.equals("explicit draw was not duplicated", count, 4);
  assert.throws((): void =>
    redraw(0, (): void => {
      current = { scene, camera, pass: "beauty", elapsedSeconds: 6 };
    }),
  );
  TestValidator.equals("fresh mismatched record was not relabeled", count, 4);
  const refusal: Error = new Error("original source refused");
  assert.throws(
    (): void =>
      redraw(0, (): never => {
        throw refusal;
      }),
    (error: unknown): boolean => error === refusal,
  );
  TestValidator.equals("throwing source published nothing", count, 4);
  assert.throws((): void =>
    redraw(7, (): void => {
      current = { scene, camera, pass: "beauty", elapsedSeconds: 6 };
      publish(current, 6);
    }),
  );
  TestValidator.equals(
    "mismatched explicit draw keeps its actual clock",
    clock.current(),
    6,
  );
  assert.throws((): void =>
    redraw(8, (): void => {
      current = undefined;
    }),
  );
  assert.throws((): void =>
    AutoMovieViewerDisplay.redrawCompletedFrame({
      seconds: 9,
      options: {
        completedCount: (): number => count,
        completedSeconds: (): number => clock.current(),
        readFrame: (): typeof current => current,
        produce: (): void => {
          current = { scene, camera, pass: "beauty", elapsedSeconds: 9 };
        },
        publish: (): void => {},
      },
    }),
  );
}
