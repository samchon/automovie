import type { IAutoMovieHumanSegmentFrame } from "@automovie/interface";

import { FamilyConicCaseRegion } from "../../../reference-conics/FamilyConicCaseRegion";

/**
 * A close region of f1 carried onto a changed case by its bones, so the case's close camera frames its own region.
 *
 * Scenarios:
 * 1. A foot raised 135 mm: points near its joint rise 0.135 m, points near an unmoved joint stay.
 * 2. A segment turned a quarter about world Z at its joint: a point 10 mm along its first axis lands 10 mm along the turned axis.
 * 3. A point on the other side (z < 0) is carried as its +Z image and reflected back.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `FamilyConicCaseRegion.carry` as the figure capture does.
 * @evidence contracts/development/testing.md#independent-expectations Rigid translations and a quarter turn of made frames give the carried points in closed form.
 * @evidence contracts/development/testing.md#distinguishing-cases The unmoved joint's point must not move; the reflected point must keep its side.
 * @evidence contracts/development/testing.md#execution-ownership Made frames and points only.
 * @evidence contracts/development/common.md#meaningful-documentation Names each made motion and its expected carried point.
 */
export function test_human_case_region(): void {
  const failures: string[] = [];
  const identity: IAutoMovieHumanSegmentFrame["axes"] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const f1 = new Map<string, IAutoMovieHumanSegmentFrame>([
    ["foot", { origin: [100, 80, 100], axes: identity }],
    ["pelvis", { origin: [0, 900, 0], axes: identity }],
    ["hand", { origin: [0, 500, 400], axes: identity }],
  ]);
  const raised = new Map<string, IAutoMovieHumanSegmentFrame>([
    ["foot", { origin: [100, 215, 100], axes: identity }],
    ["pelvis", { origin: [0, 900, 0], axes: identity }],
    ["hand", { origin: [0, 500, 400], axes: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]] }],
  ]);
  const near = (a: readonly number[], b: readonly number[]): boolean => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!) <= 1e-12;
  const [toe, hip, finger, twin] = FamilyConicCaseRegion.carry(
    [[0.13, 0.02, 0.1], [0.01, 0.9, 0.01], [0.01, 0.5, 0.4], [0.13, 0.02, -0.1]], f1, raised);
  if (!near(toe!, [0.13, 0.155, 0.1])) failures.push("the raised foot's point was carried to " + JSON.stringify(toe));
  if (!near(hip!, [0.01, 0.9, 0.01])) failures.push("the unmoved pelvis's point moved to " + JSON.stringify(hip));
  if (!near(finger!, [0, 0.51, 0.4])) failures.push("the turned hand's point was carried to " + JSON.stringify(finger));
  if (!near(twin!, [0.13, 0.155, -0.1])) failures.push("the other side's point was carried to " + JSON.stringify(twin));
  if (failures.length > 0) throw new Error("case region:\n" + failures.join("\n"));
}
