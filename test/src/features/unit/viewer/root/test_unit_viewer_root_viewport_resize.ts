import { createViewerViewportResize } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `createViewerViewportResize` resizes the drawing buffer and the camera's
 * aspect only when the CSS size, pixel ratio or aspect changed.
 *
 * Scenarios, with a renderer double that reports its last size:
 *
 * 1. 400×200 at ratio 2 on a fresh renderer resizes and sets aspect 2.
 * 2. The same call again changes nothing.
 * 3. A zero width is refused.
 */
export function test_unit_viewer_root_viewport_resize(): void {
  const size: { width: number; height: number; ratio: number } = {
    width: 0,
    height: 0,
    ratio: 1,
  };
  const calls: [number, number, number][] = [];
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const resize: (width: number, height: number, pixelRatio: number) => boolean =
    createViewerViewportResize(
      {
        getSize: (target: THREE.Vector2): THREE.Vector2 =>
          target.set(size.width, size.height),
        getPixelRatio: (): number => size.ratio,
        setDrawingBufferSize: (
          width: number,
          height: number,
          pixelRatio: number,
        ): void => {
          calls.push([width, height, pixelRatio]);
          Object.assign(size, { width, height, ratio: pixelRatio });
        },
      },
      camera,
    );
  TestValidator.predicate(
    "a fresh resize",
    resize(400, 200, 2) && camera.aspect === 2,
  );
  TestValidator.equals("an unchanged resize", resize(400, 200, 2), false);
  TestValidator.equals("one buffer resize", calls, [[400, 200, 2]]);
  TestValidator.error("a zero width", (): boolean => resize(0, 200, 2));
}
