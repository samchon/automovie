import {
  type AutoMovieLoftContract,
  type AutoMovieSolidJoin,
  AutoMovieSolidMerge,
  type AutoMovieSolidRail,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";

import { HumanSolidShapes } from "../../../internal/HumanSolidShapes";

const { cylinder, plane } = HumanSolidShapes;

/**
 * A join that finds no rail names the premise its rail solve failed, with the solve's own numbers, and a join that finds its rails explains
 * them with the same numbers.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Merges a 20 mm cylinder along z onto the plane z = 0 with `AutoMovieSolidMerge.create` twice: once with the part's rail at a fixed station 5 mm below the plane, behind the contact on the part's kept side, so every rail is refused, and once with 8 mm chords, so every rail solves; reads the first join's "rails" diagnostic and the second join's `explain` at its seed parameter.
 * @evidence contracts/development/testing.md#independent-expectations Expectations are closed forms of the configuration: the cylinder's station line is its axis z at unit speed and the plane's outward normal is +z, so the facing (their dot product) is 1, the kept side is +1, and an 8 mm chord along the axis from the contact at z = 0 is 8 mm of station; the refused join's message names the station premise and the station -5.
 * @evidence contracts/development/testing.md#distinguishing-cases Red before the capability: the "rails" diagnostic named no premise ("no rail at t ... (host width ... mm)" alone) and the join had no `explain`. Green: the premise and numbers are named and the explanation agrees with the rail.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_rail_explain`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (a join that finds no rail names the premise its rail solve failed) as stated in this comment.
 */
export function test_construction_operator_rail_explain(): void {
  const failures: string[] = [];
  const r: number = 20;
  const part: IAutoMovieSolidSurface = cylinder("column", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], r);
  const host: IAutoMovieSolidSurface = plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const input = (width: { part: ((t: number) => number) | { station: number }; host: (t: number) => number }): AutoMovieSolidJoin.IInput => ({
    part,
    host,
    seed: { phi: 0, s: 0.5, y: r - 0.4, theta: 0.3 },
    count: 48,
    tolerance: 1e-12,
    grazing: 0.05,
    width,
  });

  // Refused: the part's rail at a station behind the contact.
  const refused: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create(input({ part: { station: -5 }, host: (): number => 8 }));
  const rails: AutoMovieLoftContract.IDiagnostic | undefined = refused.diagnostics.find((d: AutoMovieLoftContract.IDiagnostic): boolean => d.contract === "rails");
  if (refused.join !== null) failures.push("a part rail behind the contact was accepted");
  else if (rails === undefined) failures.push(`no "rails" diagnostic: ${refused.diagnostics.map((d) => d.detail).join("; ")}`);
  else {
    if (!rails.detail.includes("does not lie on its kept side")) failures.push(`the rails diagnostic names no premise: ${rails.detail}`);
    if (!rails.detail.includes("station -5")) failures.push(`the rails diagnostic omits the station: ${rails.detail}`);
    if (!rails.detail.includes("facing 1")) failures.push(`the rails diagnostic omits the facing: ${rails.detail}`);
  }

  // Solved: the explanation agrees with the rail and with the closed forms.
  const solved: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create(input({ part: (): number => 8, host: (): number => 8 }));
  if (solved.join === null) failures.push(`no join: ${solved.diagnostics.map((d) => d.detail).join("; ")}`);
  else {
    const t: number = solved.join.curve.points[0]!.t;
    const read: AutoMovieSolidRail.IExplanation | null = solved.join.explain(t);
    const rail: AutoMovieSolidRail.IRail | null = solved.join.rail(t);
    if (read === null || read.rail === null || rail === null) failures.push(`no explained rail at t ${t}: ${read?.refusal}`);
    else {
      if (read.refusal !== null) failures.push(`a solved rail carries a refusal: ${read.refusal}`);
      if (!(Math.abs(read.quantities.facing! - 1) <= 1e-9)) failures.push(`facing ${read.quantities.facing}, expected 1`);
      if (read.quantities.side !== 1) failures.push(`side ${read.quantities.side}, expected 1`);
      if (!(Math.abs(read.quantities.lambda! - 8) <= 1e-6)) failures.push(`lambda ${read.quantities.lambda}, expected 8`);
      if (!(Math.abs(read.rail.s - rail.s) <= 1e-12 && read.rail.hostFace === rail.hostFace)) failures.push(`the explained rail (s ${read.rail.s}) is not the join's (s ${rail.s})`);
    }
  }
  if (failures.length) throw new Error(`${failures.length} rail explanation failures:\n${failures.join("\n")}`);
}
