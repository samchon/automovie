import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * A mark with an anchor is drawn in its anchor's local frame and follows the anchor when it moves, and marks handed to `update` replace the supplied ones.
 *
 * Scenarios:
 *
 * 1. A segment authored from the origin to one metre up, anchored to a quad three metres along X, is drawn from (3, 0, 0) to (3, 1, 0).
 * 2. After the quad moves two metres up and turns a quarter about Z, the drawn segment stays where it was until `update` runs, then starts at (3, 2, 0) and runs one metre along -X.
 * 3. An unanchored mark stays in world space although the inspection's group sits under a moved scene root.
 * 4. Marks handed to `update` replace the drawn ones and rewrite `selected` and `legend` in place, and an anchor no scene object has is refused naming the mark and the anchor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection, moves the anchor and the root, calls `update` with and without marks, and reads the world-space segment ends, `selected` and `legend`.
 * @evidence contracts/development/testing.md#independent-expectations Expected ends are the authored local coordinates carried by the anchor's authored translation and quarter turn, computed by hand; the legend and selection come from the authored paths, kinds and colours.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a stale placement against an updated one, anchored against world-space marks, a moved root against a still one, the first marks against replacing ones, and a known anchor against a missing one. Hiding through an anchor belongs to `test_inspection_mark_anchor_hidden`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and marks and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A segment authored from the origin to one metre up, anchored to a quad three metres along X).
 */
export function test_inspection_mark_anchor(): void {
  // 1. Drawn in the anchor's frame.
  const panel: THREE.Mesh = InspectionScene.quad("panel", 3);
  const stage: THREE.Scene = InspectionScene.scene(panel);
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ marks: ["probe"] }),
    marks: [
      InspectionScene.mark(
        "panel/probe",
        "probe",
        0x00aa00,
        { type: "segments", points: [0, 0, 0, 0, 1, 0] },
        { anchor: "panel" },
      ),
    ],
  });
  InspectionScene.close(
    "the segment is in the anchor's frame",
    InspectionScene.segments(InspectionScene.strokes(stage)[0]!)[0]!,
    [3, 0, 0, 3, 1, 0],
  );

  // 2. Follows after an update.
  panel.position.set(3, 2, 0);
  panel.rotation.z = Math.PI / 2;
  stage.updateMatrixWorld(true);
  InspectionScene.close(
    "before an update the segment stays",
    InspectionScene.segments(InspectionScene.strokes(stage)[0]!)[0]!,
    [3, 0, 0, 3, 1, 0],
  );
  handle.update();
  InspectionScene.close(
    "after an update it follows the moved anchor",
    InspectionScene.segments(InspectionScene.strokes(stage)[0]!)[0]!,
    [3, 2, 0, 2, 2, 0],
  );
  handle.restore();

  // 3. World space under a moved root.
  const root: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("panel"),
  );
  root.position.set(0, 5, 0);
  root.updateMatrixWorld(true);
  const world: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: root,
    request: InspectionScene.ask({ marks: ["probe"] }),
    marks: [
      InspectionScene.mark("probe", "probe", 0x00aa00, {
        type: "segments",
        points: [1, 0, 0, 1, 1, 0],
      }),
    ],
  });
  InspectionScene.close(
    "an unanchored mark stays in world space",
    InspectionScene.segments(InspectionScene.strokes(root)[0]!)[0]!,
    [1, 0, 0, 1, 1, 0],
  );
  world.restore();

  // 4. Replacing marks.
  const swap: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("panel"),
  );
  const replaced: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: swap,
    request: InspectionScene.ask({ marks: ["probe"] }),
    marks: [
      InspectionScene.mark("panel/first", "probe", 0x00aa00, {
        type: "points",
        points: [0, 0, 0],
      }),
    ],
  });
  const selected: string[] = replaced.selected;
  const legend: typeof replaced.legend = replaced.legend;
  replaced.update([
    InspectionScene.mark("panel/second", "probe", 0x00aa00, {
      type: "segments",
      points: [0, 0, 0, 2, 0, 0],
    }),
  ]);
  TestValidator.equals(
    "the new marks replace the old ones",
    [
      InspectionScene.dots(swap).length,
      InspectionScene.strokes(swap).length,
      InspectionScene.segments(InspectionScene.strokes(swap)[0]!),
    ],
    [0, 1, [[0, 0, 0, 2, 0, 0]]],
  );
  TestValidator.equals(
    "and the same selection and legend arrays describe them",
    [
      selected === replaced.selected,
      selected,
      legend === replaced.legend,
      legend,
    ],
    [
      true,
      ["panel", "panel/second"],
      true,
      [{ label: "probe", color: 0x00aa00, count: 1 }],
    ],
  );
  replaced.restore();
  try {
    applyAutoMovieInspection({
      scene: swap,
      request: InspectionScene.ask({ marks: ["probe"] }),
      marks: [
        InspectionScene.mark(
          "ghost/probe",
          "probe",
          0x00aa00,
          { type: "points", points: [0, 0, 0] },
          { anchor: "ghost" },
        ),
      ],
    });
    TestValidator.predicate("a missing anchor is refused", false);
  } catch (error) {
    TestValidator.predicate(
      "a missing anchor is refused naming the mark and the anchor",
      error instanceof Error &&
        error.message.includes("ghost/probe") &&
        error.message.includes('"ghost"'),
    );
  }
}
