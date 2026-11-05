import type { AutoMovieConstructionNode } from "@automovie/interface";
import { AutoMovieConstructionViews, type AutoMovieLoftFrame, AutoMovieLoftJet, AutoMovieViewCurves, AutoMovieViewOutline, AutoMovieViewParameter, type IAutoMovieViewPart, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmBones } from "../../../../../../packages/human/src/generation/arm/AutoMovieHumanArmBones";
import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanSiteViewPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanSex } from "../../../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The production definition exposes the actual anatomical tree before final
 * joins, retaining both hands' digits and both feet's toes for 2D inspection.
 *
 * Scenarios:
 * 1. The real generating head root is contained by identity in the production tree.
 * 2. Every anatomical body part has its own source view, including all fingers and toes.
 * 3. Each body view is the identical builder-owned source record; failed sources keep their diagnosis.
 * 4. Stature, neck and original diagnostics remain available without a rig or final skin.
 * 5. The actual trunk GH and arm lengths close neutral AR; each digit retains
 *    its generating hand's material direction and identical joint references.
 * 6. The hidden trunk closure retains signed source ranges and nonzero angle-pole tangents.
 * 7. The old upper chain copies the actual neck's world boundary and all six 2-jet vectors.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the shared production define entry and walks its actual tree. Reads trunk GH/rigid arm for the neutral caliper, hand material identity and actual roll endpoint/replay. Every toe's actual fixed foot-plane source is replayed through the same metre AST and its frames compared before any skin realization. Both production legs' original curves and actual trunk-derived placements are observed separately from the isolated limb question. The trunk's signed hull declarations and original critical/regular readings expose inter-knot cap inversion; its actual metre replay retains value and parameter jets. The old upper/actual neck boundary is read through the engine's independent world surface 2-jet, rather than accepting a copied metadata flag.
 * @evidence contracts/testing.md#independent-expectations Anatomical names require a trunk, paired masses, arms, legs, feet, five digits per hand and five toes per foot, with the identical head subtree. Public AR closes its straight measuring convention. Hand material/roll and fixed toe planes preserve their source. Trunk positive/negative edges cannot exchange signs; a closing angle tangent points inward at the top and outward at the bottom, is nonzero, has zero second parameter derivative and no fabricated finite station jet. The same regular neck boundary must have equal p/s/t/ss/st/tt on both consumer chains within1e-9 in each field's units. Actual leg points remain in their world median half-spaces; finite interior observations can disprove but cannot certify a moving-frame span. Printed site differences are not substituted tape/course expectations.
 * @evidence contracts/testing.md#distinguishing-cases Uses every environment-selected person's bilateral inputs and reports all omitted names/diagnoses together. Both hands query before WJC, at WJC, inside the transition, at MCP and beyond it. A range that merely flattens an incorrect pole tangent fails the nonzero closure expectation. Retaining local coefficients while dropping the translated neck frame fails the actual world boundary; singular pole derivatives are kept distinct from this regular station.
 * @evidence contracts/testing.md#execution-ownership Runs one synchronous source definition per selected person and replays only its source converter; requests no final realization, duplicate Human generation, rig, viewer, GPU, process or scratch output. Original AP mass poles are checked against public span/depth and the same trunk source site, independently of the placement solver; final tape/merge acceptance is excluded.
 */
export function test_human_body_definition(): void {
  const defects: string[] = [];
  for (const name of HumanPeople.names()) {
    const params: ReturnType<typeof HumanPeople.params> = HumanPeople.params(name);
    const definition: AutoMovieHumanBodyLaw.IDefinition = AutoMovieHumanBodyLaw.define(params);
    const names: Set<string> = new Set();
    let sameHead: boolean = false;
    const visit = (node: AutoMovieConstructionNode): void => {
      if (node === definition.head.root) {
        sameHead = true;
        return;
      }
      if (node.type === "view") {
        names.add(node.name);
        if (!definition.lane.sources.some((source: AutoMovieHumanSiteViewPart.ISource): boolean => source.result.view === node)) defects.push(`${name}: ${node.name} is not its original builder-owned source view`);
      }
      else {
        visit(node.host);
        if (node.type !== "trim") visit(node.part);
      }
    };
    if (definition.lane.root !== null) visit(definition.lane.root);
    const expected: string[] = ["trunk", "gluteal.left", "gluteal.right"];
    if (AutoMovieHumanBodyAnatomy.sexOf(params) === AutoMovieHumanSex.Female) expected.push("breast.left", "breast.right");
    for (const side of ["left", "right"] as const) {
      expected.push(`leg.${side}`, `foot.${side}`, `arm.${side}`, `thumb.${side}`);
      for (const digit of ["index", "middle", "ring", "little"]) expected.push(`finger.${side}.${digit}`);
      for (let toe: number = 1; toe <= 5; toe++) expected.push(`toe.${side}.${toe}`);
    }
    for (const part of expected) if (!names.has(part)) defects.push(`${name}: production source tree lacks ${part}`);
    if (!sameHead) defects.push(`${name}: the production tree does not contain its generating head root by identity`);
    if (!(definition.stature > 0 && Number.isFinite(definition.stature))) defects.push(`${name}: definition stature is not finite and positive`);
    if (definition.neckChain.layers.length === 0) defects.push(`${name}: the generating neck chain is empty`);
    else neckBoundary(name, definition, defects);
    for (const source of definition.lane.sources) if (source.result.part === null && source.result.diagnostics.length === 0) defects.push(`${name}: unavailable ${source.name} lost its original diagnosis`);
    for (const source of definition.lane.sources) if (source.name.startsWith("toe.")) toeFrame(`${name}/${source.name}`, source.result, defects);
    for (const source of definition.lane.sources) if (source.name === "leg.left" || source.name === "leg.right") productionMedian(`${name}/${source.name}`, source.result, source.name === "leg.left" ? 1 : -1, defects);
    const trunk: IAutoMovieViewPart | null | undefined = definition.lane.sources.filter((source: AutoMovieHumanSiteViewPart.ISource): boolean => source.name === "trunk").at(-1)?.result.part;
    if (trunk !== null && trunk !== undefined) {
      const sites: { site: string; station: number; points: (AutoMovieViewCurves.IReading | string)[] }[] = [];
      const curves: AutoMovieViewCurves.ICurve[] = AutoMovieViewCurves.create(trunk).curves;
      for (const knot of trunk.front.positive.knots) sites.push({ site: knot.site, station: knot.station, points: curves.map((curve: AutoMovieViewCurves.ICurve): AutoMovieViewCurves.IReading | string => AutoMovieViewCurves.at(curve, trunk.axis, knot.station)) });
      console.log(JSON.stringify({ person: name, trunkSiteAudit: { originalSites: sites, oldLandmarks: definition.standing.trunk, publicResolved: AutoMovieHumanBodyAnatomy.resolve(params) } }));
      massApex(name, definition, trunk, params, defects);
      trunkSpan(name, definition.lane.sources.filter((source: AutoMovieHumanSiteViewPart.ISource): boolean => source.name === "trunk").at(-1)!.result, defects);
    }
    const input: AutoMovieHumanBodyLaw.ILimbInputs = AutoMovieHumanBodyLaw.limbInputs(params);
    const upper: (typeof definition.skeleton)[number] = definition.skeleton.find((bone: (typeof definition.skeleton)[number]): boolean => bone.bone === "leftUpperArm")!;
    const elbow: (typeof definition.skeleton)[number] = definition.skeleton.find((bone: (typeof definition.skeleton)[number]): boolean => bone.bone === "leftLowerArm")!;
    const acromion: [number, number, number] = definition.standing.trunk!.shoulder;
    const humerus: number = Math.hypot(...elbow.position.map((value: number, axis: number): number => value - upper.position[axis]!));
    const neutralAR: number = acromion[1] - upper.position[1] + humerus + AutoMovieHumanArmBones.RADIALE * input.arms.upper;
    if (Math.abs(neutralAR - input.arms.upper) > 1e-9) defects.push(`${name}: production trunk GH and rigid arm do not close neutral AR: ${neutralAR} instead of ${input.arms.upper} mm`);
    for (const side of ["left", "right"] as const) {
      const hand: AutoMovieHumanBodyLaw.IDefinition["hands"]["left"] = definition.hands[side];
      for (const [digit, source] of [...Object.entries(hand.fingers), ["Thumb", hand.thumb]] as [string, typeof hand.thumb][]) {
        const base: (typeof definition.skeleton)[number] = definition.skeleton.find((bone: (typeof definition.skeleton)[number]): boolean => bone.bone === `${side}${digit === "Thumb" ? "ThumbMetacarpal" : `${digit}Proximal`}`)!;
        if (base.position !== source.centres[0]) defects.push(`${name}/${side}${digit}: bind joint lost its actual source reference`);
        const partName: string = digit === "Thumb" ? `thumb.${side}` : `finger.${side}.${digit.toLowerCase()}`;
        const view: AutoMovieHumanSiteViewPart.IResult["view"] = definition.lane.sources.find((attempt: AutoMovieHumanSiteViewPart.ISource): boolean => attempt.name === partName)?.result.view ?? null;
        if (view?.axis.type !== "jointed") defects.push(`${name}/${partName}: source material axis is unavailable`);
        else if ([view.axis.up.x, view.axis.up.y, view.axis.up.z].some((value: number, axis: number): boolean => value !== source.dorsal[axis])) defects.push(`${name}/${partName}: original material dorsal was reconstructed instead of retained`);
      }
    }
    // These actual world frames support the palm-chart audit; they are
    // observations, not a new roll oracle or a reference-fit target.
    for (const side of ["left", "right"] as const) {
      const source: AutoMovieHumanSiteViewPart.ISource | undefined = definition.lane.sources.find((item: AutoMovieHumanSiteViewPart.ISource): boolean => item.name === `arm.${side}`);
      if (source !== undefined && source.result.part !== null) {
        const part: NonNullable<AutoMovieHumanSiteViewPart.IResult["part"]> = source.result.part;
        materialFrame(`${name}/arm.${side}`, source.result, definition.hands[side].frame.across, defects);
        const edges: number[] = [part.front.positive, part.side.positive, part.front.negative, part.side.negative].map((outline: (typeof part.front)["positive"]): number => outline.knots.find((knot: (typeof outline.knots)[number]): boolean => knot.site === "knuckles")?.value ?? NaN);
        const radialBreadth: number = edges[0]! - edges[2]!;
        const palmarDepth: number = edges[1]! - edges[3]!;
        const radialCenter: number = (edges[0]! + edges[2]!) / 2;
        if (!edges.every(Number.isFinite) || Math.abs(radialBreadth - input.arms[side].breadth) > 1e-9) defects.push(`${name}/arm.${side}: radial u does not own public palm breadth`);
        if (Math.abs(radialCenter - definition.hands[side].radialCenter) > 1e-9) defects.push(`${name}/arm.${side}: palm lost its source packing centre`);
        const cap: [number, number, number] = part.axis.at(part.stations.at(-1)!).origin;
        const reach: number = Math.hypot(...cap.map((value: number, axis: number): number => value - definition.hands[side].crease[axis]!));
        if (Math.abs(reach - palmarDepth / 2) > 1e-6) defects.push(`${name}/arm.${side}: distal cap ${reach} mm uses the wrong anatomical dimension instead of palmar half-depth ${palmarDepth / 2} mm`);
        console.log(JSON.stringify({ person: name, part: source.name, radialBreadth, publicBreadth: input.arms[side].breadth, radialCenter, palmarDepth, capReach: reach }));
        for (const site of ["wrist", "knuckles"] as const) {
          const knot: (typeof part.front.positive.knots)[number] | undefined = part.front.positive.knots.find((item: (typeof part.front.positive.knots)[number]): boolean => item.site === site);
          if (knot !== undefined) console.log(JSON.stringify({ person: name, part: source.name, site, station: knot.station, frame: part.axis.at(knot.station), handFrame: definition.hands[side].frame, sourceDorsal: definition.hands[side].fingers.Middle.dorsal, skeleton: definition.skeleton.filter((bone: (typeof definition.skeleton)[number]): boolean => [`${side}Hand`, `${side}IndexProximal`, `${side}MiddleProximal`, `${side}LittleProximal`].includes(bone.bone)) }));
        }
      }
    }
    console.log(JSON.stringify({ person: name, sourceParts: [...names], sourceAttempts: definition.lane.sources.length, sameHead, stature: definition.stature, diagnostics: definition.diagnostics, headDiagnostics: definition.head.source.diagnostics, stage: "source-definition", finalRealization: "not-run" }));
  }
  if (defects.length !== 0) throw new Error(`Production source definition findings:\n${defects.join("\n")}`);
}

/** Read the actual cap sources and their declared hull bounds, pole-parameter jets and metre replay. Critical/regular observations supplement the shared control-hull contract; they do not prove final loft fidelity or a general world bound. All data belongs to the existing definition. */
function trunkSpan(name: string, source: AutoMovieHumanSiteViewPart.IResult, defects: string[]): void {
  if (source.part === null || source.view === null) return;
  const part: IAutoMovieViewPart = source.part;
  const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(source.view);
  if (typeof replay === "string") { defects.push(`${name}: trunk source replay: ${replay}`); return; }
  const originals: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
  const copies: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(replay);
  for (const diagnostic of [...originals.diagnostics, ...copies.diagnostics]) defects.push(`${name}: trunk original/replay ${diagnostic.contract}: ${diagnostic.detail}`);
  for (const curve of originals.curves) {
    const sign: 1 | -1 = curve.name.endsWith("positive") ? 1 : -1;
    const outline: AutoMovieViewOutline.IOutline | null = curve.outline;
    const copied: AutoMovieViewCurves.ICurve = copies.curves.find((candidate: AutoMovieViewCurves.ICurve): boolean => candidate.name === curve.name)!;
    if (outline === null || copied.outline === null) { defects.push(`${name}/${curve.name}: missing cap source`); continue; }
    const declared: IAutoMovieViewPart.IOutline = curve.name === "front.positive" ? part.front.positive : curve.name === "front.negative" ? part.front.negative : curve.name === "side.positive" ? part.side.positive : part.side.negative;
    if (part.pole !== "both" || outline.hermite === undefined || (sign === 1 ? declared.range?.minimum !== 0 || declared.range.maximum !== null : declared.range?.maximum !== 0 || declared.range.minimum !== null)) defects.push(`${name}/${curve.name}: no declared signed whole-span hull`);
    const [start, end]: readonly [number, number] = outline.domain;
    const stations: Set<number> = new Set([...outline.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station), ...AutoMovieViewOutline.criticalStations(outline)]);
    for (let index: number = 1; index < 128; index++) stations.add(start + (end - start) * index / 128);
    let minimum: number = Infinity;
    let replayMiss: number = 0;
    for (const station of stations) {
      const reading: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, part.axis, station);
      if (typeof reading === "string") { defects.push(`${name}/${curve.name}: ${reading}`); continue; }
      minimum = Math.min(minimum, sign * reading.scalar.value);
      const copiedStation: number = AutoMovieViewParameter.station(copied.outline.parameter, reading.scalar.parameter);
      const repeated: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(copied, replay.axis, copiedStation);
      if (typeof repeated === "string") defects.push(`${name}/${curve.name}: aligned replay ${repeated}`);
      else replayMiss = Math.max(replayMiss, Math.hypot(...repeated.point.map((value: number, axis: number): number => value - reading.point[axis]!)), ...repeated.scalar.parameterJet.map((value: number, axis: number): number => Math.abs(value - reading.scalar.parameterJet[axis]!)));
    }
    for (const station of [start, end]) {
      const reading: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(outline, station);
      if (typeof reading === "string" || reading.stationJet !== null || reading.stationJetStatus !== "singular-pole" || !(sign * reading.parameterJet[0] * (station === start ? 1 : -1) > 0) || Math.abs(reading.parameterJet[1]) > 1e-9) defects.push(`${name}/${curve.name}: invalid nonzero root tangent or fabricated physical pole jet at ${station}`);
    }
    if (minimum < -1e-9 || replayMiss > 1e-9) defects.push(`${name}/${curve.name}: signed source minimum ${minimum}, actual metre replay miss ${replayMiss}`);
    console.log(JSON.stringify({ person: name, source: `trunk.${curve.name}`, signedMinimum: minimum, replayMiss, scope: "original signed hull and parameter jets, not final surface G2" }));
  }
}

/** Compare the two actual regular boundary readers, including frame/lift product-rule terms. This retains the neck as owner; it does not compare the new source to retired harmonic skin or certify the intervening old trunk. No extra body or loft is built. */
function neckBoundary(name: string, definition: AutoMovieHumanBodyLaw.IDefinition, defects: string[]): void {
  const neck: IAutoMovieLoftChain = definition.neckChain;
  const upper: IAutoMovieLoftChain | undefined = definition.standing.chains.find((chain: IAutoMovieLoftChain): boolean => chain.name === "upper");
  if (upper === undefined || !AutoMovieLoftJet.carries(neck) || !AutoMovieLoftJet.carries(upper)) { defects.push(`${name}: actual neck/upper regular 2-jets are unavailable`); return; }
  const station: number = neck.layers[0]!.y;
  if (upper.layers.at(-1)!.y !== station || upper.layers.at(-1)!.frameSource !== neck.layers[0]!.frameSource) defects.push(`${name}: neck boundary lost its station or actual frame owner`);
  const miss: Record<keyof AutoMovieLoftJet.IJet, number> = { p: 0, s: 0, t: 0, ss: 0, st: 0, tt: 0 };
  for (let index: number = 0; index < 64; index++) {
    const phase: number = 2 * Math.PI * index / 64;
    const expected: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(neck, station, phase);
    const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(upper, station, phase);
    for (const field of ["p", "s", "t", "ss", "st", "tt"] as const) miss[field] = Math.max(miss[field], Math.hypot(...actual[field].map((value: number, axis: number): number => value - expected[field][axis]!)));
  }
  if (Object.values(miss).some((value: number): boolean => !Number.isFinite(value) || value > 1e-9)) defects.push(`${name}: actual neck boundary world 2-jet mismatch ${JSON.stringify(miss)}`);
  console.log(JSON.stringify({ person: name, regularNeckBoundary: { station, miss }, scope: "same actual boundary, not public base tape or retired-skin equivalence" }));
}

/**
 * Each actual source pole retains its public AP target on the same level as
 * the trunk's tape. Whole-depth is read from the original opposite trunk
 * guide to that pole; bilateral breast Z is the public half span. Fixed AP
 * section planes make the closed mass's station endpoints its AP supports,
 * independently of its radial curves. No final union or attachment is read.
 */
function massApex(name: string, definition: AutoMovieHumanBodyLaw.IDefinition, trunk: IAutoMovieViewPart, params: ReturnType<typeof HumanPeople.params>, defects: string[]): void {
  const measures: ReturnType<typeof AutoMovieHumanBodyAnatomy.resolve> = AutoMovieHumanBodyAnatomy.resolve(params);
  const scale: number = AutoMovieHumanBodyLaw.limbInputs(params).legs.scale;
  const curves: AutoMovieViewCurves.ICurve[] = AutoMovieViewCurves.create(trunk).curves;
  for (const kind of ["breast", "gluteal"] as const) {
    if (kind === "breast" && measures.sex !== AutoMovieHumanSex.Female) continue;
    const site: string = kind === "breast" ? "chest" : "buttock";
    const station: number | undefined = trunk.front.positive.knots.find((knot: IAutoMovieViewPart.IKnot): boolean => knot.site === site)?.station;
    if (station === undefined) { defects.push(`${name}: mass ${kind} has no common ${site} source site`); continue; }
    const opposite: AutoMovieViewCurves.ICurve = curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === (kind === "breast" ? "front.negative" : "front.positive"))!;
    const wall: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(opposite, trunk.axis, station);
    if (typeof wall === "string") { defects.push(`${name}/${kind}: opposite source guide failed: ${wall}`); continue; }
    for (const side of ["left", "right"] as const) {
      const source: AutoMovieHumanSiteViewPart.ISource | undefined = definition.lane.sources.filter((attempt: AutoMovieHumanSiteViewPart.ISource): boolean => attempt.name === `${kind}.${side}`).at(-1);
      if (source?.result.part === null || source?.result.part === undefined) { defects.push(`${name}/${kind}.${side}: actual mass source is unavailable`); continue; }
      const part: IAutoMovieViewPart = source.result.part;
      const last: number = part.stations.at(-1)!;
      const apex: [number, number, number] = part.axis.at(last).origin;
      const frame: AutoMovieLoftFrame.IFrame = part.axis.at(last);
      const depth: number = kind === "breast" ? apex[0] - wall.point[0] : wall.point[0] - apex[0];
      const expected: number = (kind === "breast" ? measures.chestDepth : measures.buttockDepth) * scale;
      const replay: IAutoMovieViewPart | string = source.result.view === null ? "missing actual view" : AutoMovieConstructionViews.part(source.result.view);
      const replayMiss: number = typeof replay === "string" ? Infinity : Math.hypot(...replay.axis.at(last).origin.map((value: number, axis: number): number => value - apex[axis]!));
      if (!apex.every(Number.isFinite) || Math.abs(apex[1] - station) > 1e-9 || Math.abs(depth - expected) > 1e-9 || frame.u[0] !== 0 || frame.v[0] !== 0 || replayMiss > 1e-9) defects.push(`${name}/${kind}.${side}: source AP apex/site/depth/replay does not retain its original definition`);
      if (kind === "breast" && Math.abs(apex[2] - (side === "left" ? 1 : -1) * measures.bustPointWidth * scale / 2) > 1e-9) defects.push(`${name}/${kind}.${side}: actual source apex does not retain public half bust-point span`);
      console.log(JSON.stringify({ person: name, part: `${kind}.${side}`, originalApex: apex, tapeSite: station, oppositeGuide: wall.point, originalDepth: depth, publicDepth: expected, replayMiss, scope: "original AP support, not final union or tape" }));
    }
  }
}

/**
 * Read each production leg's four original guides in its actual world frame,
 * retaining the most medial counterexample and its owning scalar/frame.
 * Named and scalar-critical stations plus sixteen subdivisions per source
 * knot interval provide counterexamples only, not a continuous half-space
 * proof. This reads the already generated source and creates no new limb,
 * fit, final surface, rig or renderer; arrays die with this synchronous call.
 */
function productionMedian(name: string, source: AutoMovieHumanSiteViewPart.IResult, sign: 1 | -1, defects: string[]): void {
  if (source.part === null) return;
  const part: IAutoMovieViewPart = source.part;
  let minimum: { value: number; curve: string; reading: AutoMovieViewCurves.IReading } | undefined;
  const prepared: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
  for (const diagnostic of prepared.diagnostics) defects.push(`${name}: original ${diagnostic.contract}: ${diagnostic.detail}`);
  for (const curve of prepared.curves) {
    if (curve.outline === null) continue;
    const stations: Set<number> = new Set([...curve.outline.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station), ...AutoMovieViewOutline.criticalStations(curve.outline)]);
    for (let index: number = 0; index + 1 < curve.outline.knots.length; index++) {
      const start: number = curve.outline.knots[index]!.station;
      const end: number = curve.outline.knots[index + 1]!.station;
      for (let sample: number = 1; sample < 16; sample++) stations.add(start + (end - start) * sample / 16);
    }
    for (const station of stations) {
      const reading: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, part.axis, station);
      if (typeof reading === "string") defects.push(`${name}/${curve.name}: original median reading failed: ${reading}`);
      else {
        const value: number = sign * reading.point[2];
        if (!Number.isFinite(value)) defects.push(`${name}/${curve.name}: original median coordinate is not finite at ${station} mm`);
        if (minimum === undefined || value < minimum.value) minimum = { value, curve: curve.name, reading };
      }
    }
  }
  if (minimum !== undefined && minimum.value < -1e-6) defects.push(`${name}: production world medial curve crosses the median by ${-minimum.value} mm at ${minimum.reading.scalar.station} mm`);
  console.log(JSON.stringify({ part: name, placementScope: "actual-production-trunk", originalMedian: minimum }));
}

/** Observe the actual toe's fixed observation planes and their metre AST replay at endpoints and intermediate stations; this does not realize a skin or certify its cap smoothness. */
function toeFrame(name: string, source: AutoMovieHumanSiteViewPart.IResult, defects: string[]): void {
  if (source.part === null || source.view === null || source.view.axis.type !== "parallel") {
    defects.push(`${name}: fixed foot-axis source declaration is unavailable`);
    return;
  }
  const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(source.view);
  if (typeof replay === "string") {
    defects.push(`${name}: toe plane reconstruction failed: ${replay}`);
    return;
  }
  const first: number = source.part.stations[0]!;
  const last: number = source.part.stations.at(-1)!;
  const initial: AutoMovieLoftFrame.IFrame = source.part.axis.at(first);
  let replayMiss: number = 0;
  let planeMiss: number = 0;
  for (const station of [first, first + (last - first) / 4, (first + last) / 2, last]) {
    const actual: AutoMovieLoftFrame.IFrame = source.part.axis.at(station);
    const tree: AutoMovieLoftFrame.IFrame = replay.axis.at(station);
    for (const key of ["origin", "u", "v"] as const) for (let axis: number = 0; axis < 3; axis++) replayMiss = Math.max(replayMiss, Math.abs(actual[key][axis]! - tree[key][axis]!));
    for (let axis: number = 0; axis < 3; axis++) planeMiss = Math.max(planeMiss, Math.abs(actual.u[axis]! - [0, 1, 0][axis]!), Math.abs(actual.v[axis]! - initial.v[axis]!));
  }
  if (!Number.isFinite(replayMiss) || replayMiss > 1e-9) defects.push(`${name}: source-to-tree toe frame differs by ${replayMiss} mm`);
  if (!Number.isFinite(planeMiss) || planeMiss > 1e-12) defects.push(`${name}: the fixed foot observation plane was transported by ${planeMiss}`);
  console.log(JSON.stringify({ part: name, toePlane: { first, last, replayMiss, planeMiss } }));
}

/**
 * Verify the actual anatomical roll endpoint and metre AST replay without
 * realizing a skin or inventing a second frame owner.
 * Reads the actual generating part and its production converter replay.
 * The signed endpoint is hand across projected normal to the actual course
 * tangent; every origin and the base frame through WJC must stay unchanged.
 * Both hands query before, at, within and after the transition, with separate
 * finite endpoint/replay tolerances. All readings are synchronous and local:
 * no extra Human, process, renderer, final skin or retained cache is created.
 */
function materialFrame(name: string, source: AutoMovieHumanSiteViewPart.IResult, target: [number, number, number], defects: string[]): void {
  if (source.part === null || source.view === null || source.view.axis.type !== "jointed" || source.view.axis.roll === undefined) {
    defects.push(`${name}: the WJC-to-MCP source material declaration is unavailable`);
    return;
  }
  const declaration: typeof source.view.axis = source.view.axis;
  const from: number = declaration.roll!.from * 1000;
  const to: number = declaration.roll!.to * 1000;
  const base: ReturnType<typeof AutoMovieConstructionViews.frame> = AutoMovieConstructionViews.frame({ type: "jointed", centres: declaration.centres, halves: declaration.halves, up: declaration.up });
  const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(source.view);
  if (typeof base === "string" || typeof replay === "string") {
    defects.push(`${name}: material frame reconstruction failed: ${typeof base === "string" ? base : replay}`);
    return;
  }
  const endpoint: AutoMovieLoftFrame.IFrame = source.part.axis.at(to);
  const normal: [number, number, number] = [endpoint.v[1] * endpoint.u[2] - endpoint.v[2] * endpoint.u[1], endpoint.v[2] * endpoint.u[0] - endpoint.v[0] * endpoint.u[2], endpoint.v[0] * endpoint.u[1] - endpoint.v[1] * endpoint.u[0]];
  const normalLength: number = Math.hypot(...normal);
  const tangent: number[] = normal.map((value: number): number => value / normalLength);
  const axial: number = target.reduce((sum: number, value: number, axis: number): number => sum + value * tangent[axis]!, 0);
  const projected: number[] = target.map((value: number, axis: number): number => value - axial * tangent[axis]!);
  const length: number = Math.hypot(...projected);
  const expected: number[] = projected.map((value: number): number => value / length);
  const miss: number = Math.hypot(...endpoint.u.map((value: number, axis: number): number => value - expected[axis]!));
  if (![normalLength, length, miss, ...expected].every(Number.isFinite) || !(length > 0) || miss > 1e-10) defects.push(`${name}: MCP radial material target misses its actual normal-plane projection by ${miss}`);
  let replayMiss: number = 0;
  let initialMiss: number = 0;
  for (const station of [from - 1, from, (from + to) / 2, to, to + 1]) {
    const actual: AutoMovieLoftFrame.IFrame = source.part.axis.at(station);
    const tree: AutoMovieLoftFrame.IFrame = replay.axis.at(station);
    const before: AutoMovieLoftFrame.IFrame = base.at(station);
    for (const key of ["origin", "u", "v"] as const) for (let axis: number = 0; axis < 3; axis++) {
      replayMiss = Math.max(replayMiss, Math.abs(actual[key][axis]! - tree[key][axis]!));
      if (station <= from) initialMiss = Math.max(initialMiss, Math.abs(actual[key][axis]! - before[key][axis]!));
      if (key === "origin") initialMiss = Math.max(initialMiss, Math.abs(actual.origin[axis]! - before.origin[axis]!));
    }
  }
  if (!Number.isFinite(replayMiss) || replayMiss > 1e-9) defects.push(`${name}: tree material-frame replay differs by ${replayMiss}`);
  if (!Number.isFinite(initialMiss) || initialMiss > 1e-12) defects.push(`${name}: material roll moved the centreline or the base frame through WJC by ${initialMiss}`);
  console.log(JSON.stringify({ part: name, materialRoll: { from, to, target, endpointU: endpoint.u, projectedTarget: expected, miss, replayMiss, initialMiss } }));
}
