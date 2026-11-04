import { createViewerViewportResize } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * Public viewport synchronization preserves CSS units and native projection.
 *
 * Scenarios:
 * 1. A CSS-only resize updates drawing-buffer dimensions and camera projection.
 * 2. Identical dimensions are idle; DPR-only and externally changed projection are repaired independently.
 * 3. Fractional DPR is retained and invalid/overflowing extents refuse before mutation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual public viewport adapter with a declared renderer port and real PerspectiveCamera; observes native-size calls, retained logical dimensions/ratio, aspect and native projection after layout/DPR/projection changes.
 * @evidence contracts/testing.md#independent-expectations Authored 1100-by-619 CSS dimensions define aspect and the renderer call independently; a fresh native PerspectiveCamera with those authored dimensions supplies the projection reference. Identical inputs require no resize, and invalid requests require no side effects.
 * @evidence contracts/testing.md#distinguishing-cases Covers CSS-only, unchanged, DPR-only, projection-only and fractional-ratio updates plus zero, negative, noninteger, NaN and overflowing/zero physical extents. Browser layout observation, actual backing pixels, paused/frozen redraw and renderer retirement remain operator validation.
 * @evidence contracts/testing.md#execution-ownership Portable named unit invokes actual source through a declared controlled renderer seam and native CPU camera objects; no browser, renderer context, filesystem, global or foreign method replacement runs.
 */
export function test_viewer_viewport_resize(): void {
  let width: number = 1280;
  let height: number = 715;
  let ratio: number = 1;
  const calls: { width: number; height: number; pixelRatio: number }[] = [];
  const renderer: Pick<
    THREE.WebGLRenderer,
    "getSize" | "getPixelRatio" | "setDrawingBufferSize"
  > = {
    getSize: (target: THREE.Vector2): THREE.Vector2 =>
      target.set(width, height),
    getPixelRatio: (): number => ratio,
    setDrawingBufferSize: (w: number, h: number, pixelRatio: number): void => {
      width = w;
      height = h;
      ratio = pixelRatio;
      calls.push({ width: w, height: h, pixelRatio });
    },
  };
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    42,
    1280 / 715,
    0.2,
    90,
  );
  const resize: ReturnType<typeof createViewerViewportResize> =
    createViewerViewportResize(renderer, camera);
  TestValidator.predicate(
    "CSS-only resize invalidates original frame",
    resize(1100, 619, 1),
  );
  TestValidator.equals("actual native logical dimensions", calls, [
    { width: 1100, height: 619, pixelRatio: 1 },
  ]);
  TestValidator.predicate(
    "camera aspect follows CSS",
    nclose(camera.aspect, 1100 / 619, 0),
  );
  const expected: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    42,
    1100 / 619,
    0.2,
    90,
  );
  TestValidator.predicate(
    "native projection follows resized aspect",
    camera.projectionMatrix.elements.every(
      (value: number, index: number): boolean =>
        nclose(value, expected.projectionMatrix.elements[index]!, 1e-12),
    ),
  );
  TestValidator.predicate(
    "identical viewport stays idle",
    !resize(1100, 619, 1),
  );
  TestValidator.equals("idle did not rebuild drawing buffer", calls.length, 1);
  TestValidator.predicate("DPR-only change invalidates", resize(1100, 619, 2));
  TestValidator.equals("DPR retained without changing CSS units", calls[1], {
    width: 1100,
    height: 619,
    pixelRatio: 2,
  });
  camera.aspect = 2;
  camera.updateProjectionMatrix();
  TestValidator.predicate(
    "projection-only change invalidates",
    resize(1100, 619, 2),
  );
  TestValidator.equals(
    "projection correction did not rebuild backing",
    calls.length,
    2,
  );
  TestValidator.predicate("fractional DPR supported", resize(1100, 619, 1.5));
  TestValidator.equals("fractional ratio retained", calls[2], {
    width: 1100,
    height: 619,
    pixelRatio: 1.5,
  });
  const before: number = calls.length;
  for (const values of [
    [0, 619, 1],
    [-1, 619, 1],
    [1100.5, 619, 1],
    [1100, NaN, 1],
    [1100, 619, 0],
    [1100, 619, Infinity],
    [1100, 619, Number.MAX_VALUE],
    [1, 1, 0.5],
  ])
    assert.throws((): boolean => resize(values[0]!, values[1]!, values[2]!));
  TestValidator.equals(
    "invalid inputs leave backing unchanged",
    calls.length,
    before,
  );
  TestValidator.predicate(
    "invalid inputs preserve native camera",
    nclose(camera.aspect, 1100 / 619, 0),
  );
}
