import { AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";

import { FamilyConicProject as P } from "../../../reference-conics/FamilyConicProject";

/**
 * The projection of a relief net onto another grid of its window, on made nets.
 *
 * Scenarios:
 * 1. A net projected onto its own grid is itself: a made 10 by 12 net with heights of two decimals inside its three zero rings returns
 *    every height exactly, and its difference from itself and from its projection is 0.
 * 2. A net that is its own mirror image, projected with its symmetry held, onto its own 10 by 13 grid returns itself exactly, and onto a
 *    coarser 8 by 9 grid equals its own column reversal to the last bit.
 * 3. The three outer rings of every projection are exactly zero, on the own grid and on a coarser one.
 * 4. `symmetrised` gives each pair of mirror controls their mean, written here as a closed form, and the result is its own reversal.
 * 5. A grid under 7 controls a side and an even column count with symmetry held are refused.
 * 6. `fitSamples` fitted to a net's own surface, read by the engine at uneven stations and phases, returns the net exactly, plain and
 *    mirrored with its symmetry held; with samples only under the lower third of the window's stations it returns null.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `project`, `difference`, `symmetrised`, `symmetric` and `fitSamples` of `FamilyConicProject`.
 * @evidence contracts/development/testing.md#independent-expectations A projection onto the space a net already lies in is the net, and so is a fit to samples of the net's own surface; a mirror pair's mean and the zero rings are closed forms written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Heights that differ in every row and column tell a transposed or shifted solve from the right one; the symmetric net on its own grid fails when a mirror column's weight is left out of the solve.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on made numbers, reached by `--include human_conic_project`, with no reference body or figure.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with what it is checked against.
 */
export function test_human_conic_project(): void {
  const failures: string[] = [];
  const same = (label: string, got: readonly number[], want: readonly number[]): void => {
    if (got.length !== want.length || got.some((x: number, i: number): boolean => x !== want[i])) failures.push(`${label}: ${JSON.stringify(got)} against ${JSON.stringify(want)}`);
  };
  const refused = (label: string, call: () => unknown): void => {
    try {
      call();
      failures.push(label + ": not refused");
    } catch {
      // Refused, as it must be.
    }
  };
  const made = (rows: number, columns: number, height: (a: number, b: number) => number): IAutoMovieLoftRelief => ({
    name: "made",
    stations: [100, 190],
    phases: [-0.6, 0.6],
    axis: [-1, 0, 0],
    rows,
    columns,
    heights: Array.from({ length: rows * columns }, (_: unknown, i: number): number => {
      const [a, b]: [number, number] = [Math.floor(i / columns), i % columns];
      return a < 3 || b < 3 || a >= rows - 3 || b >= columns - 3 ? 0 : height(a, b);
    }),
  });
  const ringed = (label: string, net: IAutoMovieLoftRelief): void => {
    const ring: number[] = net.heights.filter((_: number, i: number): boolean => Math.floor(i / net.columns) < 3 || i % net.columns < 3 || Math.floor(i / net.columns) >= net.rows - 3 || i % net.columns >= net.columns - 3);
    if (ring.some((h: number): boolean => h !== 0)) failures.push(label + ": an outer ring holds a height other than zero");
  };

  // 1. Onto its own grid a net is itself.
  const height = (a: number, b: number): number => Math.round((1.37 * a - 0.81 * b + 0.25 * a * b) * 100) / 100;
  const plain: IAutoMovieLoftRelief = made(10, 12, height);
  const own: IAutoMovieLoftRelief = P.project(plain, 10, 12, false, 2, 4);
  same("own grid", own.heights, plain.heights);
  same("difference from itself and from its projection", [P.difference(plain, plain, 4).max, P.difference(plain, own, 4).max], [0, 0]);

  // 2. A mirrored net keeps its symmetry, on its own grid and on a coarser one.
  const mirrored: IAutoMovieLoftRelief = made(10, 13, (a: number, b: number): number => Math.round((0.9 * a + 0.43 * Math.min(b, 12 - b) ** 2) * 100) / 100);
  same("mirrored on its own grid", P.project(mirrored, 10, 13, true, 2, 4).heights, mirrored.heights);
  const coarse: IAutoMovieLoftRelief = P.project(mirrored, 8, 9, true, 2, 4);
  if (!P.symmetric(coarse)) failures.push("a mirrored net's coarser projection is not its own mirror image");
  if (coarse.heights.every((h: number): boolean => h === 0)) failures.push("a mirrored net's coarser projection is empty");

  // 3. The zero rings stay zero.
  ringed("own grid", own);
  ringed("coarser mirrored", coarse);
  ringed("coarser plain", P.project(plain, 8, 9, false, 2, 4));

  // 4. The mean of each mirror pair.
  const meant: IAutoMovieLoftRelief = P.symmetrised(plain, 3);
  same("symmetrised", meant.heights, made(10, 12, (a: number, b: number): number => Math.round(((height(a, b) + height(a, 11 - b)) / 2) * 1000) / 1000).heights);
  if (!P.symmetric(meant)) failures.push("a symmetrised net is not its own mirror image");

  // 5. Refusals.
  refused("six rows", (): IAutoMovieLoftRelief => P.project(plain, 6, 12, false, 2, 4));
  refused("an even column count with symmetry", (): IAutoMovieLoftRelief => P.project(mirrored, 10, 12, true, 2, 4));

  // 6. A net fitted to samples of a surface: its own surface read by the engine at uneven stations covering part of the window's
  // stations and at uneven phases, so the fit returns the net exactly; the mirrored net with its symmetry held likewise; and none
  // where a free row has no sample under its span.
  const read = (net: IAutoMovieLoftRelief, stations: number[], phases: number[]): number[][] => stations.map((s: number): number[] => phases.map((t: number): number => AutoMovieLoftRelief.height(net, s, t)[0]));
  const uneven = (from: number, to: number, count: number): number[] => Array.from({ length: count }, (_: unknown, k: number): number => from + (to - from) * ((k + 0.5) / count) ** 1.3);
  const window = { name: "made", stations: [100, 190] as [number, number], phases: [-0.6, 0.6] as [number, number], axis: [-1, 0, 0] as [number, number, number] };
  const [stations, phases]: number[][] = [uneven(100, 190, 61), uneven(-0.6, 0.6, 53)];
  same("fitted to its own surface", P.fitSamples(window, 10, 12, false, 2, { stations: stations!, phases: phases!, heights: read(plain, stations!, phases!) })?.heights ?? [], plain.heights);
  same("mirrored, fitted to its own surface", P.fitSamples(window, 10, 13, true, 2, { stations: stations!, phases: phases!, heights: read(mirrored, stations!, phases!) })?.heights ?? [], mirrored.heights);
  const low: number[] = stations!.filter((s: number): boolean => s < 130);
  if (P.fitSamples(window, 10, 12, false, 2, { stations: low, phases: phases!, heights: read(plain, low, phases!) }) !== null) failures.push("a fit whose upper rows have no sample is not refused");

  if (failures.length > 0) throw new Error("conic project:\n" + failures.join("\n"));
}
