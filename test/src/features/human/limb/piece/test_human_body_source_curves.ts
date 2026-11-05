import { type AutoMovieLoftContract, AutoMovieViewCurves, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanFootPrior } from "../../../../../../packages/human/src/generation/AutoMovieHumanFootPrior";
import { AutoMovieHumanFootPlaces } from "../../../../../../packages/human/src/generation/AutoMovieHumanFootPlaces";
import { AutoMovieHumanLegPrior } from "../../../../../../packages/human/src/generation/AutoMovieHumanLegPrior";
import { AutoMovieHumanArmBones } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmBones";
import { AutoMovieHumanArmInterim } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmInterim";
import { AutoMovieHumanArmPrior } from "../../../../../../packages/human/src/generation/AutoMovieHumanArmPrior";
import { AutoMovieHumanArmWalk } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmWalk";
import { AutoMovieHumanFootInterim } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanFootInterim";
import { AutoMovieHumanFootPart } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanFootPart";
import { AutoMovieHumanToePart } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanToePart";
import { AutoMovieHumanHandBones } from "../../../../../../packages/human/src/generation/hand/AutoMovieHumanHandBones";
import { AutoMovieHumanLegBones } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegBones";
import { AutoMovieHumanLegLaws } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegLaws";
import { AutoMovieHumanLegSites } from "../../../../../../packages/human/src/generation/AutoMovieHumanLegSites";
import { AutoMovieHumanLegWalk } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegWalk";
import { AutoMovieHumanDigitInterim } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanDigitInterim";
import { AutoMovieHumanDigitWalk } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanSiteViewPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanBodyMeasures } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyMeasures";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * Original limb definitions retain their anatomical inputs and geometric
 * premises before any final body realization, joins, rig or skin emission.
 *
 * Scenarios:
 * 1. Both legs and feet have finite source definitions and admit no sampled
 *    world-median or standing-floor counterexample on any of their four guides.
 * 2. Each arm has its forearm tape site and each finger, thumb and toe has
 *    actual source curves; a declared skin apex receives its pulp only once.
 * 3. Every finding retains the actual frame and material coordinate, so a
 *    sampled counterexample is not confused with a proof of a whole span.
 * 4. Intermediate thigh-profile rows retain all five original public tape identities.
 *    Their independent expected girths are the resolved public thigh,
 *    lower-thigh, knee, calf and ankle inputs, each within the section
 *    owner's existing 1e-6 mm solve boundary; the retained profile cannot
 *    supply an expected tape or replace its named source station.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads production limbInputs, pure joint definitions, one actual shared foot/toe record and the ArmWalk, LegWalk, FootPart, ToePart and DigitWalk builders. Collects every source/median/floor/length/group-breadth/root/ball/forearm/pulp finding before failing once. Group support reads emitted original curves/axes, never the normalizer. Each distal toe depth is checked separately from the aggregate envelope. All five public leg tapes are read through the actual original edges/fullness after retained intermediate shape rows are inserted.
 * @evidence contracts/testing.md#independent-expectations Legs stay in their world median half-spaces, standing foot/toe curves stay above floor0, public ball length owns the first root's along place, every digit retains source curves, and an apex receives pulp only once. Foot L includes all toe guides. The entire metatarsal group closes unchanged public B within 1e-6 mm; its bare host retains its own subset support metadata. Multiplying only public B by 1.25 scales every across source by 1.25 and preserves along, Y, named sites, source jets and ranges within the existing 1e-9 mm frame-replay allowance. Each distal toe depth is its retained individual D/B ratio times the original per-L across-gap width, not the greatest dorsum of all toes; this verifies a declared proxy transfer, not anatomical validation. Forearm girth owns its named site. No reference residual is fitted.
 * @evidence contracts/testing.md#distinguishing-cases Both sides and every digit use environment-selected HumanPeople.names. Fixed up/across planes, actual two-endpoint affine origins and the foot-along region permit slope-plus-edge critical queries including the pole-angle sine term; sampled world points add counterexamples without supplying normalization. Binary64 critical candidates are not interval certification, and a moving-frame sampled pass proves no continuous bound. Reference overlays still own placement acceptance.
 * @evidence contracts/testing.md#execution-ownership This synchronous CPU test resolves only public inputs and source parts; it does not call HumanPeople.person, realize a composed body, emit skin, start a process or use a viewer/GPU.
 */
export function test_human_body_source_curves(): void {
  const defects: string[] = [];
  for (const name of HumanPeople.names()) {
    const params: ReturnType<typeof HumanPeople.params> = HumanPeople.params(name);
    const inputs: AutoMovieHumanBodyLaw.ILimbInputs = AutoMovieHumanBodyLaw.limbInputs(params);
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
    const scale: number = inputs.legs.scale;
    const anklePrior: AutoMovieHumanLegPrior.IAnkle = AutoMovieHumanLegPrior.PRIOR.ankle;
    const ankleForward: number = (anklePrior.offset + anklePrior.fat * inputs.legs.fat + anklePrior.muscularity * inputs.legs.muscularity) * scale;
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? 1 : -1;
      const reflected = (point: Vec3): Vec3 => [point[0], point[1], sign * point[2]];

      // This isolated source case preserves public Y/Z placements but sets
      // hip AP to zero. Its frames are not the production trunk-derived
      // placement; production diagnostics must establish that separate case.
      const own: AutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({ stature: inputs.stature, scale, ankleHeight: inputs.feet[side].ankle, medial: AutoMovieHumanFootPrior.PRIOR.malleoli.medial.height, hipForward: 0, ankleForward });
      const bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle"> = { hip: reflected(own.hip), knee: reflected(own.knee), ankle: reflected(own.ankle) };
      const law: ReturnType<typeof AutoMovieHumanLegLaws.of> = AutoMovieHumanLegLaws.of(measures, scale, bones.knee[1], bones.ankle[1], AutoMovieHumanLegSites.ankle(bones.ankle[1]), inputs.crotch, side);
      // The accepted whole-skin prior puts thigh mid-depth ahead of the
      // shaft and calf mid-depth behind it; a muscle-only share is not that datum.
      const thigh: ReturnType<typeof law> = law("thigh");
      const calf: ReturnType<typeof law> = law("calf");
      if (!(thigh.edges[0] > -thigh.edges[2])) defects.push(`${name}/leg.${side}: upper-thigh whole-skin support does not stand ahead of its bone`);
      if (!(calf.edges[0] < -calf.edges[2])) defects.push(`${name}/leg.${side}: calf whole-skin support does not stand behind its bone`);
      const leg: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanLegWalk.create(`leg.${side}`, bones, law, 3.5);
      read(`${name}/leg.${side}`, leg, defects);
      legTapes(`${name}/leg.${side}`, leg, measures, scale, defects);
      const medial: ICounterexample | undefined = worstAll(leg, 2, sign, defects);
      console.log(JSON.stringify({ person: name, part: `leg.${side}`, sidePositive: leg.part?.side.positive.knots, sideNegative: leg.part?.side.negative.knots, medial }));
      if (medial !== undefined && medial.value < -1e-6) defects.push(`${name}/leg.${side}: world medial curve crosses the median by ${-medial.value} mm at station ${medial.station}`);

      const footSource: AutoMovieHumanFootInterim.IDefinition = AutoMovieHumanFootInterim.define(side, inputs.feet[side], bones.ankle, measures, scale);
      const footInput: AutoMovieHumanFootPart.IInput = footSource.foot;
      const wider: AutoMovieHumanFootInterim.IDefinition = AutoMovieHumanFootInterim.define(side, { ...inputs.feet[side], breadth: inputs.feet[side].breadth * 1.25 }, bones.ankle, measures, scale);
      transverseFamily(footSource, wider, 1.25, defects);
      for (const diagnostic of footSource.diagnostics) defects.push(`${name}: ${diagnostic.producer}: ${diagnostic.detail}`);
      const firstRoot: Vec3 = footSource.toes[0]!.root;
      const firstBall: number = firstRoot.reduce((sum: number, value: number, axis: number): number => sum + (value - footInput.heel[axis]!) * footInput.along[axis]!, 0);
      if (Math.abs(firstBall - measures.ballOfFootLength * scale) > 1e-6) defects.push(`${name}/foot.${side}: first generating attachment does not close public ball length`);
      const foot: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanFootPart.create(footInput);
      read(`${name}/foot.${side}`, foot, defects);
      const plantar: ICounterexample | undefined = worst(foot, 2, 1, 1, defects);
      console.log(JSON.stringify({ person: name, part: `foot.${side}`, curve: "front.neg", breadthInput: inputs.feet[side].breadth, sites: footInput.sites, plantar }));
      if (plantar !== undefined && plantar.value < -1e-6) defects.push(`${name}/foot.${side}: plantar curve crosses the floor by ${-plantar.value} mm at station ${plantar.station}`);
      footBreadth(`${name}/foot.${side}`, foot, footInput, defects);
      let foremost: number = -Infinity;
      const metatarsalSamples: IAcross[] = [];
      const footProjection: IProjection = projected(foot, footInput, defects);
      if (footProjection.minimum !== undefined) metatarsalSamples.push(footProjection.minimum);
      if (footProjection.maximum !== undefined) metatarsalSamples.push(footProjection.maximum);
      for (const [index, attachment] of footSource.toes.entries()) {
        const toe: AutoMovieHumanToePart.IInput = attachment.part;
        if (toe.centres[1] !== attachment.root) defects.push(`${name}/${toe.name}: generating root lost its source-record identity`);
        const result: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanToePart.create(toe);
        read(`${name}/${toe.name}`, result, defects);
        const patterns: typeof AutoMovieHumanFootPlaces.TOES = AutoMovieHumanFootPlaces.TOES;
        const gaps: number[] = [];
        if (index > 0) gaps.push(Math.abs(patterns[index]!.across - patterns[index - 1]!.across));
        if (index + 1 < patterns.length) gaps.push(Math.abs(patterns[index + 1]!.across - patterns[index]!.across));
        const expectedDepth: number = AutoMovieHumanFootPrior.PRIOR.toes[index]!.depth * gaps.reduce((sum: number, value: number): number => sum + value, 0) / gaps.length * inputs.feet[side].length;
        const upperEnd: number | undefined = result.part?.front.positive.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.site === "end")?.value;
        const lowerEnd: number | undefined = result.part?.front.negative.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.site === "end")?.value;
        const actualDepth: number = (upperEnd ?? NaN) - (lowerEnd ?? NaN);
        if (!Number.isFinite(actualDepth) || Math.abs(actualDepth - expectedDepth) > 1e-9) defects.push(`${name}/${toe.name}: distal source depth ${actualDepth} mm does not retain its individual aspect/packing definition ${expectedDepth} mm`);
        if (result.part !== null) for (const point of [...toe.centres, toe.apex]) {
          const station: number = point.reduce((sum: number, value: number, axis: number): number => sum + (value - toe.centres[0]![axis]!) * toe.along[axis]!, 0);
          const actual: Vec3 = result.part.axis.at(station).origin;
          const mismatch: number = Math.hypot(...actual.map((value: number, axis: number): number => value - point[axis]!));
          if (!Number.isFinite(mismatch) || mismatch > 1e-9) defects.push(`${name}/${toe.name}: affine source moved a supplied generating point by ${mismatch} mm`);
        }
        const toeFloor: ICounterexample | undefined = worstAll(result, 1, 1, defects);
        if (toeFloor !== undefined && toeFloor.value < -1e-6) defects.push(`${name}/${toe.name}: original toe curve crosses the floor by ${-toeFloor.value} mm at station ${toeFloor.station}`);
        console.log(JSON.stringify({ person: name, part: toe.name, generatingRoot: attachment.root, generatedApex: attachment.apex, distalSourceDepth: actualDepth, retainedAspectDepth: expectedDepth, proximalOverlapDepth: toe.law("base").depth, toeFloor }));
        const projection: IProjection = projected(result, footInput, defects);
        foremost = Math.max(foremost, projection.foremost);
        if (projection.minimum !== undefined) metatarsalSamples.push(projection.minimum);
        if (projection.maximum !== undefined) metatarsalSamples.push(projection.maximum);
      }
      const ordered: IAcross[] = metatarsalSamples.sort((a: IAcross, b: IAcross): number => a.across - b.across);
      const sourceGroupBreadth: number = (ordered.at(-1)?.across ?? NaN) - (ordered[0]?.across ?? NaN);
      console.log(JSON.stringify({ person: name, part: `foot.${side}`, publicLength: inputs.feet[side].length, foremostToeSourceSample: foremost, originalMetatarsalGroupBreadth: sourceGroupBreadth, publicBreadth: inputs.feet[side].breadth, groupSupportObservations: { minimum: ordered[0], maximum: ordered.at(-1) } }));
      if (Math.abs(foremost - inputs.feet[side].length) > 1e-6) defects.push(`${name}/foot.${side}: longest toe support ${foremost} mm does not close public length ${inputs.feet[side].length} mm`);
      if (!Number.isFinite(sourceGroupBreadth) || Math.abs(sourceGroupBreadth - inputs.feet[side].breadth) > 1e-6) defects.push(`${name}/foot.${side}: whole metatarsal source group spans ${sourceGroupBreadth} mm against public breadth ${inputs.feet[side].breadth} mm`);

      const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
      const canonical: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place([0, 0, 0], unit(prior.upper), unit(prior.lower), inputs.arms.upper, inputs.arms.lower);
      const arm: AutoMovieHumanArmBones.IBones = { ...canonical, shoulder: reflected(canonical.shoulder), elbow: reflected(canonical.elbow), wrist: reflected(canonical.wrist), radiale: reflected(canonical.radiale), stylion: reflected(canonical.stylion), upper: reflected(canonical.upper), lower: reflected(canonical.lower) };
      const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
      const hand: AutoMovieHumanHandBones.IOutput = AutoMovieHumanHandBones.sided(AutoMovieHumanHandBones.of(canonical.wrist, inputs.arms[side], measures.sex, scale, diagnostics), side === "left" ? 1 : -1);
      const sites: AutoMovieHumanArmWalk.ISiteLaw[] = AutoMovieHumanArmInterim.sites(side, inputs.arms, arm.elbow, arm.wrist, true, hand.radialCenter);
      console.log(JSON.stringify({ person: name, part: `arm.${side}`, forearmInput: inputs.arms.forearm, sites, diagnostics }));
      if (!sites.some((site: AutoMovieHumanArmWalk.ISiteLaw): boolean => site.site === "forearm" && "girth" in site.fullness && site.fullness.girth === inputs.arms.forearm)) defects.push(`${name}/arm.${side}: maximum forearm tape owns no source site`);
      const depth = (name: string): number => {
        const site: AutoMovieHumanArmWalk.ISiteLaw = sites.find((item: AutoMovieHumanArmWalk.ISiteLaw): boolean => item.site === name)!;
        return site.edges[0] - site.edges[2];
      };
      const palm: AutoMovieHumanArmWalk.ISiteLaw = sites.find((site: AutoMovieHumanArmWalk.ISiteLaw): boolean => site.site === "knuckles")!;
      const palmDepth: number = palm.edges[1] - palm.edges[3];
      if (Math.abs(palm.edges[0] - palm.edges[2] - inputs.arms[side].breadth) > 1e-9) defects.push(`${name}/arm.${side}: radial palm source does not own public hand breadth`);
      if (!(palmDepth < palm.edges[0] - palm.edges[2])) defects.push(`${name}/arm.${side}: palmar depth is not the short axis of the hand`);
      read(`${name}/arm.${side}`, AutoMovieHumanArmWalk.create(`arm.${side}`, arm, hand.knuckle, palmDepth / 2, sites, { elbow: depth("elbow"), wrist: depth("wrist") }, 3.5, hand.crease, hand.frame.across), defects);
      for (const [index, finger] of ["Index", "Middle", "Ring", "Little"].entries()) {
        const digit: AutoMovieHumanHandBones.IDigit = hand.fingers[finger as AutoMovieHumanHandBones.Finger];
        fingerCurve(`${name}/finger.${side}.${finger.toLowerCase()}`, `finger.${side}.${finger.toLowerCase()}`, digit, index + 2 as 2 | 3 | 4 | 5, inputs.arms[side].length / scale, measures, scale, defects);
      }
      fingerCurve(`${name}/thumb.${side}`, `thumb.${side}`, hand.thumb, 1, inputs.arms[side].length / scale, measures, scale, defects);
    }
  }
  if (defects.length !== 0) throw new Error(`Source curve findings (${defects.length}):\n${defects.join("\n")}`);
}

/** A public-B change must scale the same original across family once, retaining station, Y, L, jets/ranges and anatomical root/apex datums. This compares source declarations without another loft or normalizer call. */
function transverseFamily(base: AutoMovieHumanFootInterim.IDefinition, changed: AutoMovieHumanFootInterim.IDefinition, ratio: number, defects: string[]): void {
  const host: AutoMovieHumanFootPart.IInput = base.foot;
  const inputs: [AutoMovieHumanSiteViewPart.IInput, AutoMovieHumanSiteViewPart.IInput][] = [[AutoMovieHumanFootPart.source(host), AutoMovieHumanFootPart.source(changed.foot)]];
  for (let i: number = 0; i < base.toes.length; i++) {
    const before: ReturnType<typeof AutoMovieHumanToePart.source> = AutoMovieHumanToePart.source(base.toes[i]!.part);
    const after: ReturnType<typeof AutoMovieHumanToePart.source> = AutoMovieHumanToePart.source(changed.toes[i]!.part);
    if ("diagnostics" in before || "diagnostics" in after) defects.push(`${host.name}: a transverse-family toe lost its affine source`);
    else inputs.push([before, after]);
    const original: Vec3[] = [...base.toes[i]!.part.centres, base.toes[i]!.apex];
    const modified: Vec3[] = [...changed.toes[i]!.part.centres, changed.toes[i]!.apex];
    for (let j: number = 0; j < original.length; j++) {
      const a: Vec3 = original[j]!;
      const b: Vec3 = modified[j]!;
      const along = (p: Vec3): number => (p[0] - host.heel[0]) * host.along[0] + (p[2] - host.heel[2]) * host.along[2];
      const across = (p: Vec3): number => -(p[0] - host.heel[0]) * host.along[2] + (p[2] - host.heel[2]) * host.along[0];
      if (Math.abs(along(a) - along(b)) > 1e-9 || a[1] !== b[1] || Math.abs(across(b) - ratio * across(a)) > 1e-9) defects.push(`${host.name}/toe${i + 1}: public B changed the foot-along/Y datum or failed common transverse scaling`);
    }
  }
  for (const [before, after] of inputs) {
    if (before.pole?.end !== "both" || after.pole?.end !== "both" || Math.abs(before.pole.bottom - after.pole.bottom) > 1e-9 || Math.abs(before.pole.top - after.pole.top) > 1e-9 || JSON.stringify(before.ranges) !== JSON.stringify(after.ranges)) defects.push(`${before.name}: transverse scaling changed closing stations or plantar range`);
    for (let i: number = 0; i < before.sites.length; i++) {
      const a: AutoMovieHumanSiteViewPart.ISite = before.sites[i]!;
      const b: AutoMovieHumanSiteViewPart.ISite = after.sites[i]!;
      if (a.site !== b.site || Math.abs(a.station - b.station) > 1e-9 || JSON.stringify(a.jets) !== JSON.stringify(b.jets)) defects.push(`${before.name}: transverse scaling changed a named station or vertical jets`);
      for (const q of [0, 1, 2, 3] as const) if (Math.abs(b.edges[q] - a.edges[q] * (q % 2 === 1 ? ratio : 1)) > 1e-9) defects.push(`${before.name}/${a.site}: edge ${q} violates the common across-only family`);
    }
  }
}

/** Read all five public tape sections from the actual four source edges and fullness. Expected girths come directly from public resolved inputs, not the intermediate profile or box solver; extra rows cannot replace a public identity. Source sections are distinct from final joined skin. */
function legTapes(name: string, result: AutoMovieHumanSiteViewPart.IResult, measures: IAutoMovieHumanBodyMeasures, scale: number, defects: string[]): void {
  const part: IAutoMovieViewPart | null = result.part;
  if (part === null || part.fullness.kind !== "shoulder") return;
  const shoulder: ReturnType<typeof AutoMovieViewOutline.create> = AutoMovieViewOutline.create(part.fullness.shoulder);
  if ("detail" in shoulder) { defects.push(`${name}: tape fullness ${shoulder.detail}`); return; }
  const expected: Record<string, number> = { thigh: measures.thighCircumference, lowerThigh: measures.lowerThighCircumference, knee: measures.kneeCircumference, calf: measures.calfCircumference, ankle: measures.ankleCircumference };
  const curves: AutoMovieViewCurves.ICurve[] = AutoMovieViewCurves.create(part).curves;
  const rows: { site: string; girth: number; expected: number }[] = [];
  for (const [site, girth] of Object.entries(expected)) {
    const station: number | undefined = part.front.positive.knots.find((knot: IAutoMovieViewPart.IKnot): boolean => knot.site === site)?.station;
    if (station === undefined) { defects.push(`${name}: public tape ${site} was omitted`); continue; }
    const r: number | string = AutoMovieViewOutline.value(shoulder, station);
    const values: (number | string)[] = curves.map((curve: AutoMovieViewCurves.ICurve): number | string => curve.outline === null ? "missing edge" : AutoMovieViewOutline.value(curve.outline, station));
    if (typeof r === "string" || values.some((value: number | string): boolean => typeof value === "string")) { defects.push(`${name}/${site}: public tape source is unavailable`); continue; }
    const edges: number[] = values as number[];
    const actual: number = AutoMovieViewSection.length(AutoMovieViewSection.of({ extents: [edges[0]!, edges[2]!, -edges[1]!, -edges[3]!] }, [r, r, r, r]));
    if (!Number.isFinite(actual) || Math.abs(actual - girth * scale) > 1e-6) defects.push(`${name}/${site}: original tape ${actual} mm instead of public ${girth * scale} mm`);
    rows.push({ site, girth: actual, expected: girth * scale });
  }
  console.log(JSON.stringify({ source: name, publicTapeSources: rows, intermediateSites: part.front.positive.knots.filter((knot: IAutoMovieViewPart.IKnot): boolean => knot.site.startsWith("shape.")), scope: "original sections, not final skin" }));
}

/** Source-frame point, in calibration mm. */
type Vec3 = [number, number, number];
/** An actual source-curve sample that can disprove a whole-span premise. */
interface ICounterexample {
  /** Actual guide, 0/1/2/3 for front.pos/side.pos/front.neg/side.neg. */ quarter: 0 | 1 | 2 | 3;
  /** Material station. */ station: number;
  /** Signed coordinate tested against zero. */ value: number;
  /** Actual world point. */ point: Vec3;
  /** Source axis origin. */ origin: Vec3;
  /** Direction carrying the signed local edge. */ direction: Vec3;
  /** Signed local edge. */ edge: number;
}

/** Original critical-candidate plus sampled readings; no interval or final-surface certification is claimed. */
interface IProjection {
  /** Greatest sampled foot-along point among every original toe guide, mm. */ foremost: number;
  /** Lowest across source sample in the actual metatarsal world region, if supported. */ minimum?: IAcross;
  /** Highest across source sample in the actual metatarsal world region, if supported. */ maximum?: IAcross;
}

/** An actual source sample locating the owner of a metatarsal-width counterexample. */
interface IAcross {
  /** Actual anatomical source part. */ part: string;
  /** Actual front/side guide identity. */ curve: AutoMovieViewCurves.ICurve["name"];
  /** Source material station, calibration mm. */ station: number;
  /** World point, calibration mm. */ point: Vec3;
  /** Foot-along position selecting the anatomical region, calibration mm. */ along: number;
  /** Signed across coordinate in the independently queried foot frame, calibration mm. */ across: number;
}

/** Query emitted original guides, independently of the production normalizer, using actual declared affine endpoints for critical support and additional interior samples for counterexamples. */
function projected(result: AutoMovieHumanSiteViewPart.IResult, input: AutoMovieHumanFootPart.IInput, defects: string[]): IProjection {
  const output: IProjection = { foremost: -Infinity };
  if (result.part === null || input.metatarsal === undefined) return output;
  const across: Vec3 = [-input.along[2], 0, input.along[0]];
  for (const curve of AutoMovieViewCurves.create(result.part).curves) {
    if (curve.outline === null) continue;
    const regional: number[] = regionalCritical(result, curve, input, defects);
    for (const station of new Set([...sampledStations(curve.outline, result.part), ...regional])) {
      const reading: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, result.part.axis, station);
      if (typeof reading === "string") {
        defects.push(`${result.part.name}/${curve.name}: support reading failed: ${reading}`);
        continue;
      }
      const offset: Vec3 = reading.point.map((value: number, axis: number): number => value - input.heel[axis]!) as Vec3;
      const along: number = offset.reduce((sum: number, value: number, axis: number): number => sum + value * input.along[axis]!, 0);
      output.foremost = Math.max(output.foremost, along);
      if (regional.includes(station) || along >= input.metatarsal.span[0] && along <= input.metatarsal.span[1]) {
        const sample: IAcross = { part: result.part.name, curve: curve.name, station, point: reading.point, along, across: offset.reduce((sum: number, value: number, axis: number): number => sum + value * across[axis]!, 0) };
        if (output.minimum === undefined || sample.across < output.minimum.across) output.minimum = sample;
        if (output.maximum === undefined || sample.across > output.maximum.across) output.maximum = sample;
      }
    }
  }
  return output;
}

/** The actual emitted AST must declare two affine origin endpoints, not merely look straight at queried points. Closed-domain binary64 critical candidates are observations, not an interval proof. */
function regionalCritical(result: AutoMovieHumanSiteViewPart.IResult, curve: AutoMovieViewCurves.ICurve, input: AutoMovieHumanFootPart.IInput, defects: string[]): number[] {
  if (result.part === null || result.view === null || curve.outline === null || input.metatarsal === undefined || !curve.name.startsWith("side.")) return [];
  const declaration: typeof result.view.axis = result.view.axis;
  let ends: [number, number];
  if (declaration.type === "straight") ends = [...curve.outline.domain];
  else if (declaration.type === "parallel" && [declaration.origin.x, declaration.origin.y, declaration.origin.z].every((o): boolean => o.knots.length === 2 && o.parameter === undefined && o.range === undefined && o.knots.every((k): boolean => k.jet === undefined))) ends = [declaration.origin.x.knots[0]!.station * 1000, declaration.origin.x.knots[1]!.station * 1000];
  else {
    defects.push(`${result.part.name}: support query has no explicitly affine emitted origin`);
    return [];
  }
  const a: Vec3 = result.part.axis.at(ends[0]).origin;
  const b: Vec3 = result.part.axis.at(ends[1]).origin;
  const velocity: Vec3 = a.map((value: number, i: number): number => (b[i]! - value) / (ends[1] - ends[0])) as Vec3;
  const dot = (x: Vec3, y: Vec3): number => x.reduce((sum: number, value: number, i: number): number => sum + value * y[i]!, 0);
  const across: Vec3 = [-input.along[2], 0, input.along[0]];
  const along: number = dot(a.map((value: number, i: number): number => value - input.heel[i]!) as Vec3, input.along);
  const speed: number = dot(velocity, input.along);
  const from: number = Math.max(curve.outline.domain[0], ends[0] + (input.metatarsal.span[0] - along) / speed);
  const to: number = Math.min(curve.outline.domain[1], ends[0] + (input.metatarsal.span[1] - along) / speed);
  if (!(speed > 0) || from > to) return [];
  const candidates: number[] | string = from === to ? [from] : AutoMovieViewOutline.supportStations(curve.outline, dot(velocity, across), dot(result.part.axis.at(from)[curve.direction], across), [from, to]);
  if (typeof candidates === "string") {
    defects.push(`${result.part.name}: regional critical query failed: ${candidates}`);
    return [];
  }
  return candidates;
}

/** Retain every source premise failure instead of skipping an absent part. */
function read(name: string, result: AutoMovieHumanSiteViewPart.IResult, defects: string[]): void {
  for (const diagnostic of result.diagnostics) console.log(`${name}: ${diagnostic.producer}: ${diagnostic.contract}: ${diagnostic.detail}`);
  if (result.part === null || result.loft?.chain === null || result.loft === null) defects.push(`${name}: missing source part or loft`);
  if (result.part !== null) for (const diagnostic of AutoMovieViewCurves.create(result.part).diagnostics) defects.push(`${name}: original source ${diagnostic.contract}: ${diagnostic.detail}`);
}

/** Measure the actual world across supports on both original sides, including their analytic scalar critical stations in the declared metatarsal region. */
function footBreadth(name: string, result: AutoMovieHumanSiteViewPart.IResult, input: AutoMovieHumanFootPart.IInput, defects: string[]): void {
  if (result.part === null) return;
  if (input.metatarsal === undefined) {
    defects.push(`${name}: public breadth has no declared source interval`);
    return;
  }
  const [from, to]: [number, number] = input.metatarsal.span;
  const across: Vec3 = [-input.along[2], 0, input.along[0]];
  const values: number[] = [];
  for (const curve of AutoMovieViewCurves.create(result.part).curves) {
    if (!curve.name.startsWith("side.") || curve.outline === null) continue;
    for (const station of [from, to, ...AutoMovieViewOutline.criticalStations(curve.outline).filter((value: number): boolean => value > from && value < to)]) {
      const reading: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, result.part.axis, station);
      if (typeof reading === "string") defects.push(`${name}: source breadth reading failed: ${reading}`);
      else values.push(reading.point.reduce((sum: number, value: number, axis: number): number => sum + (value - input.heel[axis]!) * across[axis]!, 0));
    }
  }
  const breadth: number = Math.max(...values) - Math.min(...values);
  console.log(JSON.stringify({ part: name, sourceMetatarsalSpan: input.metatarsal.span, publicBreadth: input.metatarsal.breadth, sourceBreadth: breadth }));
  const retainedHostBreadth: number = input.metatarsal.supports.lateral + input.metatarsal.supports.medial;
  if (!Number.isFinite(breadth) || Math.abs(breadth - retainedHostBreadth) > 1e-6 || breadth > input.metatarsal.breadth + 1e-6) defects.push(`${name}: bare host breadth ${breadth} mm differs from its own supports ${retainedHostBreadth} mm or exceeds public group ${input.metatarsal.breadth} mm`);
}

/** Original knots/extrema and subdivided actual-frame queries; moving-frame sampled passes are not continuous world-bound proofs. */
function worst(result: AutoMovieHumanSiteViewPart.IResult, quarter: 0 | 1 | 2 | 3, coordinate: 0 | 1 | 2, sign: number, defects: string[]): ICounterexample | undefined {
  if (result.part === null) return undefined;
  const names: readonly AutoMovieViewCurves.ICurve["name"][] = ["front.positive", "side.positive", "front.negative", "side.negative"];
  const curve: AutoMovieViewCurves.ICurve | undefined = AutoMovieViewCurves.create(result.part).curves.find((item: AutoMovieViewCurves.ICurve): boolean => item.name === names[quarter]);
  if (curve === undefined || curve.outline === null) return undefined;
  const stations: number[] = sampledStations(curve.outline, result.part);
  let found: ICounterexample | undefined;
  for (const station of stations) {
    const point: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, result.part.axis, station);
    if (typeof point === "string") {
      defects.push(`${result.part.name}/${curve.name}: ${point}`);
      continue;
    }
    const value: number = sign * point.point[coordinate];
    if (found === undefined || value < found.value) found = { quarter, station, value, point: point.point, origin: point.frame.origin, direction: point.frame[curve.direction], edge: point.scalar.value };
  }
  return found;
}

/** Retain all source knots, scalar extrema and emitted stations, then sample their spans without claiming a world-extremum certificate. */
function sampledStations(outline: AutoMovieViewOutline.IOutline, part: IAutoMovieViewPart): number[] {
  const anchors: number[] = [...new Set([...outline.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station), ...AutoMovieViewOutline.criticalStations(outline), ...part.stations])].sort((a: number, b: number): number => a - b);
  return anchors.flatMap((station: number, index: number): number[] => index + 1 === anchors.length ? [station] : Array.from({ length: 16 }, (_: unknown, step: number): number => station + (anchors[index + 1]! - station) * step / 16));
}

/** Test every engine guide, including the walk adapter's reversed side pair. */
function worstAll(result: AutoMovieHumanSiteViewPart.IResult, coordinate: 0 | 1 | 2, sign: number, defects: string[]): ICounterexample | undefined {
  let found: ICounterexample | undefined;
  for (const quarter of [0, 1, 2, 3] as const) {
    const candidate: ICounterexample | undefined = worst(result, quarter, coordinate, sign, defects);
    if (candidate !== undefined && (found === undefined || candidate.value < found.value)) found = candidate;
  }
  return found;
}

/** A declared skin apex is not another bony centre to which the pulp may be added twice. */
function fingerCurve(label: string, name: string, digit: AutoMovieHumanHandBones.IDigit, index: 1 | 2 | 3 | 4 | 5, handLength: number, measures: IAutoMovieHumanBodyMeasures, scale: number, defects: string[]): void {
  const input: AutoMovieHumanDigitWalk.IInput = AutoMovieHumanDigitInterim.finger(name, digit.centres, digit.dorsal, measures.sex, handLength, index, scale);
  const result: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanDigitWalk.create(input);
  read(label, result, defects);
  if (result.part === null) return;
  const apex: Vec3 = result.part.axis.at(result.part.stations.at(-1)!).origin;
  const given: Vec3 = digit.centres.at(-1)!;
  const miss: number = Math.hypot(apex[0] - given[0], apex[1] - given[1], apex[2] - given[2]);
  console.log(JSON.stringify({ part: name, centres: digit.centres, declaredApex: given, curveApex: apex, miss }));
  if (miss > 1e-6) defects.push(`${label}: source pole is ${miss} mm beyond its declared skin apex`);
}

/** Preserve the shared bind direction while making its unit convention explicit. */
function unit(direction: readonly number[]): Vec3 {
  const length: number = Math.hypot(...direction);
  return [direction[0]! / length, direction[1]! / length, direction[2]! / length];
}
