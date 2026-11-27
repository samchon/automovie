import { AutoMovieRenderThreeKind, type IAutoMovieRenderInspectionHandle, AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";
import { singleMaterial } from "../../internal/singleMaterial";

/**
 * With `xray` on, marks are drawn without the depth test and after everything
 * else; with it off they are depth-tested in the ordinary order.
 *
 * Scenarios:
 *
 * 1. With `xray` a line mark's material and a point mark's material neither test
 *    nor write depth, are drawn in the transparent pass, and their objects have
 *    the largest render order.
 * 2. Without `xray` both materials test and write depth, are opaque, and their
 *    objects keep render order zero.
 */
export function test_render_scene_apply_inspection_mark_xray(): void {
  const read = (xray: boolean): (boolean | number)[][] => {
    const stage: THREE.Scene = InspectionScene.scene(
      InspectionScene.quad("panel"),
    );
    const handle: IAutoMovieRenderInspectionHandle = AutoMovieRenderInspection.apply({
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
        if (
          !AutoMovieRenderThreeKind.isMesh(object) &&
          !AutoMovieRenderThreeKind.isPoints(object)
        )
          throw new Error("Expected a drawn mark");
        const material: THREE.Material = singleMaterial(object.material);
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
