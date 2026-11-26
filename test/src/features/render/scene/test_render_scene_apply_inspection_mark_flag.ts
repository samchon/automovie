import { type IAutoMovieInspectionHandle, AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";

/**
 * A flagged mark is drawn in the flag colour and counted under a flag entry of
 * the legend that names its kind, while its kind's unflagged marks keep the
 * kind's colour and entry.
 *
 * Scenarios:
 *
 * 1. Two unflagged and one flagged `curve/axis` marks draw their segments in cyan,
 *    cyan and magenta, and the legend lists `axis curve` in cyan counting two,
 *    then `axis curve (flagged)` in magenta counting one.
 * 2. A kind whose only mark is flagged has only its flag entry, because its own
 *    colour is not in the picture.
 * 3. Without any flagged mark the legend has no flag entry.
 */
export function test_render_scene_apply_inspection_mark_flag(): void {
  const stage: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("panel"),
  );
  const axis = (path: string, flagged: boolean) =>
    InspectionScene.mark(
      path,
      "curve/axis",
      0x00e5ff,
      { type: "segments", points: [0, 0, 0, 0, 1, 0] },
      { label: "axis curve", flagged },
    );

  // 1. Mixed.
  const mixed: IAutoMovieInspectionHandle = AutoMovieRenderInspection.apply({
    scene: stage,
    request: InspectionScene.ask({ marks: ["curve"] }),
    marks: [
      axis("panel/a", false),
      axis("panel/b", true),
      axis("panel/c", false),
    ],
  });
  TestValidator.equals(
    "a flagged mark takes the flag colour",
    InspectionScene.colors(InspectionScene.strokes(stage)[0]!),
    [0x00e5ff, 0xff00ff, 0x00e5ff],
  );
  TestValidator.equals("the legend counts each colour", mixed.legend, [
    { label: "axis curve", color: 0x00e5ff, count: 2 },
    { label: "axis curve (flagged)", color: 0xff00ff, count: 1 },
  ]);
  mixed.restore();

  // 2. Only flagged.
  const only: IAutoMovieInspectionHandle = AutoMovieRenderInspection.apply({
    scene: stage,
    request: InspectionScene.ask({ marks: ["curve"] }),
    marks: [axis("panel/b", true)],
  });
  TestValidator.equals(
    "a kind with only flagged marks has only its flag entry",
    only.legend,
    [{ label: "axis curve (flagged)", color: 0xff00ff, count: 1 }],
  );
  only.restore();

  // 3. None flagged.
  const plain: IAutoMovieInspectionHandle = AutoMovieRenderInspection.apply({
    scene: stage,
    request: InspectionScene.ask({ marks: ["curve"] }),
    marks: [axis("panel/a", false)],
  });
  TestValidator.equals("no flag, no flag entry", plain.legend, [
    { label: "axis curve", color: 0x00e5ff, count: 1 },
  ]);
  plain.restore();
}
