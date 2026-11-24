import { AutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanNail } from "@automovie/human";
import type { IAutoMovieHumanNail } from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * The physical dorsal relief and pole of a circular skin with two material clocks.
 *
 * Scenarios:
 * 1. The unturned chart owns positive relief at phase zero.
 * 2. The rolled chart owns positive relief at 135 degrees at the same axial station.
 * 3. Both reliefs vanish at the collapsed pole.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads each made nail with the engine relief evaluator.
 * @evidence contracts/development/testing.md#independent-expectations The known circular chart rotation gives both dorsal phases and the endpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases A phase walk that stops short leaves a zero on the rolled dorsal probe.
 * @evidence contracts/development/testing.md#execution-ownership Both source clocks and their two fits are constructed inside this scenario.
 * @evidence contracts/development/common.md#meaningful-documentation States each physical dorsal station and its independent material phase.
 */
export function test_human_nail_relief_clock(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  // A chart turns through 135 degrees over a physically unchanged circular
  // tube. The bar's median at 26.5 asks for a positive relief. The old
  // half-way phase walk ended at at most 110 degrees and gave exactly zero
  // where the rolled chart's median was at 135 degrees.
  const shape = (turned: boolean): IAutoMovieHumanNail.ISkin => ({
    first: 0,
    tip: 30,
    point: (station: number, phase: number): [number, number, number] => {
      const t: number = Math.max(0, Math.min(1, (station - 25) / 1.2));
      const roll: number = turned ? (3 * Math.PI / 4) * t ** 3 * (10 - 15 * t + 6 * t * t) : 0;
      const cap: number = Math.max(0, (station - 27) / 3);
      const r: number = 4 * Math.sqrt(Math.max(0, 1 - cap * cap));
      return [station, r * Math.cos(phase - roll), r * Math.sin(phase - roll)];
    },
  });
  const level: IAutoMovieHumanNail.IFrame = { origin: [0, 0, 0], distal: [1, 0, 0], dorsal: [0, 1, 0] };
  for (const turned of [false, true]) {
    const made: IAutoMovieHumanNail.INail = AutoMovieHumanNail.create(
      "nail.clock", "nailbed.clock", level, shape(turned),
      { width: 0.7, aspect: 0.62, radius: null, fold: 0.46, thickness: 0.46, lunula: 1, wrap: 1 },
      0.69, 0.145,
    );
    const phase: number = turned ? 3 * Math.PI / 4 : 0;
    if (!(AutoMovieLoftRelief.height(made.bed, 26.5, phase)[0] > 0))
      failures.push("the " + (turned ? "rolled" : "unrolled") + " dorsal phase lost its positive bed");
    near("the retained collapsed pole", AutoMovieLoftRelief.height(made.bed, 30, phase)[0], 0, 0);
  }
  finish();
}
