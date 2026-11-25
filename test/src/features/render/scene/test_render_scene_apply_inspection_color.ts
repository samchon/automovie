import {
  AutoMovieThreeKind,
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";
import { singleMaterial } from "../../internal/singleMaterial";

/**
 * `color` recolours the objects and mark kinds its patterns match for one
 * picture, under the colour law.
 *
 * Scenarios:
 *
 * 1. Under the beauty shade, `color` naming a quad and a mark kind gives the quad
 *    an unlit material of that colour and draws the kind's marks in its colour,
 *    listed under that colour in the legend; the other quad keeps its own
 *    material.
 * 2. Under the clay shade the coloured quad is lit in its colour.
 * 3. A later entry wins over an earlier one for the same quad.
 * 4. A colour that makes one kind share another kind's colour is refused naming
 *    both, and a colour on an object under a guide pass is refused.
 * 5. `restore` gives the quad its own material back.
 */
export function test_render_scene_apply_inspection_color(): void {
  const left: THREE.Mesh = InspectionScene.quad("left", -2, 1);
  const right: THREE.Mesh = InspectionScene.quad("right", 2, 1);
  const own: THREE.Material | THREE.Material[] = left.material;
  const stage: THREE.Scene = InspectionScene.scene(left, right);
  const marks = [
    InspectionScene.mark("left/knee", "joint", 0x111111, {
      type: "segments",
      points: [0, 0, 0, 1, 0, 0],
    }),
    InspectionScene.mark("left/push", "contact", 0x222222, {
      type: "segments",
      points: [0, 1, 0, 1, 1, 0],
    }),
  ];
  const hex: (mesh: THREE.Mesh) => number = (mesh: THREE.Mesh): number => {
    const material: THREE.Material = singleMaterial(mesh.material);
    if (
      !AutoMovieThreeKind.isMeshBasicMaterial(material) &&
      !AutoMovieThreeKind.isMeshLambertMaterial(material) &&
      !AutoMovieThreeKind.isMeshStandardMaterial(material)
    )
      throw new Error("Expected a coloured material");
    return material.color.getHex();
  };

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
      singleMaterial(left.material).type,
      hex(left),
      right.material !== own && singleMaterial(right.material).type,
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
  TestValidator.predicate(
    "the other quad keeps its own material",
    hex(right) === 0xff0000,
  );
  beauty.restore();

  // 2. Clay.
  const clay: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({
      shade: "clay",
      color: [{ pattern: "left", color: 0x336699 }],
    }),
  });
  TestValidator.equals(
    "under clay it is lit in its colour",
    [singleMaterial(left.material).type, hex(left)],
    ["MeshLambertMaterial", 0x336699],
  );
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
  TestValidator.error(
    "a kind colour that clashes with another kind is refused",
    (): void => {
      applyAutoMovieInspection({
        scene: stage,
        request: InspectionScene.ask({
          marks: ["joint", "contact"],
          color: [{ pattern: "joint", color: 0x222222 }],
        }),
        marks,
      });
    },
  );
  TestValidator.error(
    "an object colour under a guide pass is refused",
    (): void => {
      applyAutoMovieInspection({
        scene: stage,
        request: InspectionScene.ask({
          shade: "depth",
          color: [{ pattern: "left", color: 0x336699 }],
        }),
      });
    },
  );

  // 5. Restored.
  TestValidator.predicate(
    "the quad has its own material back",
    left.material === own && stage.children.length === 2,
  );
}
