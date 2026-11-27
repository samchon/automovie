import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspection.placeLabels` places each box's label at its projected
 * centre and drops those that overlap a kept one or fall off the picture.
 *
 * Scenarios:
 *
 * 1. Under a camera 5 m from the origin looking at it, a box centred there is
 *    labelled at the middle of a 200 by 100 picture with its last path name; the
 *    root path is `(root)`.
 * 2. A second box at the same place overlaps and is dropped; one behind the
 *    camera is dropped.
 * 3. A picture or scale of no size is refused.
 */
export function test_render_scene_place_inspection_labels(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.updateMatrixWorld(true);
  const box = (path: string, x: number, z: number = 0) => ({
    path,
    min: { x: x - 0.5, y: -0.5, z: z - 0.5 },
    max: { x: x + 0.5, y: 0.5, z: z + 0.5 },
  });
  const placed = AutoMovieRenderInspection.placeLabels({
    boxes: [box("hero/arm", 0), box("hero/hand", 0), box("", 0, 20), box("lamp", 3)],
    camera,
    width: 200,
    height: 100,
    scale: 1,
  });
  TestValidator.equals(
    "kept",
    placed.labels.map((label): [string, string, number, number] => [
      label.path,
      label.text,
      label.x,
      label.y,
    ]),
    [
      ["hero/arm", "arm", 100, 50],
      ["lamp", "lamp", placed.labels[1]!.x, 50],
    ],
  );
  TestValidator.equals(
    "dropped",
    placed.dropped.map((label): string => label.path),
    ["hero/hand", ""],
  );
  TestValidator.equals("root text", placed.dropped[1]!.text, "(root)");
  for (const patch of [{ width: 0 }, { height: 0 }, { scale: 0 }])
    TestValidator.error(JSON.stringify(patch), (): void => {
      AutoMovieRenderInspection.placeLabels({
        boxes: [],
        camera,
        width: 200,
        height: 100,
        scale: 1,
        ...patch,
      });
    });
}