import { TestValidator } from "@nestia/e2e";

import type { InspectionView } from "../../src/InspectionView";
import { planInspectionViews } from "../../src/planInspectionViews";

/**
 * Pin how a view request is read into views for the Viewer page and the capture command.
 *
 * Scenarios:
 * 1. An absent request is the film camera alone.
 * 2. Names keep their order, are parsed by the renderer, and take file names: a production view, `film`, a named viewpoint, and a named viewpoint with `@ortho`, `@focus=` and `@flagged`.
 * 3. Text with a colon is one fixed camera carrying its two points.
 * 4. An unknown name, a repeated file name, text the renderer refuses and a camera standing on its own target are refused, and the unknown-name refusal lists the production's own views.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls planInspectionViews on literal requests and asserts the returned ids, texts and parsed views or the thrown refusal; a lost order, a lost switch, a silent fall back to the film camera or swapped points fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected views follow from the documented grammar and file-name rule; no output of the function is copied.
 * @evidence contracts/development/testing.md#distinguishing-cases Null and undefined, one name of each kind, each switch, a coordinate request and each refusal distinguish the forms and their failures; resolving cameras belongs to the placement test.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal text, discovered by test/index.ts as an exported test_ function; it mounts no film and starts no Viewer.
 */
export function test_plan_inspection_views(): void {
  for (const absent of [null, undefined])
    TestValidator.equals(`absent request ${String(absent)}`, planInspectionViews(absent, ["wide"]), [
      { id: "film", text: "film", view: { type: "film" } },
    ]);

  // Names in order, with switches.
  const mixed: InspectionView[] = planInspectionViews(
    "top, wide,film,front@ortho,right@focus=hero/arm,left@flagged",
    ["wide"],
  );
  TestValidator.equals(
    "ids in request order",
    mixed.map((view: InspectionView): string => view.id),
    ["top", "wide", "film", "front-ortho", "right-focus", "left-flagged"],
  );
  TestValidator.equals("a focus is parsed", mixed[4]!.view, {
    type: "named",
    name: "right",
    orthographic: false,
    focus: { type: "pattern", pattern: "hero/arm" },
  });

  // A fixed camera.
  TestValidator.equals("a fixed camera", planInspectionViews("0,1,5:0,1,0", []), [
    {
      id: "inspection",
      text: "0,1,5:0,1,0",
      view: { type: "fixed", position: { x: 0, y: 1, z: 5 }, target: { x: 0, y: 1, z: 0 } },
    },
  ]);

  // Refusals.
  try {
    planInspectionViews("sideways", ["wide"]);
    TestValidator.predicate("an unknown name is refused", false);
  } catch (error) {
    TestValidator.predicate(
      "an unknown name is refused listing the production's views",
      error instanceof Error && error.message.includes("wide"),
    );
  }
  for (const text of ["front,front", "", "front@zoom", "1,2:0,0,0", "1,1,1:1,1,1"])
    TestValidator.error(`"${text}" is refused`, (): unknown => planInspectionViews(text, []));
}
