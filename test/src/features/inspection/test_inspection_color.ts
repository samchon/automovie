import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * `color` recolours the objects and mark kinds its patterns match for one picture, under the colour law.
 *
 * Scenarios:
 *
 * 1. Under the beauty shade, `color` naming a quad and a mark kind gives the quad an unlit material of that colour and draws the kind's marks in its colour, listed under that colour in the legend; the other quad keeps its own material.
 * 2. Under the clay shade the coloured quad is lit in its colour.
 * 3. A later entry wins over an earlier one for the same quad.
 * 4. A colour that makes one kind share another kind's colour is refused naming both, and a colour on an object under a guide pass is refused.
 * 5. `restore` gives the quad its own material back.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection with colour entries and reads the quads' materials and colours, the segment colours and the legend.
 * @evidence contracts/development/testing.md#independent-expectations Expected colours are the authored hex values, and expected material kinds follow from the documented rule: unlit under beauty, lit under clay.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a coloured quad against an uncoloured one, beauty against clay, an earlier entry against a later one, an accepted kind colour against a clashing one, and an inspection shade against a guide pass. Kind colours without a request belong to `test_inspection_mark_color_law`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and marks and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Under the beauty shade, color naming a quad and a mark kind gives the quad an unlit material).
 */
export function test_inspection_color(): void {
  const left: THREE.Mesh = InspectionScene.quad("left", -2, 1);
  const right: THREE.Mesh = InspectionScene.quad("right", 2, 1);
  const own: THREE.Material | THREE.Material[] = left.material;
  const stage: THREE.Scene = InspectionScene.scene(left, right);
  const marks = [
    InspectionScene.mark("left/knee", "joint", 0x111111, { type: "segments", points: [0, 0, 0, 1, 0, 0] }),
    InspectionScene.mark("left/push", "contact", 0x222222, { type: "segments", points: [0, 1, 0, 1, 1, 0] }),
  ];
  const hex = (mesh: THREE.Mesh): number => ((mesh.material as THREE.MeshBasicMaterial).color as THREE.Color).getHex();

  // 1. Beauty.
  const beauty: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({
      marks: ["joint", "contact"],
      color: [
        { pattern: "left", color: 0x336699 },
        { pattern: "joint", color: 0xaa5500 },
      ],
    }),
    marks,
  });
  TestValidator.equals(
    "the quad and the kind take their colours",
    [
      (left.material as THREE.Material).type,
      hex(left),
      right.material !== own && (right.material as THREE.Material).type,
      InspectionScene.colors(InspectionScene.strokes(stage)[0]!),
      beauty.legend,
    ],
    [
      "MeshBasicMaterial",
      0x336699,
      "MeshBasicMaterial",
      [0xaa5500, 0x222222],
      [
        { label: "joint", color: 0xaa5500, count: 1 },
        { label: "contact", color: 0x222222, count: 1 },
      ],
    ],
  );
  TestValidator.predicate("the other quad keeps its own material", hex(right) === 0xff0000);
  beauty.restore();

  // 2. Clay.
  const clay: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ shade: "clay", color: [{ pattern: "left", color: 0x336699 }] }),
  });
  TestValidator.equals("under clay it is lit in its colour", [(left.material as THREE.Material).type, hex(left)], ["MeshLambertMaterial", 0x336699]);
  clay.restore();

  // 3. A later entry wins.
  const later: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({
      color: [
        { pattern: "left", color: 0x336699 },
        { pattern: "*", color: 0x996633 },
      ],
    }),
  });
  TestValidator.equals("the later entry wins", hex(left), 0x996633);
  later.restore();

  // 4. Refusals.
  TestValidator.error("a kind colour that clashes with another kind is refused", (): void => {
    applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ marks: ["joint", "contact"], color: [{ pattern: "joint", color: 0x222222 }] }),
      marks,
    });
  });
  TestValidator.error("an object colour under a guide pass is refused", (): void => {
    applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ shade: "depth", color: [{ pattern: "left", color: 0x336699 }] }),
    });
  });

  // 5. Restored.
  TestValidator.predicate("the quad has its own material back", left.material === own && stage.children.length === 2);
}
