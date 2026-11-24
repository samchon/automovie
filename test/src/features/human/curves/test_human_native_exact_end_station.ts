import { AutoMovieViewLoft, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { IAutoMovieHumanConicLoft } from "@automovie/interface";

import { FamilyConicLoft } from "../../../reference-conics/FamilyConicLoft";

/**
 * @evidence contracts/development/testing.md#behavioral-verification The ordinary native preflight admits an exact cap start across a uniform four-station sampling.
 * @evidence contracts/development/testing.md#independent-expectations Multiplying this fractional endpoint by three then dividing rounds below the actual endpoint, so the legacy probe asks for two adjacent stations at one cap start.
 * @evidence contracts/development/testing.md#distinguishing-cases The original operation on the made station list demonstrably refuses the legacy wall while the literal published endpoint is admitted.
 * @evidence contracts/development/testing.md#execution-ownership One made local round loft and capped native probe.
 */
export function test_human_native_exact_end_station(): void {
  const end = 7.1, radius = 1, rho = Math.SQRT2 - 1;
  const control = [radius, 0, 0, radius, -radius, 0, 0, -radius, rho, rho, rho, rho];
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "round", centres: [[0, 0, 0], [0, 10, 0]], halves: [], up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(0), knots: [0, end / 2, end],
    values: control.map((v) => [v, v, v]), tips: [null, { from: end, tip: 9.3 }],
  };
  const old = [0, end / 3, 2 * end / 3, 3 * end / 3];
  if (!(old.at(-1)! < end)) throw new Error("the made endpoint must distinguish interpolation roundoff");
  const view = AutoMovieHumanConicLoft.part(family, old);
  if (AutoMovieViewLoft.create(view).chain !== null && realizeAutoMovieConstruction(
    { name: "probe.round", root: { type: "source", name: "round", source: "round" } },
    { chord: 0.001, sources: new Map([["round", view]]) },
  ).diagnostics.length === 0)
    throw new Error("the old one-ULP duplicate did not reach the existing station refusal");
  const faults = FamilyConicLoft.refusals(family, 3);
  if (faults.length > 0) throw new Error(faults.join("\n"));
}
