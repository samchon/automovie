import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionLabel,
  applyAutoMovieInspection,
  placeAutoMovieInspectionLabels,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * Labels are placed at the pixels their objects' and marks' centres project to, and a label that would overlap one placed before it is dropped and reported.
 *
 * Scenarios:
 *
 * 1. `label` on three one-metre quads spread along X, seen by an orthographic camera spanning 10 m over 1000 px, gives three labels named after the quads, anchored at x = 300, 500 and 700 px and y = 500 px, and nothing dropped.
 * 2. A label on a mark anchors at the centre of the mark's points.
 * 3. Two quads 0.1 m apart give one label, and the other is listed as dropped with its anchor.
 * 4. A path whose centre lies outside the picture is dropped; a size or scale that is not a positive integer is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection and calls the handle's `labels`, and the public placement directly, reading the placed and dropped labels.
 * @evidence contracts/development/testing.md#independent-expectations Anchors are computed by hand from the orthographic camera's 10 m frame over 1000 px, 100 px per metre with the origin at the centre and y down; overlap follows from the stamp's documented box, `scale * (4 * length + 3)` wide and `9 * scale` high.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts spread labels against overlapping ones, objects against marks, inside against outside the picture, and valid against refused sizes. Stamping belongs to the hosts.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and camera and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: label on three one-metre quads spread along X).
 */
export function test_inspection_labels(): void {
  const camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
    -5,
    5,
    5,
    -5,
    0.1,
    100,
  );
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const at = (
    labels: IAutoMovieInspectionLabel[],
  ): [string, string, number, number][] =>
    labels.map(
      (label: IAutoMovieInspectionLabel): [string, string, number, number] => [
        label.path,
        label.text,
        label.x,
        label.y,
      ],
    );

  // 1. Three quads.
  const stage: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("a", -2, 1),
    InspectionScene.quad("b", 0, 1),
    InspectionScene.quad("c", 2, 1),
  );
  const three: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ label: ["a", "b", "c"] }),
  });
  const placed: {
    labels: IAutoMovieInspectionLabel[];
    dropped: IAutoMovieInspectionLabel[];
  } = three.labels(camera, 1000, 1000, 2);
  TestValidator.equals(
    "three labels at their projected centres",
    [at(placed.labels), placed.dropped],
    [
      [
        ["a", "a", 300, 500],
        ["b", "b", 500, 500],
        ["c", "c", 700, 500],
      ],
      [],
    ],
  );
  three.restore();

  // 2. A mark.
  const marked: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ marks: ["probe"], label: ["b/probe"] }),
    marks: [
      InspectionScene.mark("b/probe", "probe", 0x00aa00, {
        type: "points",
        points: [1, 1, 0, 1, 3, 0],
      }),
    ],
  });
  TestValidator.equals(
    "a mark is labelled at its centre",
    at(marked.labels(camera, 1000, 1000, 2).labels),
    [["b/probe", "probe", 600, 300]],
  );
  marked.restore();

  // 3. Overlap.
  const close: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("p", 0, 1),
    InspectionScene.quad("q", 0.1, 1),
  );
  const crowded: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: close,
    request: InspectionScene.ask({ label: ["p", "q"] }),
  });
  const result: {
    labels: IAutoMovieInspectionLabel[];
    dropped: IAutoMovieInspectionLabel[];
  } = crowded.labels(camera, 1000, 1000, 2);
  TestValidator.equals(
    "the second label is dropped",
    [at(result.labels), at(result.dropped)],
    [[["p", "p", 500, 500]], [["q", "q", 510, 500]]],
  );
  crowded.restore();

  // 4. Outside, and refusals.
  const outside = placeAutoMovieInspectionLabels({
    boxes: [
      { path: "far", min: { x: 20, y: 0, z: 0 }, max: { x: 20, y: 0, z: 0 } },
    ],
    camera,
    width: 1000,
    height: 1000,
    scale: 2,
  });
  TestValidator.equals(
    "a centre outside the picture is dropped",
    [outside.labels.length, outside.dropped.length],
    [0, 1],
  );
  for (const [width, scale] of [
    [0, 2],
    [1000, 1.5],
  ])
    TestValidator.error(
      `size ${width} and scale ${scale} are refused`,
      (): void => {
        placeAutoMovieInspectionLabels({
          boxes: [],
          camera,
          width: width!,
          height: 1000,
          scale: scale!,
        });
      },
    );
}
