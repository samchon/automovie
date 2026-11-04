import { AutoMovieConstructionViews, AutoMovieLoftChain, AutoMovieViewCurves, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionAxis, AutoMovieConstructionFullness, AutoMovieConstructionNode, IAutoMovieConstructionOutline, IAutoMovieConstructionView, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanHeadArcs } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadArcs";
import { AutoMovieHumanHeadLandmarks } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPrior } from "../../../../../../packages/human/src/generation/AutoMovieHumanHeadPrior";
import { AutoMovieHumanNeckSource } from "../../../../../../packages/human/src/generation/AutoMovieHumanNeckSource";
import { AutoMovieHumanEarPlace } from "../../../../../../packages/human/src/generation/AutoMovieHumanEarPlace";
import { AutoMovieHumanReferenceOutlines } from "../../../../../../packages/human/src/generation/AutoMovieHumanReferenceOutlines";
import type { IAutoMovieHumanHeadInputs } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadLayout } from "../../../../../../packages/human/src/generation/IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadEarFrame } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadEarFrame";
import { AutoMovieHumanHeadEarPlate } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadEarPlate";
import { AutoMovieHumanHeadLane } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadLane";
import { AutoMovieHumanHeadLayout } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadSectionConstraints } from "../../../../../../packages/human/src/generation/head/AutoMovieHumanHeadSectionConstraints";
import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * Original head curves must keep the public measurement sites and share
 * their neighbours' actual frames through spans, before any skin join.
 *
 * Scenarios:
 * 1. Original signed edges retain finite orthonormal frames at knots,
 * isolated scalar extrema and span middles, including both asymmetric sides.
 * 2. Public cranial breadth and ft/zy/go widths reach actual source points;
 * local posterior calipers cannot exceed the supplied maximum head length.
 * 3. Nasal, lip, c-j/sa-sba and own eye chords keep their definitions;
 * closed-lip contacts and primary Bernstein upper curves agree through spans.
 * 4. Actual declarations replay at three physical scales. Independent eye
 * studies remain outside the tree; horizontal sections and harmonic path
 * lengths are diagnostic observations, not substituted anatomical tapes.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the production lane's composed original views through the engine's shared source owner, independently of surviving loft sections and of final skin realization.
 * @evidence contracts/testing.md#independent-expectations Public Euclidean distances, cervicale/stature/head height, coincident closed-lip contacts and direct Bernstein evaluation of the primary upper-lid controls are the oracles. Their calibration scale comes independently from the body's resolved input boundary, never from the head scale being checked. The 1e-8 mm bound permits numerical conversion only, not anatomical displacement. The photo pupil's (0,0) uses the contour's same affine map, not the endpoint chord; this remains a template-based 3D placement. Constant AP is checked relative to an endpoint, not as an independently measured global seat.
 * @evidence contracts/testing.md#distinguishing-cases Both asymmetric f1 sides, source poles, scalar extrema and between-knot positions distinguish a correct knot list from a coherent original curve and neighbour frame. Actual declaration replay at factors 0.5, 1 and 2 distinguishes a preserved source axis/parameter from a sampled minimal course; these are unit-scaled copies of f1, not another person.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous CPU unit reached by --include human_head_source_curves builds only f1's head; it uses no host, browser, GPU or final body realization and reports all findings before failing.
 */
export function test_human_head_source_curves(): void {
  const params: IAutoMovieHumanParameters = HumanPeople.params("f1");
  const inputs: IAutoMovieHumanHeadInputs = AutoMovieHumanBodyLaw.headInputs(params);
  const bodyScale: number = AutoMovieHumanBodyLaw.limbInputs(params).legs.scale;
  const neck: IAutoMovieLoftChain = AutoMovieHumanBodyLaw.neckRing(params);
  const neckSource: AutoMovieHumanNeckSource.IOutput = AutoMovieHumanNeckSource.of(inputs, bodyScale);
  const lane: AutoMovieHumanHeadLane.IOutput = AutoMovieHumanHeadLane.create(inputs, AutoMovieHumanBodyAnatomy.sexOf(params), neckSource);
  const original: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLayout.create(neckSource, inputs);
  const tragion: number = original.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, AutoMovieHumanBodyAnatomy.sexOf(params)) * original.scale;
  const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLandmarks.atTragion(original, tragion);
  const parts: IAutoMovieViewPart[] = [lane.source.massPart, ...lane.source.parts.map((p: AutoMovieHumanHeadLane.IOutput["source"]["parts"][number]): IAutoMovieViewPart => p.feature.part), ...lane.source.studies.map((p: AutoMovieHumanHeadLane.IOutput["source"]["studies"][number]): IAutoMovieViewPart => p.part)];
  const findings: string[] = [];
  const prepared: Map<string, AutoMovieViewCurves.IResult> = new Map();
  const byName: Map<string, IAutoMovieViewPart> = new Map(parts.map((part: IAutoMovieViewPart): [string, IAutoMovieViewPart] => [part.name, part]));
  const production: Map<string, IAutoMovieConstructionView> = new Map();
  collect(lane.root, production);
  // Studies have original declarations, but are explicitly outside the skin tree.
  for (const study of lane.source.studies) production.set(study.part.name, study.view);
  const check: (name: string, actual: number, expected: number, unit?: string) => void = (name: string, actual: number, expected: number, unit: string = "mm"): void => {
    console.log(`${name}: actual=${actual}, expected=${expected}, delta=${actual - expected} ${unit}`);
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-8) findings.push(`${name}: ${actual} instead of ${expected}`);
  };

  // An analytic circle distinguishes a named point from an entire lateral
  // support. These are geometry fixtures, not another person's generation.
  const diagonal: number = 10 * Math.SQRT1_2;
  const ellipse: [number, number, number, number] = [AutoMovieViewSection.ELLIPSE, AutoMovieViewSection.ELLIPSE, AutoMovieViewSection.ELLIPSE, AutoMovieViewSection.ELLIPSE];
  check("circle anterior shoulder", AutoMovieHumanHeadSectionConstraints.frontal([10, 10, 10, 10], ellipse[0], diagonal, diagonal), Math.SQRT2 - 1, "ratio");
  check("circle named anterior width", AutoMovieHumanHeadSectionConstraints.lateral([10, 9, 10, 9], ellipse, diagonal, diagonal), 10);
  check("circle named posterior width", AutoMovieHumanHeadSectionConstraints.lateral([10, 9, 10, 9], ellipse, -diagonal, diagonal), 10);
  check("circle dimension scaling", AutoMovieHumanHeadSectionConstraints.lateral([20, 18, 20, 18], ellipse, 2 * diagonal, 2 * diagonal), 20);
  check("width at actual axis", AutoMovieHumanHeadSectionConstraints.lateral([10, 9, 10, 9], ellipse, 0, 6), 6);
  const invalid: { name: string; run: () => number }[] = [
    { name: "outside sagittal support", run: (): number => AutoMovieHumanHeadSectionConstraints.lateral([10, 10, 10, 10], ellipse, 11, 3) },
    { name: "degenerate support", run: (): number => AutoMovieHumanHeadSectionConstraints.lateral([10, 0, 10, 10], ellipse, 2, 3) },
    { name: "closed shoulder limit", run: (): number => AutoMovieHumanHeadSectionConstraints.frontal([10, 10, 10, 10], 1, diagonal, diagonal) },
    { name: "frontal point below convex chord", run: (): number => AutoMovieHumanHeadSectionConstraints.frontal([10, 10, 10, 10], ellipse[0], 2, 2) },
  ];
  for (const sample of invalid) {
    let rejected: boolean = false;
    try { sample.run(); } catch { rejected = true; }
    if (!rejected) findings.push(`section constraint accepted ${sample.name}`);
  }
  for (const part of parts) {
    const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
    prepared.set(part.name, source);
    findings.push(...source.diagnostics.map((d: AutoMovieViewCurves.IResult["diagnostics"][number]): string => `${part.name}: ${d.contract}: ${d.detail}`));
    let count: number = 0;
    let worstSign: number = 0;
    let worstBasis: number = 0;
    for (const curve of source.curves) {
      if (curve.outline === null) continue;
      for (const station of samples(curve.outline)) {
        const read: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, part.axis, station);
        count++;
        if (typeof read === "string") { findings.push(`${part.name}/${curve.name}: ${read}`); continue; }
        const { u, v } = read.frame;
        worstBasis = Math.max(worstBasis, Math.abs(Math.hypot(...u) - 1), Math.abs(Math.hypot(...v) - 1), Math.abs(u.reduce((sum: number, x: number, i: number): number => sum + x * v[i]!, 0)));
        worstSign = Math.max(worstSign, curve.name.endsWith("positive") ? -read.scalar.value : read.scalar.value);
      }
    }
    console.log(`source ${part.name}: readings=${count}, signViolation=${worstSign}, basisError=${worstBasis}`);
    if (worstSign > 1e-8) findings.push(`${part.name}: supporting outline crosses its axis by ${worstSign} mm`);
    if (worstBasis > 1e-10) findings.push(`${part.name}: source frame basis error ${worstBasis}`);
    for (const factor of [0.5, 1, 2]) {
      const originalNode: IAutoMovieConstructionView | undefined = production.get(part.name);
      if (originalNode === undefined) { findings.push(`${part.name}: no actual production/study declaration`); continue; }
      const replayNode: IAutoMovieConstructionView = scale(originalNode, factor);
      const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(replayNode);
      if (typeof replay === "string") { findings.push(`${part.name} replay x${factor}: ${replay}`); continue; }
      const replayed: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(replay);
      let worstReplay: number = 0;
      let worstContext: { edge: string; station: number; before: AutoMovieViewCurves.IReading; after: AutoMovieViewCurves.IReading } | null = null;
      for (const [index, curve] of source.curves.entries()) {
        if (curve.outline === null) continue;
        for (const station of samples(curve.outline)) {
          const before: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, part.axis, station);
          const after: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(replayed.curves[index]!, replay.axis, station * factor);
          if (typeof before === "string" || typeof after === "string") { findings.push(`${part.name}/${curve.name} x${factor}: ${typeof before === "string" ? before : typeof after === "string" ? after : "unreadable source"}`); continue; }
          const gap: number = distance(before.point.map((x: number): number => x * factor), after.point);
          if (gap > worstReplay) { worstReplay = gap; worstContext = { edge: curve.name, station, before, after }; }
        }
      }
      check(`${part.name} original-to-tree x${factor}`, worstReplay, 0);
      if (worstReplay > 1e-8 && worstContext !== null) {
        const alignedStation: number = ((worstContext.station * 0.001) * factor) * 1000;
        const aligned: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(replayed.curves.find((c: AutoMovieViewCurves.ICurve): boolean => c.name === worstContext!.edge)!, replay.axis, alignedStation);
        const alignedGap: number | string = typeof aligned === "string" ? aligned : distance(worstContext.before.point.map((x: number): number => x * factor), aligned.point);
        console.log(`head replay context ${part.name} x${factor}: ${JSON.stringify({ sourceDomain: [part.stations[0], part.stations.at(-1)], declaredMetreDomain: [originalNode.stations[0], originalNode.stations.at(-1)], scaledMetreDomain: [replayNode.stations[0], replayNode.stations.at(-1)], replayDomain: [replay.stations[0], replay.stations.at(-1)], ...worstContext, alignedStation, aligned, alignedGap })}`);
      }
    }
  }
  /** Actual original edge point; an unreadable edge is retained as a finding. */
  const point: (name: string, edge: AutoMovieViewCurves.ICurve["name"], station: number) => [number, number, number] = (name: string, edge: AutoMovieViewCurves.ICurve["name"], station: number): [number, number, number] => {
    const part: IAutoMovieViewPart | undefined = byName.get(name);
    const curve: AutoMovieViewCurves.ICurve | undefined = prepared.get(name)?.curves.find((c: AutoMovieViewCurves.ICurve): boolean => c.name === edge);
    if (part === undefined || curve === undefined) { findings.push(`missing ${name}/${edge}`); return [NaN, NaN, NaN]; }
    const read: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, part.axis, station);
    if (typeof read === "string") { findings.push(`${name}/${edge}: ${read}`); return [NaN, NaN, NaN]; }
    return read.point;
  };
  const last: (name: string) => number = (name: string): number => byName.get(name)!.stations.at(-1)!;
  const mass: IAutoMovieViewPart = lane.source.massPart;
  const massSource: AutoMovieViewCurves.IResult = prepared.get("head.mass")!;
  const sideGuides: AutoMovieViewCurves.ICurve[] = massSource.curves.filter((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === "side.positive" || curve.name === "side.negative");
  const cranialBottom: number = Math.max(last("auricle.left"), last("auricle.right"));
  const sideMaxima: number[] = sideGuides.map((curve: AutoMovieViewCurves.ICurve): number => Math.max(...[cranialBottom, ...samples(curve.outline!).filter((station: number): boolean => station >= cranialBottom)].map((station: number): number => {
    const read: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, mass.axis, station);
    if (typeof read === "string") { findings.push(`cranial breadth: ${read}`); return NaN; }
    return Math.abs(read.point[2]);
  })));
  console.log(`cranial breadth observation: ${JSON.stringify({ domain: [cranialBottom, last("head.mass")], rule: "source region above both emitted auricular upper endpoints, excluding face and neck", sideMaxima })}`);
  check("original cranial guide maximum eu-eu", sideMaxima[0]! + sideMaxima[1]!, inputs.head.length * inputs.head.cephalicIndex * bodyScale / 100);
  for (const [name, site, expected] of [
    ["frontotemporale ft-ft", plan.landmarks.frontal, inputs.head.minimumFrontalWidth],
    ["planned zygion zy-zy", plan.landmarks.zygion, inputs.head.faceWidth],
    ["planned gonion go-go", plan.landmarks.gonion, inputs.head.mandibularWidth],
  ] as const) {
    try {
      const left: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(mass, site[1], site[0], 1);
      const right: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(mass, site[1], site[0], -1);
      console.log(`head width source ${name}: ${JSON.stringify({ site, left, right, source: "actual bare head source at its generating named X/Y; no completed skin or pose transform", zygomaPresent: byName.has("zygoma.left") || byName.has("zygoma.right") })}`);
      check(name, distance(left, right), expected * bodyScale);
    } catch (error) {
      findings.push(`${name} original source observation: ${String(error)}`);
      console.log(findings.at(-1));
    }
  }
  const glabella: [number, number, number] = point("head.mass", "front.positive", plan.landmarks.glabella[1]);
  const caliper: { height: number; back: [number, number, number]; distance: number }[] = [-2, -1, 0, 1, 2].map((offset: number): { height: number; back: [number, number, number]; distance: number } => {
    const height: number = plan.nasion + offset * bodyScale;
    const back: [number, number, number] = point("head.mass", "front.negative", height);
    return { height, back, distance: distance(glabella, back) };
  });
  console.log(`head local cranial caliper: ${JSON.stringify({ glabella, selectedHeight: plan.nasion, publicLength: inputs.head.length * bodyScale, readings: caliper, scope: "local cranial neighbourhood of the existing selected point; not a full-vault maximum or a neck-inclusive domain" })}`);
  check("local cranial caliper exceeds public maximum", Math.max(0, ...caliper.map((reading: { distance: number }): number => reading.distance - inputs.head.length * bodyScale)), 0);
  for (const [name, height] of [
    ["retained mean-site proxy", plan.y0],
    ["resolved cervicale", inputs.neckBase.cervicaleHeight * bodyScale],
    ["resolved side neck", inputs.neckBase.sideNeckPointHeight * bodyScale],
    ["resolved suprasternale", inputs.neckBase.suprasternaleHeight * bodyScale],
    ["glabella horizontal counterfactual", plan.landmarks.glabella[1]],
  ] as const) {
    try {
      console.log(`head source section observation: ${JSON.stringify({ name, height, ...sectionObservation(mass, massSource, height), inputNeck: inputs.neck * bodyScale, inputBase: inputs.neckBase.girth * bodyScale, inputHead: inputs.head.circumference * bodyScale, scope: "original horizontal source section only; neither the public infrathyroid site, the named 3D base course nor ANSUR oblique head tape is established" })}`);
    } catch (error) {
      findings.push(`${name} original section observation: ${String(error)}`);
      console.log(findings.at(-1));
    }
  }
  for (const [index, row] of neckSource.rows.entries()) {
    const reads: { count: number; xz: number; spatial: number; minimumY: number; maximumY: number }[] = [neckSource.order, 2048].map((count: number): { count: number; xz: number; spatial: number; minimumY: number; maximumY: number } => {
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
    console.log(`neck original row observation: ${JSON.stringify({ index, sourceMean: row.origin, reads, scope: "original private harmonic authoring row; sampled path lengths are neither a public planar tape nor a named base-course oracle" })}`);
  }
  const nape: [number, number, number] = AutoMovieLoftChain.point(neck, neck.layers[neck.layers.length - 1]!.y, Math.PI);
  check("adopted posterior cervicale height", nape[1] / bodyScale, inputs.neckBase.cervicaleHeight);
  check("head mass shares actual posterior cervicale", distance(point("head.mass", "front.negative", plan.neck.backLevel), nape), 0);
  check("actual head mass stature", point("head.mass", "front.positive", last("head.mass"))[1] / bodyScale, inputs.height);
  check("actual menton-vertex height", (point("head.mass", "front.positive", last("head.mass"))[1] - point("head.mass", "front.positive", plan.menton)[1]) / bodyScale, inputs.head.height);
  const prn: [number, number, number] = [plan.landmarks.pronasale[0], plan.landmarks.pronasale[1], 0];
  check("public n-Gn contour chord", distance([...plan.landmarks.nasion, 0], [...plan.landmarks.gnathion, 0]), inputs.head.faceHeight * bodyScale);
  check("actual mass n-Gn contour chord", distance(point("head.mass", "front.positive", plan.nasion), point("head.mass", "front.positive", plan.landmarks.gnathion[1])), inputs.head.faceHeight * bodyScale);
  check("published nasion is generating n", distance(lane.landmarks.nasion, [...plan.landmarks.nasion, 0]), 0);
  check("nose original pronasale", distance(point("nose", "front.positive", plan.tip), prn), 0);
  check("lobule original apex", distance(point("nose.lobule", "front.positive", last("nose.lobule")), prn), 0);
  check("nasal n-sn chord", Math.hypot(plan.landmarks.nasion[0] - plan.landmarks.subnasale[0], plan.landmarks.nasion[1] - plan.landmarks.subnasale[1]), inputs.head.face.nose.height * bodyScale);
  check("nasal sn-prn chord", Math.hypot(prn[0] - plan.landmarks.subnasale[0], prn[1] - plan.landmarks.subnasale[1]), inputs.head.face.nose.protrusion * bodyScale);
  check("ala al-al chord", distance(point("nose.ala.left", "front.positive", last("nose.ala.left")), point("nose.ala.right", "front.positive", last("nose.ala.right"))), inputs.head.face.nose.width * bodyScale);
  const nose: IAutoMovieViewPart = byName.get("nose")!;
  const noseCurve: AutoMovieViewCurves.ICurve = prepared.get("nose")!.curves[0]!;
  const farthest: number = Math.max(...samples(noseCurve.outline!).map((s: number): number => point(nose.name, "front.positive", s)[0]));
  check("nose support past pronasale", Math.max(0, farthest - prn[0]), 0);
  const sto: [number, number, number] = [plan.landmarks.stomion[0], plan.stomion, 0];
  check("upper ls-sto", distance(point("lip.upper", "front.positive", 0), sto), inputs.head.face.mouth.upperVermilionHeight * bodyScale);
  check("lower sto-li", distance(point("lip.lower", "front.negative", 0), sto), inputs.head.face.mouth.lowerVermilionHeight * bodyScale);
  check("mouth ch-ch", distance(point("lip.upper", "front.positive", -plan.mouthWidth), point("lip.upper", "front.positive", plan.mouthWidth)), inputs.head.face.mouth.width * bodyScale);
  const contacts: number[] = [...new Set(["lip.upper", "lip.lower"].flatMap((name: string): number[] => prepared.get(name)!.curves.flatMap((c: AutoMovieViewCurves.ICurve): number[] => c.outline === null ? [] : samples(c.outline))))];
  check("closed lips whole-span contact", Math.max(...contacts.map((s: number): number => distance(point("lip.upper", "front.negative", s), point("lip.lower", "front.positive", s)))), 0);
  const actualLs: [number, number, number] = point("lip.upper", "front.positive", 0);
  const actualLi: [number, number, number] = point("lip.lower", "front.negative", 0);
  const philtrum: AutoMovieHumanHeadLane.IOutput["source"]["parts"][number] = lane.source.parts.find((p: AutoMovieHumanHeadLane.IOutput["source"]["parts"][number]): boolean => p.feature.part.name === "philtrum")!;
  const sulcus: AutoMovieHumanHeadLane.IOutput["source"]["parts"][number] = lane.source.parts.find((p: AutoMovieHumanHeadLane.IOutput["source"]["parts"][number]): boolean => p.feature.part.name === "sulcus.mentolabial")!;
  check("philtrum shares actual ls/sn", distance(philtrum.feature.seed, [(actualLs[0] + plan.landmarks.subnasale[0]) / 2, (actualLs[1] + plan.landmarks.subnasale[1]) / 2, 0]), 0);
  check("sulcus shares actual li/Pg", distance(sulcus.feature.seed, [(actualLi[0] + plan.landmarks.pogonion[0]) / 2, (actualLi[1] + plan.landmarks.pogonion[1]) / 2, 0]), 0);
  const c: [number, number] = AutoMovieHumanHeadMassPart.cervical(plan);
  const sn: [number, number] = plan.landmarks.subnasale;
  const pg: [number, number] = plan.landmarks.pogonion;
  const me: [number, number] = plan.landmarks.menton;
  const along: [number, number] = [sn[0] - pg[0], sn[1] - pg[1]];
  const under: [number, number] = [me[0] - c[0], me[1] - c[1]];
  const t: number = ((c[0] - pg[0]) * under[1] - (c[1] - pg[1]) * under[0]) / (along[0] * under[1] - along[1] * under[0]);
  const clinical: [number, number] = [pg[0] + t * along[0], pg[1] + t * along[1]];
  const toSn: [number, number] = [sn[0] - clinical[0], sn[1] - clinical[1]];
  const toC: [number, number] = [c[0] - clinical[0], c[1] - clinical[1]];
  check("clinical Sn-Gn'-C angle", Math.acos((toSn[0] * toC[0] + toSn[1] * toC[1]) / (Math.hypot(...toSn) * Math.hypot(...toC))) * 180 / Math.PI, 100, "degrees");
  check("clinical Sn-Gn'/C-Gn' ratio", Math.hypot(...toSn) / Math.hypot(...toC), 1.2, "ratio");
  console.log(`clinical C=${JSON.stringify(c)}, clinical Gn'=${JSON.stringify(clinical)}, public contour Gn=${JSON.stringify(plan.landmarks.gnathion)}`);
  check("selected tragion t-n norm", Math.hypot(plan.landmarks.tragion[0] - plan.landmarks.nasion[0], tragion - plan.nasion, AutoMovieHumanHeadPrior.PRIOR.frame.base * plan.breadth / 2), AutoMovieHumanHeadPrior.PRIOR.frame.tragion * inputs.head.length * bodyScale);
  for (const side of ["left", "right"] as const) {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const expectedTop: number = tragion + AutoMovieHumanEarPlace.aboveTragion(inputs.head.earPair[side], AutoMovieHumanBodyAnatomy.sexOf(params)) * bodyScale;
    const ear: AutoMovieHumanHeadEarFrame.IFrame = AutoMovieHumanHeadEarFrame.of(plan, lane.source.massPart, sign, inputs.head.earPair[side], expectedTop);
    const plate: AutoMovieHumanHeadEarPlate.IOutput = AutoMovieHumanHeadEarPlate.of(plan, lane.source.massPart, ear, side);
    const auricle: string = `auricle.${side}`;
    const queriedUpper: [number, number, number] = point(auricle, "front.positive", ear.top);
    const queriedLower: [number, number, number] = point(auricle, "front.positive", ear.bottom);
    // Sa/sba are the actual named source endpoints. Their independent
    // expectations remain public T/L. The old input-height queries below
    // are retained as counterfactual interior-cap observations, not renamed
    // as those endpoints after a one-ULP unit conversion.
    const upper: [number, number, number] = point(auricle, "front.positive", plate.top);
    const lower: [number, number, number] = point(auricle, "front.positive", plate.bottom);
    const actual: IAutoMovieViewPart = byName.get(auricle)!;
    const upperStation: number = actual.front.positive.knots.at(-1)!.station;
    const lowerStation: number = actual.front.positive.knots[0]!.station;
    const actualUpper: [number, number, number] = point(auricle, "front.positive", upperStation);
    const actualLower: [number, number, number] = point(auricle, "front.positive", lowerStation);
    const node: IAutoMovieConstructionView = production.get(auricle)!;
    // Observe both paths without substituting either query or weakening an
    // expectation. The source declaration and public T/L remain distinct.
    console.log(`ear endpoint context ${side}: ${JSON.stringify({ public: { top: expectedTop, length: inputs.head.earPair[side].length * bodyScale }, authoringHeights: { bottom: ear.bottom, top: ear.top }, metre: { radial: [node.front.positive.knots[0], node.front.positive.knots.at(-1)], axis: node.axis }, actual: { lowerStation, upperStation, parameter: actual.front.positive.parameter, radialKnots: [actual.front.positive.knots[0], actual.front.positive.knots.at(-1)], lower: actualLower, upper: actualUpper, length: distance(actualUpper, actualLower), topDelta: actualUpper[1] - expectedTop, topQueryGap: distance(queriedUpper, actualUpper), bottomQueryGap: distance(queriedLower, actualLower), queriedUpper, queriedLower } })}`);
    const c: [number, number, number] = point(auricle, "front.negative", plate.attachment);
    const j: [number, number, number] = point(auricle, "front.positive", plate.posterior);
    check(`${side} ear c-j`, distance(c, j), inputs.head.earPair[side].breadth * bodyScale);
    check(`${side} ear sa-sba`, distance(upper, lower), inputs.head.earPair[side].length * bodyScale);
    check(`${side} actual superaurale height`, upper[1], expectedTop);
    check(`${side} ear c-j perpendicular sa-sba`, Math.abs(j.reduce((sum: number, value: number, i: number): number => sum + (value - c[i]!) * (upper[i]! - lower[i]!), 0)) / distance(upper, lower), 0);
    check(`${side} actual c on original scalp`, distance(c, AutoMovieHumanHeadMassPart.sideAt(lane.source.massPart, c[1], c[0], sign)), 0);
    const rim: [number, number, number] = point(auricle, "front.positive", tragion);
    const scalp: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(lane.source.massPart, rim[1], rim[0], sign);
    check(`${side} actual scalp-rim protrusion`, distance(rim, scalp), inputs.head.earPair[side].protrusion * bodyScale);
    let heightEscape: number = 0;
    for (const curve of prepared.get(auricle)!.curves) if (curve.outline !== null) for (const station of samples(curve.outline)) {
      const read: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, byName.get(auricle)!.axis, station);
      if (typeof read === "string") { findings.push(`${auricle} extremum: ${read}`); continue; }
      heightEscape = Math.max(heightEscape, read.point[1] - upper[1], lower[1] - read.point[1]);
      heightEscape = Math.max(heightEscape, Math.abs(read.frame.u[1]), Math.abs(read.frame.v[1]));
    }
    check(`${side} sa-sba bounds all original guides/planes`, heightEscape, 0);
    let rolledEscape: number = 0;
    let rolledContext: { part: string; curve: string; station: number; point: [number, number, number] } | null = null;
    for (const ridge of parts.filter((part: IAutoMovieViewPart): boolean => part.name.startsWith("ear.") && part.name.endsWith(`.${side}`) && !part.name.startsWith("ear.concha"))) for (const curve of prepared.get(ridge.name)!.curves) if (curve.outline !== null) for (const station of samples(curve.outline)) {
      const read: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, ridge.axis, station);
      if (typeof read === "string") { findings.push(`${ridge.name} envelope: ${read}`); continue; }
      const escape: number = Math.max(read.point[1] - expectedTop, ear.bottom - read.point[1]);
      if (escape > rolledEscape) { rolledEscape = escape; rolledContext = { part: ridge.name, curve: curve.name, station, point: read.point }; }
    }
    console.log(`ear rolled-source envelope ${side}: ${JSON.stringify({ observedEscape: rolledEscape, context: rolledContext, expectedTop, expectedBottom: ear.bottom, scope: "original signed guides at knots/scalar extrema/span middles; not a complete world-extrema proof or final skin" })}`);
    check(`${side} rolled original guide envelope`, rolledEscape, 0);
    let fork: [number, number, number] | undefined;
    for (const name of ["ear.antihelix", "ear.crus.superior", "ear.crus.inferior"]) {
      const ridge: IAutoMovieViewPart = byName.get(`${name}.${side}`)!;
      const knot: IAutoMovieViewPart.IKnot | undefined = ridge.front.positive.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.site === `ear.fork.${side}`);
      if (knot === undefined) { findings.push(`${ridge.name}: missing regular fork port`); continue; }
      const origin: [number, number, number] = ridge.axis.at(knot.station).origin;
      if (fork === undefined) fork = origin;
      check(`${ridge.name} shared fork`, distance(origin, fork), 0);
      const edges: AutoMovieViewCurves.ICurve["name"][] = ["front.positive", "front.negative", "side.positive", "side.negative"];
      const supports: number[] = edges.map((edge: AutoMovieViewCurves.ICurve["name"]): number => distance(point(ridge.name, edge, knot.station), origin));
      if (!supports.every((value: number): boolean => Number.isFinite(value) && value > 0)) findings.push(`${ridge.name}: fork port has a zero/nonfinite section [${supports}]`);
    }
    const controls: readonly (readonly [number, number])[] = AutoMovieHumanReferenceOutlines.SHIN_UPPER_LID[plan.sex === 1 ? "female" : "male"];
    const pupilShare: number = -controls[0]![0] / (controls[3]![0] - controls[0]![0]);
    const tilt: number = Math.atan2(controls[0]![1] - controls[3]![1], controls[3]![0] - controls[0]![0]);
    const original: (t: number, coordinate: 0 | 1) => number = (t: number, coordinate: 0 | 1): number => controls.reduce((sum: number, p: readonly [number, number], i: number): number => sum + [1, 3, 3, 1][i]! * (1 - t) ** (3 - i) * t ** i * p[coordinate], 0);
    let a: number = 0;
    let b: number = 1;
    for (let i: number = 0; i < 60; i++) { const t: number = (a + b) / 2; if (original(t, 0) < 0) a = t; else b = t; }
    const pupil: number = (a + b) / 2;
    const end: number = last(`fissure.${side}`);
    const at: (t: number) => number = (t: number): number => t === 0 ? 0 : t === 1 ? end : end * Math.sin(Math.PI * t / 2) ** 2;
    const span: number = plan[side].length * Math.cos(tilt);
    const rise: number = plan[side].length * Math.sin(tilt);
    const pupilZ: number = sign * (plan[side].inner + (1 - pupilShare) * span);
    check(`${side} eye en-ex`, distance(point(`fissure.${side}`, "front.positive", end), point(`fissure.${side}`, "front.positive", 0)), inputs.head.face.eyePair[side].palpebralFissureLength * bodyScale);
    const above: [number, number, number] = point(`fissure.${side}`, "front.positive", at(pupil));
    const below: [number, number, number] = point(`fissure.${side}`, "front.negative", at(pupil));
    check(`${side} eye Ps-Pi`, distance(above, below), inputs.head.face.eyePair[side].palpebralFissureHeight * bodyScale);
    const globe: IAutoMovieViewPart = byName.get(`globe.${side}`)!;
    const centre: [number, number, number] = globe.axis.at(0).origin;
    const pupilY: number = (5.2 * above[1] + 3.5 * below[1]) / 8.7;
    check(`${side} eye globe/pupil lateral frame`, centre[2], pupilZ);
    check(`${side} eye globe/pupil vertical frame`, centre[1], pupilY);

    // This independent Bernstein read comes from the primary controls,
    // not the authored jets, prepared spline or an output snapshot.
    const residual: (t: number) => number = (t: number): number => {
      const s: number = (original(t, 0) - controls[0]![0]) / (controls[3]![0] - controls[0]![0]);
      return original(t, 1) - ((1 - s) * controls[0]![1] + s * controls[3]![1]);
    };
    const gain: number = inputs.head.face.eyePair[side].palpebralFissureHeight * bodyScale / (original(pupil, 1) * (1 + 5.2 / 3.5));
    const nasalY: number = plan.eye - ((plan.left.length + plan.right.length) / 4) * Math.sin(tilt);
    const chordPupil: number = (1 - pupilShare) * controls[0]![1] + pupilShare * controls[3]![1];
    check(`${side} eye affine photo pupil origin`, centre[1], nasalY + (1 - pupilShare) * rise - gain * chordPupil);
    const forward: number = point(`fissure.${side}`, "front.positive", 0)[0];
    const gaps: number[] = [0, pupil].flatMap((start: number, index: number): number[] => Array.from({ length: 9 }, (_: unknown, i: number): number => start + ((index === 0 ? pupil : 1) - start) * i / 8)).map((t: number): number => {
      const s: number = (original(t, 0) - controls[0]![0]) / (controls[3]![0] - controls[0]![0]);
      return distance(point(`fissure.${side}`, "front.positive", at(t)), [forward, nasalY + (1 - s) * rise + gain * residual(t), sign * (plan[side].inner + (1 - s) * span)]);
    });
    check(`${side} eye original Bernstein upper spans`, Math.max(...gaps), 0);
  }
  check("eyes en-en", distance(point("fissure.left", "front.positive", last("fissure.left")), point("fissure.right", "front.positive", last("fissure.right"))), inputs.head.face.intercanthalWidth * bodyScale);
  console.log(`head source diagnostics: ${JSON.stringify(lane.source.diagnostics)}`);
  console.log(`head source findings: ${JSON.stringify(findings)}`);
  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}

/** All original knots, scalar extrema and each source span's middle. */
function samples(outline: AutoMovieViewOutline.IOutline): number[] {
  const knots: number[] = outline.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station);
  return [...new Set([...knots, ...AutoMovieViewOutline.criticalStations(outline), ...knots.slice(1).map((s: number, i: number): number => (s + knots[i]!) / 2)])].sort((a: number, b: number): number => a - b);
}

/** Euclidean metric of the public landmark protocols, mm. */
function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(...a.map((v: number, i: number): number => v - b[i]!));
}

/** Original section geometry, without a loft, pose, mesh read or tape-site substitution. */
function sectionObservation(part: IAutoMovieViewPart, source: AutoMovieViewCurves.IResult, height: number): { extents: [number, number, number, number]; shoulders: [number, number, number, number]; perimeter: number; fault: string | null } {
  const scalar: (outline: IAutoMovieViewPart.IOutline) => number = (outline: IAutoMovieViewPart.IOutline): number => {
    const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
    if ("detail" in prepared) throw new Error(`Original section observation: ${prepared.detail}`);
    const value: number | string = AutoMovieViewOutline.value(prepared, height);
    if (typeof value === "string") throw new Error(`Original section observation: ${value}`);
    return value;
  };
  const edge: (name: AutoMovieViewCurves.ICurve["name"]) => number = (name: AutoMovieViewCurves.ICurve["name"]): number => {
    const outline: AutoMovieViewOutline.IOutline | null = source.curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === name)?.outline ?? null;
    if (outline === null) throw new Error(`Original section observation has no ${name} source`);
    const value: number | string = AutoMovieViewOutline.value(outline, height);
    if (typeof value === "string") throw new Error(`Original section observation: ${value}`);
    return value;
  };
  if (part.fullness.kind !== "shoulder") throw new Error("This head inspection observes only its current declared shoulder owner");
  const common: number = scalar(part.fullness.shoulder);
  const departures: readonly IAutoMovieViewPart.IOutline[] | undefined = part.fullness.departures;
  const shoulders: [number, number, number, number] = [0, 1, 2, 3].map((index: number): number => common + (departures === undefined ? 0 : scalar(departures[index]!))) as [number, number, number, number];
  const extents: [number, number, number, number] = [edge("front.positive"), edge("side.positive"), -edge("front.negative"), -edge("side.negative")];
  const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents }, shoulders);
  return { extents, shoulders, perimeter: AutoMovieViewSection.length(section), fault: AutoMovieViewSection.fault(section) };
}

/** Read the actual production nodes, without reconstructing a declaration from its decoded source. */
function collect(node: AutoMovieConstructionNode, views: Map<string, IAutoMovieConstructionView>): void {
  if (node.type === "view") views.set(node.name, node);
  else {
    collect(node.host, views);
    if (node.type !== "trim") collect(node.part, views);
  }
}

/** Scale one actual f1 declaration, including every coordinate parameter, without changing its shape or chart basis. */
function scale(view: IAutoMovieConstructionView, factor: number): IAutoMovieConstructionView {
  const curve: (o: IAutoMovieConstructionOutline, values: boolean) => IAutoMovieConstructionOutline = (o: IAutoMovieConstructionOutline, values: boolean): IAutoMovieConstructionOutline => AutoMovieViewOutline.scale(o, factor, values ? factor : 1);
  const vector: (v: IAutoMovieVector3) => IAutoMovieVector3 = (v: IAutoMovieVector3): IAutoMovieVector3 => ({ x: v.x * factor, y: v.y * factor, z: v.z * factor });
  let axis: AutoMovieConstructionAxis;
  if (view.axis.type === "parallel") axis = { ...view.axis, origin: { x: curve(view.axis.origin.x, true), y: curve(view.axis.origin.y, true), z: curve(view.axis.origin.z, true) } };
  else if (view.axis.type === "straight") axis = { ...view.axis, origin: vector(view.axis.origin) };
  else if (view.axis.type === "level") axis = { ...view.axis, origin: view.axis.origin === null ? null : { x: curve(view.axis.origin.x, true), z: curve(view.axis.origin.z, true) } };
  else if (view.axis.type === "curved") axis = { ...view.axis, step: view.axis.step * factor, knots: view.axis.knots.map((k: { station: number; point: IAutoMovieVector3 }): { station: number; point: IAutoMovieVector3 } => ({ station: k.station * factor, point: vector(k.point) })) };
  else throw new Error(`Head source replay does not claim support for axis ${view.axis.type}`);
  const quarters: (q: readonly [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline]) => [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline] = (q: readonly [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline]): [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline] => [curve(q[0], false), curve(q[1], false), curve(q[2], false), curve(q[3], false)];
  let fullness: AutoMovieConstructionFullness;
  if (view.fullness.type === "girth") fullness = { ...view.fullness, girth: curve(view.fullness.girth, true), departures: view.fullness.departures === null ? null : quarters(view.fullness.departures) };
  else if (view.fullness.type === "shoulder") fullness = { ...view.fullness, shoulder: curve(view.fullness.shoulder, false), departures: view.fullness.departures === null ? null : quarters(view.fullness.departures) };
  else fullness = { ...view.fullness, shoulders: quarters(view.fullness.shoulders) };
  return { ...view, axis, stations: view.stations.map((s: number): number => s * factor), front: { positive: curve(view.front.positive, true), negative: curve(view.front.negative, true) }, side: { positive: curve(view.side.positive, true), negative: curve(view.side.negative, true) }, fullness };
}
