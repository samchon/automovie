import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionLegendEntry,
  type IAutoMovieViewerSubjectBounds,
  applyAutoMovieInspection,
  measureAutoMovieInspectionBounds,
  mergeAutoMovieInspectionLegends,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * Legends merge by label, and the bounds of an inspected scene are measured on what it still draws, marks included.
 *
 * Scenarios:
 *
 * 1. Legends that repeat a label are merged into one entry per label in first-appearance order with the counts summed and fresh entries, and one label under two colours is refused.
 * 2. The bounds of a scene are the world box of its meshes, lines and points; an object off every layer and a hidden object are left out while a child of the former still counts, a sprite is not measured, and a scene with nothing drawn has no bounds.
 * 3. An inspection that leaves one quad and draws a mark beyond it reports bounds that hold the quad and reach the mark's far end, measured from the mark's screen-space line object.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public legend merge and bounds functions and an applied inspection's `bounds` on actual three.js objects and reads the returned entries and boxes.
 * @evidence contracts/development/testing.md#independent-expectations Expected boxes come from authored positions and sizes, and expected entries from the authored labels, colours and counts.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts repeated against distinct labels, drawn against isolated or hidden objects, a child of an isolated object against the object, measured against unmeasured kinds, and a scene with a mark against one without.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own objects and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Legends that repeat a label are merged into one entry per label in first-appearance order).
 */
export function test_inspection_bounds_legend(): void {
  const box = (bounds: IAutoMovieViewerSubjectBounds | null): number[] =>
    bounds === null
      ? []
      : [bounds.min.x, bounds.min.y, bounds.min.z, bounds.max.x, bounds.max.y, bounds.max.z];

  // 1. Merging legends.
  const first: IAutoMovieInspectionLegendEntry = { label: "open edge", color: 0xff3b30, count: 2 };
  TestValidator.equals(
    "counts are summed by label, in first order",
    mergeAutoMovieInspectionLegends([
      [first, { label: "guide curve", color: 0x59cb89, count: 1 }],
      [],
      [
        { label: "guide curve", color: 0x59cb89, count: 4 },
        { label: "axis curve", color: 0x00e5ff, count: 1 },
        { label: "open edge", color: 0xff3b30, count: 3 },
      ],
    ]),
    [
      { label: "open edge", color: 0xff3b30, count: 5 },
      { label: "guide curve", color: 0x59cb89, count: 5 },
      { label: "axis curve", color: 0x00e5ff, count: 1 },
    ],
  );
  TestValidator.equals("the merged entries are fresh", first.count, 2);
  TestValidator.error("one label under two colours is refused", (): void => {
    mergeAutoMovieInspectionLegends([
      [{ label: "open edge", color: 0xff3b30, count: 1 }],
      [{ label: "open edge", color: 0xffffff, count: 1 }],
    ]);
  });

  // 2. Bounds of drawn objects.
  const isolated: THREE.Mesh = InspectionScene.quad("isolated", 100);
  isolated.layers.mask = 0;
  const invisible: THREE.Mesh = InspectionScene.quad("invisible", -100);
  invisible.visible = false;
  const lit: THREE.Scene = InspectionScene.scene(InspectionScene.quad("lit", 3), isolated, invisible);
  TestValidator.equals("the bounds are the drawn mesh's world box", box(measureAutoMovieInspectionBounds(lit)), [
    2, -1, 0, 4, 1, 0,
  ]);
  isolated.add(InspectionScene.quad("child", -95));
  TestValidator.equals(
    "a child of an object off every layer still counts",
    box(measureAutoMovieInspectionBounds(lit)),
    [2, -1, 0, 6, 1, 0],
  );
  const sprite: THREE.Sprite = new THREE.Sprite();
  sprite.position.set(50, 0, 0);
  const strokes: THREE.Scene = InspectionScene.scene(
    new THREE.Line(
      new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0, 5, 0, 0, 6, 0], 3)),
    ),
    new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([1, 0, -2], 3)),
    ),
    sprite,
  );
  TestValidator.equals(
    "lines and points are measured and a sprite is not",
    box(measureAutoMovieInspectionBounds(strokes)),
    [0, 0, -2, 1, 6, 0],
  );
  TestValidator.equals(
    "a scene of groups has no bounds",
    measureAutoMovieInspectionBounds(InspectionScene.scene(new THREE.Group())),
    null,
  );

  // 3. Marks count toward an inspection's bounds.
  const stage: THREE.Scene = InspectionScene.scene(InspectionScene.quad("left", -2, 1), InspectionScene.quad("right", 2, 1));
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ parts: ["left"], marks: ["probe"] }),
    marks: [
      InspectionScene.mark("left/reach", "probe", 0x00aa00, {
        type: "segments",
        points: [-2, 0, 0, -2, 4, 0],
      }),
    ],
  });
  InspectionScene.close("the bounds hold the quad and the mark", box(handle.bounds()), [
    -2.5, -0.5, 0, -1.5, 4, 0,
  ]);
  handle.restore();
}
