import { AutoMovieEngineSolidMerge } from "@automovie/engine";
import type {
  IAutoMovieLoftContract,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

/**
 * `AutoMovieEngineSolidMerge.create` names the premise its rail solve failed, with
 * that solve's numbers, and a join's `explain(t)` explains a found rail with
 * the same numbers as `rail(t)`.
 *
 * Fixture: a column of radius 20 standing on the floor plane z = 0, seeded at
 * phase 0, 48 columns, tolerance 1e-12.
 *
 * Scenarios:
 *
 * 1. A part rail at station -5, behind the contact, is refused with a `rails`
 *    diagnostic naming "does not lie on its kept side", "station -5" and
 *    "facing 1".
 * 2. Rails of width 8 on both faces solve: at the first curve point the
 *    explanation has no refusal, facing 1, side 1, lambda 8 within 1e-6, and
 *    the rail of `rail(t)` (the same s and host face).
 */
export function test_engine_geometry_solid_merge_rail_explain(): void {
  const r: number = 20;
  const part: IAutoMovieSolidSurface = HumanSolidShapes.cylinder("column", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], r);
  const host: IAutoMovieSolidSurface = HumanSolidShapes.plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const merge = (width: IAutoMovieSolidJoin.IInput["width"]): IAutoMovieSolidJoin.IResult =>
    AutoMovieEngineSolidMerge.create({
      part,
      host,
      seed: { phi: 0, s: 0.5, y: r - 0.4, theta: 0.3 },
      count: 48,
      tolerance: 1e-12,
      grazing: 0.05,
      width,
    });

  // 1.
  const refused: IAutoMovieSolidJoin.IResult = merge({ part: { station: -5 }, host: (): number => 8 });
  TestValidator.equals("no join", refused.join, null);
  const rails: IAutoMovieLoftContract.IDiagnostic | undefined = refused.diagnostics.find(
    (d: IAutoMovieLoftContract.IDiagnostic): boolean => d.contract === "rails",
  );
  for (const words of ["does not lie on its kept side", "station -5", "facing 1"])
    TestValidator.predicate(`names ${words}`, rails !== undefined && rails.detail.includes(words));

  // 2.
  const solved: IAutoMovieSolidJoin.IResult = merge({ part: (): number => 8, host: (): number => 8 });
  if (solved.join === null) throw new Error(solved.diagnostics.map((d) => d.detail).join("; "));
  const t: number = solved.join.curve.points[0]!.t;
  const read: IAutoMovieSolidRail.IExplanation | null = solved.join.explain(t);
  const rail: IAutoMovieSolidRail.IRail | null = solved.join.rail(t);
  if (read === null || read.rail === null || rail === null) throw new Error(`no explained rail at ${t}`);
  TestValidator.equals("no refusal", read.refusal, null);
  TestValidator.predicate("facing 1", Math.abs(read.quantities.facing! - 1) <= 1e-9);
  TestValidator.equals("side 1", read.quantities.side, 1);
  TestValidator.predicate("lambda 8", Math.abs(read.quantities.lambda! - 8) <= 1e-6);
  TestValidator.predicate(
    "same rail",
    Math.abs(read.rail.s - rail.s) <= 1e-12 && read.rail.hostFace === rail.hostFace,
  );
}
