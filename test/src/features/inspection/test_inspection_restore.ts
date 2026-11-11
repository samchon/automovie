import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieSectionRenderer,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * `restore` puts back everything an inspection changed and releases everything it made, and a second call changes nothing.
 *
 * Scenarios:
 *
 * 1. An inspection that isolates one of two quads, shades them clay, draws supplied line and point marks and measured open edges, and cuts the scene, while applied replaces the materials, takes the other quad off its layers, adds one child to the scene, sets the cut on the quads' materials and switches the renderer's clipping on.
 * 2. After `restore` the scene has its own children only, each quad its own material and layer mask, each material its prior clipping planes and intersection flag, the renderer its prior clipping switch, and every geometry and material the inspection made has been disposed.
 * 3. Marks replaced by `update` are disposed when replaced, and those that replaced them on `restore`.
 * 4. A second `restore` changes nothing and disposes nothing again.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection, records the scene's children, materials, masks, clipping state and the renderer flag before, during and after, and counts the dispose events of every geometry and material the inspection added.
 * @evidence contracts/development/testing.md#independent-expectations Expected restored state is the state the test recorded before applying, and every added resource must report one dispose, which is three.js's own release event.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts the state during an inspection against after it, the first restore against a second, and marks released on replacement against marks released on restore. A refused request's rollback belongs to `test_inspection_mark_color_law` and `test_inspection_mark_kind_unknown`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene, stands a plain record in for the renderer and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An inspection that isolates one of two quads, shades them clay, draws supplied line and point marks).
 */
export function test_inspection_restore(): void {
  const left: THREE.Mesh = InspectionScene.quad("left", -2, 1);
  const right: THREE.Mesh = InspectionScene.quad("right", 2, 1);
  const stage: THREE.Scene = InspectionScene.scene(left, right);
  const own: (THREE.Material | THREE.Material[])[] = [left.material, right.material];
  const planes: THREE.Plane[] = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 5)];
  (left.material as THREE.Material).clippingPlanes = planes;
  const renderer: IAutoMovieSectionRenderer = { localClippingEnabled: false };

  // Every geometry and material the inspection adds is watched for its dispose.
  const disposed: Set<object> = new Set<object>();
  const watched: Set<object> = new Set<object>();
  const watch = (): void =>
    stage.traverse((object: THREE.Object3D): void => {
      for (const resource of [
        (object as THREE.Mesh).geometry,
        (object as THREE.Mesh).material,
      ] as (THREE.EventDispatcher<{ dispose: {} }> | undefined)[])
        if (resource !== undefined && !watched.has(resource) && !own.includes(resource as THREE.Material)) {
          if (resource === left.geometry || resource === right.geometry) continue;
          watched.add(resource);
          resource.addEventListener("dispose", (): void => {
            if (disposed.has(resource)) disposed.add({});
            disposed.add(resource);
          });
        }
    });

  // 1. Applied.
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({
      parts: ["left"],
      shade: "clay",
      marks: ["probe", "defect/open"],
      section: { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
    }),
    marks: [
      InspectionScene.mark("left/line", "probe", 0x00aa00, {
        type: "segments",
        points: [0, 0, 0, 1, 0, 0],
      }),
      InspectionScene.mark("left/dot", "probe", 0x00aa00, { type: "points", points: [0, 0, 0] }),
    ],
    renderer,
  });
  watch();
  TestValidator.predicate(
    "while applied the scene is changed",
    stage.children.length === 3 &&
      left.material !== own[0] &&
      right.layers.mask === 0 &&
      renderer.localClippingEnabled &&
      (left.material as THREE.Material).clippingPlanes?.length === 1,
  );
  TestValidator.equals(
    "and holds two line objects and one points object",
    [InspectionScene.strokes(stage).length, InspectionScene.dots(stage).length],
    [2, 1],
  );

  // 3. Replaced marks are released on replacement.
  const before: number = watched.size;
  handle.update([
    InspectionScene.mark("left/line", "probe", 0x00aa00, {
      type: "segments",
      points: [0, 0, 0, 2, 0, 0],
    }),
  ]);
  TestValidator.predicate(
    "replaced marks are disposed when replaced",
    disposed.size >= 4 && disposed.size < before,
  );
  watch();

  // 2. Restored.
  handle.restore();
  TestValidator.equals(
    "the scene is as it was",
    [
      stage.children.length,
      left.material === own[0],
      right.material === own[1],
      left.layers.mask,
      right.layers.mask,
      (left.material as THREE.Material).clippingPlanes === planes,
      (right.material as THREE.Material).clippingPlanes,
      renderer.localClippingEnabled,
    ],
    [2, true, true, 1, 1, true, null, false],
  );
  TestValidator.equals(
    "every resource the inspection made is disposed once",
    disposed.size,
    watched.size,
  );

  // 4. A second restore.
  handle.restore();
  TestValidator.equals("a second restore disposes nothing again", disposed.size, watched.size);
}
