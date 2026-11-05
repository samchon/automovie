import { AutoMovieLoftChain, AutoMovieViewCurves, AutoMovieViewOutline, type IAutoMovieLoftChain, type IAutoMovieViewPart } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanNeckConstruction } from "../../../../../../packages/human/src/generation/AutoMovieHumanNeckConstruction";
import { AutoMovieHumanNeckSource } from "../../../../../../packages/human/src/generation/AutoMovieHumanNeckSource";
import { AutoMovieHumanHeadLane } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadLane";
import type { IAutoMovieHumanHeadInputs } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadInputs";
import { HumanHeadSourceSection } from "../../../internal/HumanHeadSourceSection";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The neck interval must preserve the production head's original source.
 * Anatomical tapes and internal adapter sections keep separate definitions.
 *
 * Scenarios:
 * 1. The open interval retains actual world guide points at its boundaries,
 * original knots, scalar extrema and span quarter points, including root parameters and analytic jets.
 * 2. Original boxes, quarter sources and native section lengths agree through
 * the interval; the actual chain's adopted C7 point keeps the public height.
 * 3. Horizontal observations at the retained proxy and three named heights,
 * and private harmonic XZ/3D path lengths, remain diagnostics. They do not
 * identify or certify the two anatomical tape courses.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds only f1's production head and its actual engine neck adapter, reading original scalar/frame sources independently of final body joins.
 * @evidence contracts/testing.md#independent-expectations Compares the new interval with the original mass's engine-evaluated world points, boxes, quarter values and native lengths. Public C7 and world scale come from the body input boundary. The original 1e-8 allowance remains unchanged. Diagnostic horizontal/harmonic lengths are not substituted tape expectations.
 * @evidence contracts/testing.md#distinguishing-cases Retains both interval boundaries, original scalar extrema and between-knot observations so changing pole inference or normalized jets cannot pass merely by keeping shape-knot values.
 * @evidence contracts/testing.md#execution-ownership One synchronous CPU unit selected by --include human_neck_source_curves owns one head and adapter; it uses no browser, GPU, extra person or body realization, and reports every collected finding before failing.
 */
export function test_human_neck_source_curves(): void {
  const params: ReturnType<typeof HumanPeople.params> = HumanPeople.params("f1");
  const inputs: IAutoMovieHumanHeadInputs = AutoMovieHumanBodyLaw.headInputs(params);
  const bodyScale: number = AutoMovieHumanBodyLaw.limbInputs(params).legs.scale;
  const source: AutoMovieHumanNeckSource.IOutput = AutoMovieHumanNeckSource.of(inputs, bodyScale);
  const lane: AutoMovieHumanHeadLane.IOutput = AutoMovieHumanHeadLane.create(inputs, AutoMovieHumanBodyAnatomy.sexOf(params), source);
  const neck: AutoMovieHumanNeckConstruction.IOutput = AutoMovieHumanNeckConstruction.generate(lane.source.massPart, source);
  const mass: IAutoMovieViewPart = lane.source.massPart;
  const original: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(mass);
  const interval: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(neck.part);
  const findings: string[] = [...neck.loft.diagnostics, ...interval.diagnostics].map((d: AutoMovieHumanNeckConstruction.IOutput["loft"]["diagnostics"][number]): string => `${d.producer}: ${d.contract}: ${d.detail}`);
  const distance: (a: readonly number[], b: readonly number[]) => number = (a: readonly number[], b: readonly number[]): number => Math.hypot(...a.map((value: number, i: number): number => value - b[i]!));
  const check: (name: string, actual: number, expected: number, unit?: string) => void = (name: string, actual: number, expected: number, unit: string = "mm"): void => {
    console.log(`${name}: actual=${actual}, expected=${expected}, delta=${actual - expected} ${unit}`);
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-8) findings.push(`${name}: ${actual} instead of ${expected}`);
  };
  if (neck.part.pole !== undefined) findings.push("neck interval must have open ends independently of its retained source parameter");
  let guideGap: number = 0;
  let parameterJetGap: number = 0;
  for (const curve of interval.curves) {
    const before: AutoMovieViewCurves.ICurve = original.curves.find((candidate: AutoMovieViewCurves.ICurve): boolean => candidate.name === curve.name)!;
    if (before.outline === null) { findings.push(`mass has no original ${curve.name}`); continue; }
    const knots: number[] = before.outline.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station);
    const stations: number[] = [neck.part.stations[0]!, neck.part.stations.at(-1)!, ...[...knots, ...AutoMovieViewOutline.criticalStations(before.outline), ...knots.slice(1).flatMap((s: number, i: number): number[] => [0.25, 0.5, 0.75].map((share: number): number => knots[i]! + share * (s - knots[i]!)))].filter((station: number): boolean => station >= neck.part.stations[0]! && station <= neck.part.stations.at(-1)!)];
    for (const station of stations) {
      const actual: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, neck.part.axis, station);
      const expected: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(before, mass.axis, station);
      if (typeof actual === "string" || typeof expected === "string") findings.push(`neck ${curve.name}@${station}: ${typeof actual === "string" ? actual : expected}`);
      else {
        guideGap = Math.max(guideGap, distance(actual.point, expected.point));
        parameterJetGap = Math.max(parameterJetGap, ...actual.scalar.parameterJet.map((value: number, i: number): number => Math.abs(value - expected.scalar.parameterJet[i]!)));
      }
    }
  }
  check("neck adapter retains original mass guides", guideGap, 0);
  check("neck adapter retains original parameter jets", parameterJetGap, 0, "source-parameter derivatives");
  let boxGap: number = 0;
  let shoulderGap: number = 0;
  let lengthGap: number = 0;
  for (const station of [...neck.part.stations, ...neck.part.stations.slice(1).map((y: number, i: number): number => (y + neck.part.stations[i]!) / 2)]) {
    try {
      const expected: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(mass, original, station);
      const actual: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(neck.part, interval, station);
      boxGap = Math.max(boxGap, ...expected.extents.map((value: number, i: number): number => Math.abs(value - actual.extents[i]!)));
      shoulderGap = Math.max(shoulderGap, ...expected.shoulders.map((value: number, i: number): number => Math.abs(value - actual.shoulders[i]!)));
      lengthGap = Math.max(lengthGap, Math.abs(expected.perimeter - actual.perimeter));
    } catch (error) { findings.push(`neck section@${station}: ${String(error)}`); }
  }
  check("neck adapter retains original boxes", boxGap, 0);
  check("neck adapter retains original quarters", shoulderGap, 0, "ratio");
  check("neck adapter retains original section lengths", lengthGap, 0);
  const chain: IAutoMovieLoftChain | null = neck.loft.chain;
  const nape: [number, number, number] = chain === null ? [NaN, NaN, NaN] : AutoMovieLoftChain.point(chain, chain.layers.at(-1)!.y, Math.PI);
  check("engine neck posterior C7 height", nape[1] / bodyScale, inputs.neckBase.cervicaleHeight);
  const back: AutoMovieViewCurves.ICurve = original.curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === "front.negative")!;
  const point: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(back, mass.axis, neck.part.stations.at(-1)!);
  if (typeof point === "string") findings.push(`neck posterior source: ${point}`);
  else check("engine neck shares actual posterior source", distance(point.point, nape), 0);
  console.log(`neck adapter source: ${JSON.stringify({ interval: [neck.part.stations[0], neck.part.stations.at(-1)], stations: neck.part.stations.length, order: neck.part.order, diagnostics: neck.loft.diagnostics, scope: "same original mass guides and axis; open engine adapter for old trunk, not a public base tape or final-skin equivalence" })}`);
  for (const [name, height] of [["retained mean-site proxy", source.head.level], ["resolved cervicale", inputs.neckBase.cervicaleHeight * bodyScale], ["resolved side neck", inputs.neckBase.sideNeckPointHeight * bodyScale], ["resolved suprasternale", inputs.neckBase.suprasternaleHeight * bodyScale]] as const) {
    try {
      console.log(`neck source section observation: ${JSON.stringify({ name, height, ...HumanHeadSourceSection.of(mass, original, height), inputNeck: inputs.neck * bodyScale, inputBase: inputs.neckBase.girth * bodyScale, scope: "original horizontal source only; the anatomical infrathyroid plane and named 3D base course remain unclosed" })}`);
    } catch (error) { findings.push(`${name} original source: ${String(error)}`); }
  }
  for (const [index, row] of source.rows.entries()) {
    const reads: { count: number; xz: number; spatial: number; minimumY: number; maximumY: number }[] = [source.order, 2048].map((count: number): { count: number; xz: number; spatial: number; minimumY: number; maximumY: number } => {
      let previous: [number, number, number] = AutoMovieHumanNeckSource.point(row, 0);
      let xz: number = 0;
      let spatial: number = 0;
      let minimumY: number = previous[1];
      let maximumY: number = previous[1];
      for (let i: number = 1; i <= count; i++) {
        const next: [number, number, number] = AutoMovieHumanNeckSource.point(row, 2 * Math.PI * i / count);
        xz += Math.hypot(next[0] - previous[0], next[2] - previous[2]);
        spatial += distance(next, previous);
        minimumY = Math.min(minimumY, next[1]); maximumY = Math.max(maximumY, next[1]);
        previous = next;
      }
      return { count, xz, spatial, minimumY, maximumY };
    });
    console.log(`neck original row observation: ${JSON.stringify({ index, sourceMean: row.origin, reads, scope: "retained private placement row; these diagnostic paths are not the current adapter skin or either anatomical tape" })}`);
  }
  console.log(`neck source findings: ${JSON.stringify(findings)}`);
  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}
