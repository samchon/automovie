import { TestValidator } from "@nestia/e2e";

import type { InspectionView } from "../../src/InspectionView";
import { planInspectionViews } from "../../src/planInspectionViews";

/**
 * Pin how a view request is read into cameras for the Viewer page and the capture command.
 *
 * Scenarios:
 * 1. An absent request is the film camera alone.
 * 2. Names keep their order and resolve to a production view first, then `film`, then a named viewpoint, so a production view called `front` wins over the viewer's and one called `film` over the film camera.
 * 3. Text with a colon is one fixed camera carrying its two points.
 * 4. An unknown name, a repeated name, an empty request, malformed coordinates and a camera standing on its own target are refused, and the unknown-name refusal lists the production's own views.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and the rule each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls planInspectionViews on literal requests and asserts the returned kinds, ids, viewpoint ids and points or the thrown refusal; a lost order, a viewer name shadowing a production view, a silent fall back to the film camera or swapped points fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected views follow from the documented grammar and resolution order, and the eight viewpoint names are the ones the viewer documents; no output of the function is copied.
 * @evidence contracts/development/testing.md#distinguishing-cases Null and undefined, one name of each kind, a name that is both a production view and a viewpoint, a production view named `film` beside a viewpoint the production does not name, every documented viewpoint name, a coordinate request, and each refusal distinguish the three text forms and their failures; placing the cameras belongs to the placement test.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal text, discovered by test/index.ts as an exported test_ function; it mounts no film and starts no Viewer.
 */
export function test_plan_inspection_views(): void {
  for (const absent of [null, undefined])
    TestValidator.equals(
      `absent request ${String(absent)}`,
      planInspectionViews(absent, ["wide"]),
      [{ kind: "film", id: "film" }],
    );

  // Order is kept and each name resolves by the documented precedence.
  const mixed: InspectionView[] = planInspectionViews("top, wide,film,front", [
    "wide",
    "front",
  ]);
  TestValidator.equals(
    "kinds and ids in request order",
    mixed.map((view: InspectionView): string => `${view.kind}:${view.id}`),
    ["named:top", "preset:wide", "film:film", "preset:front"],
  );
  const first: InspectionView = mixed[0]!;
  TestValidator.predicate(
    "a named view carries the viewer's viewpoint of that name",
    first.kind === "named" && first.viewpoint.id === "top",
  );
  TestValidator.equals(
    "a production view named film wins over the film camera",
    planInspectionViews("film,front", ["film"]).map(
      (view: InspectionView): string => `${view.kind}:${view.id}`,
    ),
    ["preset:film", "named:front"],
  );
  TestValidator.equals(
    "every documented viewpoint name",
    planInspectionViews(
      "front,back,right,left,top,bottom,three-quarter,three-quarter-back",
      [],
    ).map((view: InspectionView): string => view.kind),
    Array.from({ length: 8 }, (): string => "named"),
  );

  TestValidator.equals(
    "fixed camera",
    planInspectionViews("1,2.5,-3:0,1,0", ["wide"]),
    [
      {
        kind: "fixed",
        id: "inspection",
        position: [1, 2.5, -3],
        target: [0, 1, 0],
      },
    ],
  );

  for (const [label, text] of [
    ["unknown name", "sideways"],
    ["repeated name", "front,front"],
    ["empty request", ""],
    ["empty name in a list", "front,,top"],
    ["two coordinates", "1,2:0,0,0"],
    ["three points", "1,2,3:0,0,0:0,1,0"],
    ["blank coordinate", "1,,3:0,0,0"],
    ["non-numeric coordinate", "1,2,z:0,0,0"],
    ["infinite coordinate", "1,2,Infinity:0,0,0"],
    ["name mixed with coordinates", "front,1,2,3:0,0,0"],
    ["camera on its target", "1,2,3:1,2,3"],
  ] as const)
    TestValidator.error(label, (): InspectionView[] =>
      planInspectionViews(text, ["wide"]),
    );
  let message: string = "";
  try {
    planInspectionViews("sideways", ["wide"]);
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : "";
  }
  TestValidator.predicate(
    "the refusal lists the production view, the film camera and a viewpoint",
    ["wide", "film", "three-quarter-back"].every((name: string): boolean =>
      message.includes(name),
    ),
  );
}
