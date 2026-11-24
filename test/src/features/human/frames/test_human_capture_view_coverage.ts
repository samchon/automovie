import { FamilyConicCaptureViews as Views } from "../../../reference-conics/FamilyConicCaptureViews";
import { NodeCanvasCamera as Camera } from "../../../reference-conics/render/NodeCanvasCamera";

/**
 * The shared native view plan retains the existing Deviation comparison cells.
 *
 * Scenarios:
 * 1. Eight existing Deviation zones retain front, back, left, high and low views when Figure requests fewer views.
 * 2. Every planned direction remains unique and the already complete hand request stays unchanged.
 * 3. The explicit seven nose directions and a non-Deviation elbow request keep their existing plans.
 * 4. An opposite-side elbow exchanges left for right without changing its other directions.
 * 5. An unindexed vertex outside the selection cannot change the annotated viewport.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the regional comparison planner with portable requested-view data and checks its output directly.
 * @evidence contracts/development/testing.md#independent-expectations The existing Deviation contract requires five directions for eight named regions. Six sparse three-view requests and one sparse shoulder request expose thirteen missing view cells, corresponding to the existing deviation and owner consumers' twenty-six output demands. This fixture proves plan coverage, not PNG completion or visual acceptance.
 * @evidence contracts/development/testing.md#distinguishing-cases Sparse three/four-view input, complete five-view input, the special nose plan, an unrelated elbow and its twin distinguish compatibility union from a global view expansion.
 * @evidence contracts/development/testing.md#execution-ownership The selected fixture calls only a pure list planner with literal strings; no assembly, realization, reference file, host, renderer or viewer is invoked.
 * @evidence contracts/development/common.md#meaningful-documentation Four scenarios name the required comparison coverage, unchanged neighbours and opposite-side convention.
 */
export function test_human_capture_view_coverage(): void {
  const failures: string[] = [];

  /** Gather all missing comparison directions before reporting the one planning cause. */
  const check: (value: boolean, message: string) => void = (
    value: boolean,
    message: string,
  ): void => {
    if (!value) failures.push(message);
  };
  const requests: Readonly<Record<string, readonly string[]>> = {
    head: ["front", "left", "high-oblique"],
    hand: ["front", "back", "left", "high-oblique", "low-oblique"],
    foot: ["front", "left", "high-oblique"],
    shoulder: ["front", "back", "left", "high-oblique"],
    ear: ["front", "left", "high-oblique"],
    neck: ["front", "left", "high-oblique"],
    hip: ["front", "left", "high-oblique"],
    chest: ["front", "left", "high-oblique"],
    elbow: ["front", "back", "left", "high-oblique"],
  };

  /** Supply legal sparse Figure requests; the independent expectation is Deviation's five-view contract. */
  const requested: (zone: string) => string[] = (zone: string): string[] => {
    const views: readonly string[] | undefined = requests[zone];
    if (views === undefined) throw new Error("Fixture has no request for " + zone);
    return [...views];
  };
  const regions: readonly string[] = ["head", "hand", "foot", "shoulder", "ear", "neck", "hip", "chest"];
  const required: readonly string[] = ["front", "back", "left", "high-oblique", "low-oblique"];
  for (const region of regions) {
    const planned: string[] = Views.comparison(region, requested);
    for (const view of required)
      check(planned.includes(view), region + "/" + view + " is absent from the shared deviation/owners plan");
    check(new Set(planned).size === planned.length, region + " repeats a direction");
  }
  check(Views.comparison("hand", requested).join(",") === requests.hand!.join(","), "the complete hand request changed order or membership");
  const nose: readonly string[] = ["front", "left", "right", "high-oblique", "low-oblique", "low-oblique-other-side", "underside"];
  check(Views.comparison("nose", requested).join(",") === nose.join(","), "the explicit nose plan changed");
  check(Views.comparison("elbow", requested).join(",") === requests.elbow!.join(","), "an unrelated elbow request was expanded");
  check(Views.comparison("elbow.twin", requested).join(",") === "front,back,right,high-oblique", "the opposite-side elbow lost its left/right exchange");
  const corners = Camera.indexedPoints([{
    positions: [0, 0, 0, 1, 1, 0, 0, 0.5, 0, 100, 100, 100],
    indices: [0, 1, 2, 0, 2, 1],
  }]);
  const camera = Camera.fitAnnotated("fixture", [0, 0, 1], [0, 1, 0], corners, 360, 360);
  // The selected span occupies 88% of the 255 content rows, centred at row 207.5.
  check(
    corners.length === 3 &&
      Math.abs(Camera.project(corners[0]!, camera)[1] - 319.7) < 1e-12 &&
      Math.abs(Camera.project(corners[1]!, camera)[1] - 95.3) < 1e-12,
    "the supplied indexed triangle did not fit the annotated rows",
  );
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
