import type { IAutoMovieInspectionKind } from "@automovie/interface";
import { AutoMovieRenderInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { InspectionScene } from "../../internal/InspectionScene";

/**
 * The mark kinds a request may name are listed by one rule: the supplied marks'
 * kinds, then the inspection's own, with the sliver and trail kinds only when
 * the request makes them exist.
 *
 * Scenarios:
 *
 * 1. Without a sliver limit or a trail, and with supplied `curve/section` and
 *    `joint` marks, the list is those two kinds with their marks' labels and
 *    colours, then `edge` and the four defect kinds other than `defect/sliver`,
 *    with the documented labels and colours.
 * 2. With a sliver limit `defect/sliver` follows the other defect kinds; with a
 *    trail the sampled, current and authored-route kinds close the list.
 * 3. A supplied kind with an inspection kind's name is listed once, with the
 *    supplied label and colour.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The examples describe how supplied marks, built-in defects, and optional sliver and trail kinds populate the ordered choices.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that optional kinds appear only when their settings are present and that a supplied kind takes precedence on a kind-name collision.
 * @evidence contracts/development/testing.md#independent-expectations Compares with manually ordered kind records and the fixture's explicit label and color for the colliding kind.
 */
export function test_render_scene_list_inspection_kinds(): void {
  const supplied = [
    InspectionScene.mark(
      "a/ring",
      "curve/section",
      0x59a0f4,
      { type: "points", points: [0, 0, 0] },
      { label: "section curve" },
    ),
    InspectionScene.mark("a/knee", "joint", 0xff7eb6, {
      type: "points",
      points: [0, 0, 0],
    }),
    InspectionScene.mark(
      "a/ring2",
      "curve/section",
      0x59a0f4,
      { type: "points", points: [0, 0, 0] },
      { label: "section curve" },
    ),
  ];
  const own: IAutoMovieInspectionKind[] = [
    { kind: "edge", label: "mesh edge", color: 0x2b3a67 },
    { kind: "defect/open", label: "open edge", color: 0xff3b30 },
    {
      kind: "defect/non-manifold",
      label: "non-manifold edge",
      color: 0xb14aff,
    },
    {
      kind: "defect/inconsistent",
      label: "inconsistent edge",
      color: 0xffcc00,
    },
    {
      kind: "defect/degenerate",
      label: "degenerate triangle",
      color: 0xffffff,
    },
  ];

  // 1. Neither condition.
  TestValidator.equals(
    "supplied kinds, then the inspection's",
    AutoMovieRenderInspectionRequest.listKinds({
      request: InspectionScene.ask({}),
      marks: supplied,
    }),
    [
      { kind: "curve/section", label: "section curve", color: 0x59a0f4 },
      { kind: "joint", label: "joint", color: 0xff7eb6 },
      ...own,
    ],
  );

  // 2. Sliver and trail.
  TestValidator.equals(
    "a sliver limit adds the sliver kind",
    AutoMovieRenderInspectionRequest.listKinds({
      request: InspectionScene.ask({ sliver: 20 }),
      marks: [],
    }),
    [
      ...own,
      { kind: "defect/sliver", label: "sliver triangle", color: 0xff9500 },
    ],
  );
  TestValidator.equals(
    "a trail adds the trail kinds",
    AutoMovieRenderInspectionRequest.listKinds({
      request: InspectionScene.ask({ trail: ["hero"] }),
      marks: [],
    }),
    [
      ...own,
      { kind: "trail", label: "trail", color: 0xd2691e },
      {
        kind: "trail/now",
        label: "trail at the drawn second",
        color: 0x1e90ff,
      },
      { kind: "trail/route", label: "Authored route", color: 0x4fc5bb },
    ],
  );

  // 3. A clash with an inspection kind.
  TestValidator.equals(
    "a supplied edge kind is listed once, as supplied",
    AutoMovieRenderInspectionRequest.listKinds({
      request: InspectionScene.ask({}),
      marks: [
        InspectionScene.mark("a/e", "edge", 0x123456, {
          type: "points",
          points: [0, 0, 0],
        }),
      ],
    }).filter(
      (entry: IAutoMovieInspectionKind): boolean => entry.kind === "edge",
    ),
    [{ kind: "edge", label: "edge", color: 0x123456 }],
  );
}
