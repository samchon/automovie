import { AutoMovieLoftJet, AutoMovieLoftViewFullSource, AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1Nails } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieSolidSurface,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { HumanNailFixture } from "../../internal/HumanNailFixture";

/**
 * Nail sampling adds rings to the digit's direct original field.
 *
 * Scenarios:
 * 1. Insert a sample at station one through the actual relief adapter. The direct source and loft read the same point and station derivatives there.
 * 2. Build a new outline using the authored ordinate at station one. Its value and both derivatives differ, although the old three controls agree.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production relief adapter and reads the new sample from the original source and ordinary emitted loft.
 * @evidence contracts/development/testing.md#independent-expectations The control ordinates are those of a quadratic. The expected derivatives come from the natural cubic's tridiagonal equations, not the emitted splines.
 * @evidence contracts/development/testing.md#distinguishing-cases The two cases use the same station but only the second changes scalar controls. A cap and native transported aperture are covered by their own fixtures.
 * @evidence contracts/development/testing.md#execution-ownership Builds one short analytic wall and a zero relief in process, without a figure, fit, or raster.
 * @evidence contracts/development/common.md#meaningful-documentation States the natural cubic comparison and the display-only control.
 */
export function test_human_nail_original_source(): void {
  const { failures, near, finish }: ReturnType<typeof HumanNailFixture.observations> = HumanNailFixture.observations();
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "digit",
    centres: [[0, 0, 0], [0, 0, 4]],
    halves: [],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, 1, 2, 4],
    values: [
      [5, 4.25, 4, 5], [0, 0, 0, 0], [0, 0, 0, 0], [5, 4.25, 4, 5],
      [-5, -4.25, -4, -5], [0, 0, 0, 0], [0, 0, 0, 0], [-5, -4.25, -4, -5],
      ...Array.from({ length: 4 }, (): number[] => new Array<number>(4).fill(Math.SQRT2 - 1)),
    ],
  };
  const original: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(family, [0, 2, 4]);
  const relief: IAutoMovieLoftRelief = {
    name: "bed",
    stations: [1, 3],
    phases: [-Math.PI / 16, Math.PI / 16],
    axis: [1, 0, 0],
    rows: 7,
    columns: 7,
    heights: new Array<number>(49).fill(0),
  };
  const emitted: IAutoMovieViewPart = AutoMovieHumanF1Nails.addReliefs(original, family, [relief]);
  if (original.stations.includes(1) || !emitted.stations.includes(1) ||
      original.front !== emitted.front || original.side !== emitted.side ||
      original.fullness !== emitted.fullness || original.axis !== emitted.axis ||
      emitted.reliefs?.[0] !== relief ||
      emitted.samples !== (2 * Math.PI * (relief.columns - 3)) / (relief.phases[1] - relief.phases[0]))
    failures.push("the relief sample did not preserve the original controls");
  const replaced: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(family, [0, 1, 2, 4]);
  const project = (v: AutoMovieVector3Tuple): number => {
    const u: AutoMovieVector3Tuple = original.axis.at(1).u;
    return v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  };
  const jet = (part: IAutoMovieViewPart): number[] => {
    const read: IAutoMovieSolidSurface.IJet = AutoMovieLoftViewFullSource.create(part).jet(1, 0);
    return [read.p, read.u, read.uu].map(project);
  };
  // With knots 0, 2 and 4, the middle natural curvature is 3/4.
  // Inserting the authored ordinate at one instead yields 54/92 there.
  const held: number[] = [4 + 5 / 16, -9 / 16, 3 / 8];
  const changed: number[] = [4.25, -51 / 92, 54 / 92];
  const loft: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(emitted);
  const readings: [string, number[], number[]][] = [
    ["original", jet(original), held],
    ["relief samples", jet(emitted), held],
    ["replaced controls", jet(replaced), changed],
  ];
  if (loft.chain === null || loft.diagnostics.length !== 0) {
    failures.push("the actual emitted sampled digit did not loft");
  } else {
    const actual: IAutoMovieLoftSurfaceJet = AutoMovieLoftJet.at(loft.chain, 1, 0);
    readings.push(["emitted loft", [actual.p, actual.s, actual.ss].map(project), held]);
  }
  for (const [name, actual, expected] of readings)
    for (const [order, value] of actual.entries())
      near(name + " station derivative " + order, value, expected[order]!, 1e-10);
  finish();
}
