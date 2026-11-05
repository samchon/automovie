import { AutoMovieLoftChain, AutoMovieLoftFrame, AutoMovieViewCurves, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieViewPart, measureAutoMovieCurveLength64 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanNeckConstruction } from "../../../../../../packages/human/src/generation/AutoMovieHumanNeckConstruction";
import { AutoMovieHumanNeckSource } from "../../../../../../packages/human/src/generation/AutoMovieHumanNeckSource";
import { AutoMovieHumanHeadLane } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadLane";
import type { IAutoMovieHumanHeadInputs } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadInputs";
import { HumanHeadSourceSection } from "../../../internal/HumanHeadSourceSection";
import { HumanPeople } from "../../../internal/HumanPeople";

/** Regular analytic frame jet returned by the existing public part axis. */
type SourceFrameJet = NonNullable<ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>>;

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
 * 4. The adopted normal-plane cut belongs to the actual canonical conic
 * source; its plane, constant/affine span jets and public tape length agree.
 * Its mean site, lateral scale and posterior-skin slope remain proxies;
 * no public measurement requires a circle or a central origin.
 * 5. A higher-K observer measures the named-height base on the actual mass,
 * including its axis derivative. Public heights, C7 XYZ and the independent
 * tape target remain distinct from the builder's root and K/K2 observation.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds only f1's production head and its actual engine neck adapter, reading original scalar/frame sources independently of final body joins.
 * @evidence contracts/testing.md#independent-expectations Compares the interval with the original mass's engine-evaluated world points, boxes, quarter values and native lengths. Public tapes/three heights and world scale come from the body input boundary. A separate higher-K callback reads canonical original extents and axis jets, not the builder's source, root residual or reported length. Plane/cylinder membership and exact named public heights prevent a floating curve from supplying the tape. The original 1e-8 allowance remains unchanged; thyroid-site identity and taut contact remain unproved.
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
  const authored: typeof lane.source.neck = lane.source.neck;
  if (authored === null) findings.push("production head has no lower-head source/course declaration");
  else {
    const edge: (name: AutoMovieViewCurves.ICurve["name"], y: number) => AutoMovieViewOutline.IReading = (name: AutoMovieViewCurves.ICurve["name"], y: number): AutoMovieViewOutline.IReading => {
      const outline: AutoMovieViewOutline.IOutline | null = original.curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === name)!.outline;
      if (outline === null) throw new Error(`No original neck ${name}`);
      const reading: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(outline, y);
      if (typeof reading === "string") throw new Error(reading);
      if (reading.stationJet === null) throw new Error(`Nonregular original neck ${name}@${y}`);
      return reading;
    };
    const frame: (y: number) => SourceFrameJet = (y: number): SourceFrameJet => {
      const value: SourceFrameJet | null = mass.axis.jet?.(y) ?? null;
      if (value === null) throw new Error(`Nonregular original neck axis@${y}`);
      return value;
    };
    const g: number = inputs.neck * bodyScale;
    const r: number = g / (2 * Math.PI);
    const m: number = source.head.backSlope;
    const h: number = Math.hypot(1, m);
    const yc: number = source.head.level;
    const observedMean: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(mass, original, yc);
    const template: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents: observedMean.extents }, observedMean.shoulders);
    const centre: [number, number, number] = mass.axis.at(yc).origin;
    const normal: [number, number, number] = [m / h, 1 / h, 0];
    const namedBack: [number, number, number] = [source.head.back, inputs.neckBase.cervicaleHeight * bodyScale, 0];
    check("neck retains adopted mean origin X", centre[0], source.head.x);
    check("neck adopted mean plane-centre height", centre[1], yc);
    check("neck declared lateral scale", observedMean.extents[1], r);
    const projected: [number, number] = [yc - m * observedMean.extents[0] / (h * h), yc + m * observedMean.extents[2] / (h * h)];
    const low: number = Math.min(...projected);
    const high: number = Math.max(...projected);
    const band: number[] = [...new Set([low, high, ...mass.front.positive.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station).filter((y: number): boolean => y > low && y < high)])].sort((a: number, b: number): number => a - b);
    const bandReads: number[] = [...band, ...band.slice(1).map((y: number, i: number): number => (y + band[i]!) / 2)].filter((y: number): boolean => y >= low && y <= high);
    let bandError: number = 0;
    let bandJetError: number = 0;
    for (const y of bandReads) {
      try {
        const a: AutoMovieViewOutline.IReading = edge("front.positive", y);
        const b: AutoMovieViewOutline.IReading = edge("side.positive", y);
        const back: AutoMovieViewOutline.IReading = edge("front.negative", y);
        const right: AutoMovieViewOutline.IReading = edge("side.negative", y);
        const axis: SourceFrameJet = frame(y);
        const section: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(mass, original, y);
        if (section.fault !== null) findings.push(`normal band section@${y}: ${section.fault}`);
        bandError = Math.max(bandError, Math.abs(a.value - observedMean.extents[0]), Math.abs(back.value + observedMean.extents[2]), Math.abs(b.value - r), Math.abs(right.value + b.value), Math.abs(axis.value.origin[0] - centre[0] - m * (y - yc)), distance(axis.value.u, [1, 0, 0]), distance(axis.value.v, [0, 0, 1]), ...section.shoulders.map((rho: number): number => Math.abs(rho - AutoMovieViewSection.ELLIPSE)));
        bandJetError = Math.max(bandJetError, ...a.stationJet!.map(Math.abs), ...b.stationJet!.map(Math.abs), ...back.stationJet!.map(Math.abs), ...right.stationJet!.map(Math.abs), Math.abs(axis.first.origin[0] - m), ...axis.second.origin.map(Math.abs));
      } catch (error) { findings.push(`normal band original source@${y}: ${String(error)}`); }
    }
    check("neck normal band actual source values/quarters", bandError, 0);
    check("neck normal band constant-template/affine-axis jets", bandJetError, 0, "station derivatives");

    // Both course observers use canonical original edges and the actual
    // axis jet; they never borrow the builder's derivative or root result.
    const derivative: (y: number, dy: number, theta: number, turn: number) => [number, number, number] = (y: number, dy: number, theta: number, turn: number): [number, number, number] => {
      const b: AutoMovieViewOutline.IReading = edge("side.positive", y);
      const axis: SourceFrameJet = frame(y);
      const [radial, first]: [number, number, number] = AutoMovieViewSection.radius(template, theta);
      const q: number = b.value / observedMean.extents[1];
      const dq: number = b.stationJet![0] * dy / observedMean.extents[1];
      const u: number = q * radial * Math.cos(theta);
      const v: number = q * radial * Math.sin(theta);
      const du: number = dq * radial * Math.cos(theta) + q * (first * Math.cos(theta) - radial * Math.sin(theta)) * turn;
      const dv: number = dq * radial * Math.sin(theta) + q * (first * Math.sin(theta) + radial * Math.cos(theta)) * turn;
      return [0, 1, 2].map((k: number): number => axis.first.origin[k]! * dy + axis.first.u[k]! * dy * u + axis.value.u[k]! * du + axis.first.v[k]! * dy * v + axis.value.v[k]! * dv) as [number, number, number];
    };
    try {
      let membership: number = 0;
      let plane: number = 0;
      for (let i: number = 0; i <= 64; i++) {
        const phi: number = 2 * Math.PI * i / 64;
        const radial: number = AutoMovieViewSection.radius(template, phi)[0];
        const templateU: number = radial * Math.cos(phi);
        const templateV: number = radial * Math.sin(phi);
        const y: number = yc - m * templateU / (h * h);
        const originalFrame: AutoMovieLoftFrame.IFrame = mass.axis.at(y);
        const observed: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(mass, original, y);
        const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents: observed.extents }, observed.shoulders);
        const actual: number = AutoMovieViewSection.radius(section, phi)[0];
        const p: [number, number, number] = AutoMovieLoftFrame.place(originalFrame, actual * Math.cos(phi), actual * Math.sin(phi));
        membership = Math.max(membership, distance(p, [centre[0] + templateU / (h * h), y, templateV]));
        plane = Math.max(plane, Math.abs(p.reduce((sum: number, value: number, k: number): number => sum + (value - centre[k]!) * normal[k]!, 0)));
      }
      const partition: number[] = [...new Set([0, ...template.knots.map((k: AutoMovieViewSection.ISection["knots"][number]): number => k.angle), 2 * Math.PI])].sort((a: number, b: number): number => a - b);
      const measured: ReturnType<typeof measureAutoMovieCurveLength64> = measureAutoMovieCurveLength64(partition.slice(1).map((end: number, i: number): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({ domain: [partition[i]!, end], derivative: (phi: number): [number, number, number] => { const [radial, first]: [number, number, number] = AutoMovieViewSection.radius(template, phi); const u: number = radial * Math.cos(phi); const du: number = first * Math.cos(phi) - radial * Math.sin(phi); return derivative(yc - m * u / (h * h), -m * du / (h * h), phi, 1); } })), 8);
      check("neck normal course lies on actual source", membership, 0);
      check("neck normal course plane", plane, 0);
      check("neck normal course public tape", measured.lengthMm, g);
      console.log(`neck normal course observation: ${JSON.stringify({ measured, producer: authored.normalMeasured, centre, normal, extents: observedMean.extents, band: [low, high], scope: "actual original conic cut; retained mean/slope/lateral proxies do not identify the palpated infrathyroid site or final-skin contact" })}`);
    } catch (error) { findings.push(`normal course original source: ${String(error)}`); }

    try {
      const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(authored.height);
      if ("detail" in prepared) throw new Error(prepared.detail);
      const height: (s: number) => AutoMovieViewOutline.IReading = (s: number): AutoMovieViewOutline.IReading => {
        const reading: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(prepared, s);
        if (typeof reading === "string") throw new Error(reading);
        if (reading.stationJet === null) throw new Error("Base height has no regular original derivative");
        return reading;
      };
      const clock: number = authored.height.knots.at(-1)!.station;
      const cuts: number[] = authored.height.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station);
      cuts.push(...template.knots.map((k: AutoMovieViewSection.ISection["knots"][number]): number => {
        const quarter: number = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI].indexOf(k.angle);
        return quarter < 0 ? clock * (k.angle / (2 * Math.PI)) : authored.height.knots[quarter]!.station;
      }));
      const knots: number[] = [...new Set(original.curves.flatMap((curve: AutoMovieViewCurves.ICurve): number[] => curve.outline?.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station) ?? []))];
      for (let i: number = 0; i + 1 < authored.height.knots.length; i++) {
        const a: IAutoMovieViewPart.IKnot = authored.height.knots[i]!;
        const b: IAutoMovieViewPart.IKnot = authored.height.knots[i + 1]!;
        for (const y of knots.filter((y: number): boolean => y > Math.min(a.value, b.value) && y < Math.max(a.value, b.value))) {
          let lo: number = a.station;
          let hi: number = b.station;
          for (let k: number = 0; k < 60; k++) { const middle: number = (lo + hi) / 2; if (middle === lo || middle === hi) break; if ((height(middle).value < y) === (a.value < b.value)) lo = middle; else hi = middle; }
          cuts.push((lo + hi) / 2);
        }
      }
      const partition: number[] = [...new Set(cuts)].sort((a: number, b: number): number => a - b);
      const measured: ReturnType<typeof measureAutoMovieCurveLength64> = measureAutoMovieCurveLength64(partition.slice(1).map((end: number, i: number): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({ domain: [partition[i]!, end], derivative: (s: number): [number, number, number] => { const y: AutoMovieViewOutline.IReading = height(s); return derivative(y.value, y.stationJet![0], 2 * Math.PI * s / clock, 2 * Math.PI / clock); } })), 8);
      let membership: number = 0;
      let homothety: number = 0;
      for (const s of [...partition, ...partition.slice(1).map((end: number, i: number): number => (partition[i]! + end) / 2)]) {
        const y: number = height(s).value;
        const phi: number = 2 * Math.PI * s / clock;
        const observed: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(mass, original, y);
        const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents: observed.extents }, observed.shoulders);
        const q: number = observed.extents[1] / observedMean.extents[1];
        const radial: number = q * AutoMovieViewSection.radius(template, phi)[0];
        const u: number = radial * Math.cos(phi);
        const v: number = radial * Math.sin(phi);
        membership = Math.max(membership, Math.abs(Math.hypot(u, v) - AutoMovieViewSection.radius(section, Math.atan2(v, u))[0]));
        homothety = Math.max(homothety, ...observed.extents.map((value: number, k: number): number => Math.abs(value - q * observedMean.extents[k]!)), ...observed.shoulders.map((rho: number): number => Math.abs(rho - AutoMovieViewSection.ELLIPSE)));
      }
      check("neck base course lies on actual source", membership, 0);
      check("neck base actual homothetic conic family", homothety, 0);
      for (const [i, expected] of [inputs.neckBase.suprasternaleHeight, inputs.neckBase.sideNeckPointHeight, inputs.neckBase.cervicaleHeight, inputs.neckBase.sideNeckPointHeight, inputs.neckBase.suprasternaleHeight].entries()) {
        const s: number = authored.height.knots[i]!.station;
        const y: number = height(s).value;
        const phi: number = 2 * Math.PI * s / clock;
        const section: HumanHeadSourceSection.IOutput = HumanHeadSourceSection.of(mass, original, y);
        const actual: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents: section.extents }, section.shoulders);
        const radial: number = AutoMovieViewSection.radius(actual, phi)[0];
        const point: [number, number, number] = AutoMovieLoftFrame.place(mass.axis.at(y), radial * Math.cos(phi), radial * Math.sin(phi));
        check(`neck actual base named height ${i}`, point[1] / bodyScale, expected);
        if (i === 2) check("neck actual base posterior C7 point", distance(point, namedBack), 0);
        check(`neck base opposite lateral ${i}`, section.extents[1] - section.extents[3], 0);
        check(`neck base ellipse quarters ${i}`, Math.max(...section.shoulders.map((rho: number): number => Math.abs(rho - AutoMovieViewSection.ELLIPSE))), 0, "ratio");
      }
      check("neck actual named base public tape", measured.lengthMm, inputs.neckBase.girth * bodyScale);
      console.log(`neck base course observation: ${JSON.stringify({ measured, producer: authored.measured, pieces: partition.length - 1, publicTarget: inputs.neckBase.girth * bodyScale, scope: "higher-K canonical original world speed including axis drift; K/K2 is not an error bound or anatomical tape-contact certificate" })}`);
    } catch (error) { findings.push(`base course original source: ${String(error)}`); }
  }
  for (const [name, height] of [["retained mean-site proxy", source.head.level], ["resolved cervicale", inputs.neckBase.cervicaleHeight * bodyScale], ["resolved side neck", inputs.neckBase.sideNeckPointHeight * bodyScale], ["resolved suprasternale", inputs.neckBase.suprasternaleHeight * bodyScale]] as const) {
    try {
      console.log(`neck source section observation: ${JSON.stringify({ name, height, ...HumanHeadSourceSection.of(mass, original, height), inputNeck: inputs.neck * bodyScale, inputBase: inputs.neckBase.girth * bodyScale, scope: "horizontal source diagnostic, distinct from the separately observed declared courses and their unresolved anatomical site/contact" })}`);
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
