import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * With `xray` on, marks are drawn without the depth test and after everything else; with it off they are depth-tested in the ordinary order.
 *
 * Scenarios:
 *
 * 1. With `xray` a line mark's material and a point mark's material neither test nor write depth, are drawn in the transparent pass, and their objects have the largest render order.
 * 2. Without `xray` both materials test and write depth, are opaque, and their objects keep render order zero.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection with and without x-ray and reads the depth flags, transparency and render order of the line and point objects it added.
 * @evidence contracts/development/testing.md#independent-expectations The expected flags are three.js's own meaning of drawing over surfaces: no depth test, no depth write, drawn after opaque objects at the highest order.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts x-ray against depth-tested marks for both object kinds. The depth lead of a depth-tested mark belongs to `test_inspection_mark_shapes`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and marks and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: With xray a line mark's material and a point mark's material neither test nor write depth).
 */
export function test_inspection_mark_xray(): void {
  const read = (xray: boolean): (boolean | number)[][] => {
    const stage: THREE.Scene = InspectionScene.scene(
      InspectionScene.quad("panel"),
    );
    const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ marks: ["probe"], xray }),
      marks: [
        InspectionScene.mark("panel/line", "probe", 0x00aa00, {
          type: "segments",
          points: [0, 0, 0, 1, 0, 0],
        }),
        InspectionScene.mark("panel/dot", "probe", 0x00aa00, {
          type: "points",
          points: [0, 0, 0],
        }),
      ],
    });
    const objects: THREE.Object3D[] = [
      InspectionScene.strokes(stage)[0]!,
      InspectionScene.dots(stage)[0]!,
    ];
    const out: (boolean | number)[][] = objects.map(
      (object: THREE.Object3D): (boolean | number)[] => {
        const material: THREE.Material = (object as THREE.Mesh)
          .material as THREE.Material;
        return [
          material.depthTest,
          material.depthWrite,
          material.transparent,
          object.renderOrder,
        ];
      },
    );
    handle.restore();
    return out;
  };

  // 1. X-ray.
  TestValidator.equals("x-ray marks ignore depth and draw last", read(true), [
    [false, false, true, Number.MAX_SAFE_INTEGER],
    [false, false, true, Number.MAX_SAFE_INTEGER],
  ]);

  // 2. Depth-tested.
  TestValidator.equals("ordinary marks are depth-tested", read(false), [
    [true, true, false, 0],
    [true, true, false, 0],
  ]);
}
