import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * A `marks` pattern is matched against the kinds that exist, those of the supplied marks and those the inspection measures, and one that matches none is refused with the kinds listed, before the scene changes.
 *
 * Scenarios:
 *
 * 1. With supplied kinds `curve/section` and `joint`, the pattern `curve/spline` is refused, and the message names the pattern and lists `curve/section`, `joint`, `defect/open`, `defect/non-manifold`, `defect/inconsistent` and `defect/degenerate`, and not `defect/sliver` while no sliver limit is set; the scene keeps its children and layer masks.
 * 2. `defect/sliver` is refused without a sliver limit and accepted with one.
 * 3. A bare `curve` selects every curve kind and a bare `section` the section kind, under the path grammar.
 * 4. With no `marks` pattern nothing supplied is drawn, and no kind is checked.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection with supplied marks under several `marks` patterns and reads the refusal message, the scene's children and masks, and the drawn line objects.
 * @evidence contracts/development/testing.md#independent-expectations The available kinds are the supplied kinds plus the measured defect kinds the inspection documents, with the sliver kind conditional on the limit; the matching follows the documented path grammar.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts an unknown pattern against known ones, the sliver kind with and without its limit, anchored kind patterns against bare names, and no pattern against some. Colour clashes belong to `test_inspection_mark_color_law`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and marks and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: With supplied kinds curve/section and joint, the pattern curve/spline is refused).
 */
export function test_inspection_mark_kind_unknown(): void {
  const stage: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("panel"),
  );
  const marks = [
    InspectionScene.mark("panel/ring", "curve/section", 0x59a0f4, {
      type: "polyline",
      points: [0, 0, 0, 1, 0, 0],
      closed: false,
    }),
    InspectionScene.mark("panel/knee", "joint", 0xff7eb6, {
      type: "points",
      points: [0, 0, 0],
    }),
  ];

  // 1. An unknown pattern.
  const children: number = stage.children.length;
  try {
    applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ marks: ["curve/spline"] }),
      marks,
    });
    TestValidator.predicate("an unknown kind pattern is refused", false);
  } catch (error) {
    const message: string = error instanceof Error ? error.message : "";
    TestValidator.predicate(
      `the refusal names the pattern and lists the kinds: ${message}`,
      message.includes("curve/spline") &&
        [
          "curve/section",
          "joint",
          "defect/open",
          "defect/non-manifold",
          "defect/inconsistent",
          "defect/degenerate",
        ].every((kind: string): boolean => message.includes(kind)) &&
        !message.includes("defect/sliver"),
    );
  }
  TestValidator.equals(
    "the refused request leaves the scene",
    [stage.children.length, stage.children[0]!.layers.mask],
    [children, 1],
  );

  // 2. The sliver kind exists only with its limit.
  TestValidator.error("slivers without a limit are refused", (): void => {
    applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ marks: ["defect/sliver"] }),
    });
  });
  applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({ marks: ["defect/sliver"], sliver: 30 }),
  }).restore();

  // 3. Bare names under the path grammar.
  const drawnBy = (pattern: string): number => {
    const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ marks: [pattern] }),
      marks,
    });
    const count: number =
      InspectionScene.strokes(stage).length +
      InspectionScene.dots(stage).length;
    handle.restore();
    return count;
  };
  TestValidator.equals(
    "a bare curve and a bare section select the section curve; joint selects the joint",
    [drawnBy("curve"), drawnBy("section"), drawnBy("joint")],
    [1, 1, 1],
  );

  // 4. No pattern.
  const none: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({}),
    marks,
  });
  TestValidator.equals(
    "without marks patterns nothing is drawn",
    [
      InspectionScene.strokes(stage).length,
      InspectionScene.dots(stage).length,
      none.legend,
    ],
    [0, 0, []],
  );
  none.restore();
}
