import { AutoMovieHumanConicSection as Section } from "@automovie/human";
import type { AutoMovieVector2Tuple } from "@automovie/interface";

import { FamilyConicFit as Fit } from "../../../reference-conics/FamilyConicFit";

/**
 * @evidence contracts/development/testing.md#behavioral-verification An actual indexed run retains its overrun vertex and each finite edge after native conic-ray splits.
 * @evidence contracts/development/testing.md#independent-expectations On the unit circle the chord's maximum separation is 1-cos(half its angular span).
 * @evidence contracts/development/testing.md#distinguishing-cases The outer angles do not enclose the overrun. A different nonincident measured edge cannot certify reverse cover.
 * @evidence contracts/development/testing.md#execution-ownership One made in-process rational circle.
 */
export function test_human_owned_run_correspondence(): void {
  const unit = Section.chain([1, 0, 0, 1, -1, 0, 0, -1, ...new Array<number>(4).fill(Math.SQRT2 - 1)], Section.limb(0));
  const on = (p: number): AutoMovieVector2Tuple => [Math.cos(p), Math.sin(p)];
  const angles = [-Math.PI / 6, -Math.PI / 12, Math.PI / 6, Math.PI / 12];
  const run = angles.map(on);
  const got = Fit.runCorrespondence(unit, run, false);
  if (typeof got === "string") throw new Error(got);
  if (got.matches.length !== run.length ||
      got.matches.some((m) => Math.hypot(...m.residual) > 1e-9) ||
      got.spans.length !== run.length)
    throw new Error("the finite native intervals lost an indexed vertex or its actual conic-ray split");
  const limit = 1 - Math.cos(Math.PI / 8) + 1e-9;
  for (const edge of got.spans) {
    const own = unit.arcs[edge.arc]!;
    const fault = Fit.reverseCoverage(own, edge.from, edge.to, edge.points, edge.closed, limit);
    if (fault !== null) throw new Error(fault);
  }
  const edge = got.spans.at(-1)!;
  if (Fit.reverseCoverage(unit.arcs[edge.arc]!, edge.from, edge.to, run.slice(0, 2), false, limit) === null)
    throw new Error("a nonincident edge received reverse coverage credit");
  if (typeof Fit.runCorrespondence(unit, [run[0]!, [-run[0]![0], -run[0]![1]]], false) !== "string")
    throw new Error("an origin-crossing edge acquired a directed native chart");
}
