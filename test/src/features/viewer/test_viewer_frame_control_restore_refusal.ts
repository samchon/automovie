import { createViewerFrameControl } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * A failed original restore preserves borrowed camera and mount base.
 *
 * Scenarios:
 * 1. Source refusal after camera transfer restores the preceding camera/base and original cause.
 * 2. Valid source restoration still transfers requested native camera/time.
 * 3. Independent camera and mount rollback failures retain the source cause first.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual public frame controller with native camera snapshots and a source that refuses0 but admits4; observes camera/base restoration, source time, original failure identity and independent rollback attempts after native camera ownership changes.
 * @evidence contracts/testing.md#independent-expectations The pre-request camera at[1,2,3] and completed3.4 seconds must survive refused0. An admitted4-second transfer uses the authored camera[7,8,9]. A parented camera is refused by the existing native adapter, so simultaneous rollback failure must preserve original/source, camera refusal and mount rollback in order.
 * @evidence contracts/testing.md#distinguishing-cases Covers refused and admitted redraw, changed incoming camera, a source-owned retained frame, paired rollback failures and terminal disposal. Existing tests own malformed snapshots, nested freeze/resume and cleanup release failures; actual browser admission remains operator validation.
 * @evidence contracts/testing.md#execution-ownership Portable named unit uses the actual controller and native CPU cameras/groups through declared source ports; no browser, renderer, process, timer or replaced global/foreign method runs.
 */
export function test_viewer_frame_control_restore_refusal(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(42, 1.5, 0.1, 100);
  camera.position.set(1, 2, 3);
  let displayed: number = 3.4;
  let base: number = 3.4;
  const refusal: Error = new Error("source admission refused");
  const rebases: number[] = [];
  const owner: ReturnType<typeof createViewerFrameControl> = createViewerFrameControl({ camera, currentSeconds: (): number => displayed, assertActive: (): void => {}, rebase: (seconds: number): void => { base = seconds; rebases.push(seconds); }, redraw: (seconds: number): void => { if (seconds === 0) throw refusal; displayed = seconds; } });
  const original: unknown = owner.control.capture();
  camera.position.set(7, 8, 9);
  const incoming: unknown = owner.control.capture();
  owner.control.restore(original);
  assert.throws((): void => owner.control.restore({ ...(incoming as object), elapsedSeconds: 0 }), (error: unknown): boolean => error === refusal);
  TestValidator.predicate("refusal restored borrowed camera", nclose(camera.position.x, 1, 0) && nclose(camera.position.y, 2, 0) && nclose(camera.position.z, 3, 0));
  TestValidator.equals("refusal retained source clock", displayed, 3.4);
  TestValidator.equals("refusal restored mount base", base, 3.4);
  TestValidator.equals("requested and rollback bases are distinct", rebases.slice(-2), [0, 3.4]);
  owner.control.restore({ ...(incoming as object), elapsedSeconds: 4 });
  TestValidator.equals("valid restore transfers source time", displayed, 4);
  TestValidator.predicate("valid restore transfers camera", nclose(camera.position.x, 7, 0) && nclose(camera.position.y, 8, 0) && nclose(camera.position.z, 9, 0));
  owner.dispose();

  const changedCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const parent: THREE.Group = new THREE.Group();
  const sourceFailure: Error = new Error("source changed camera owner then refused");
  const baseFailure: Error = new Error("mount rollback refused");
  let baseAttempts: number = 0;
  const failed: ReturnType<typeof createViewerFrameControl> = createViewerFrameControl({ camera: changedCamera, currentSeconds: (): number => 3.4, assertActive: (): void => {}, rebase: (seconds: number): void => { ++baseAttempts; if (seconds === 3.4) throw baseFailure; }, redraw: (): never => { parent.add(changedCamera); throw sourceFailure; } });
  const transfer: unknown = failed.control.capture();
  let caught: unknown;
  try { failed.control.restore({ ...(transfer as object), elapsedSeconds: 0 }); } catch (error) { caught = error; }
  TestValidator.predicate("all independent restore failures retained", caught instanceof AggregateError && caught.errors.length === 3 && caught.errors[0] === sourceFailure && caught.errors[1] instanceof Error && caught.errors[2] === baseFailure);
  TestValidator.equals("base rollback attempted despite native camera refusal", baseAttempts, 2);
  changedCamera.removeFromParent();
  failed.dispose();
}
