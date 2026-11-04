import type { AutoMovieConstructionNode } from "@automovie/interface";
import { AutoMovieConstructionViews, type AutoMovieLoftFrame, type IAutoMovieViewPart } from "@automovie/engine";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the shared production define entry and walks its actual tree. Reads trunk GH/rigid arm for the neutral caliper, hand material identity and actual roll endpoint/replay. Every toe's actual fixed foot-plane source is replayed through the same metre AST and its frames compared before any skin realization.
 * @evidence contracts/testing.md#independent-expectations Anatomical names require a trunk, paired masses, arms, legs, feet, five digits per hand and five toes per foot, with the identical head subtree. Public AR closes its straight measuring convention. Hand joints/directions retain their actual source; MCP radial direction is its signed normal projection, while roll preserves origins and initial RMF. Toe source planes keep world up and fixed foot-across even when their origin drifts, and metre AST reconstruction preserves those actual frames.
 * @evidence contracts/testing.md#distinguishing-cases Uses every environment-selected person's bilateral inputs, permits the defined absence of male breast masses and reports all omitted names and diagnoses together. Both hands query before WJC, at WJC, inside the transition, at MCP and beyond it; finite endpoint and replay errors have separate tolerances.
 * @evidence contracts/testing.md#execution-ownership Runs one synchronous source definition per selected person and replays only its source converter; requests no final realization, duplicate Human generation, rig, viewer, GPU, process or scratch output.
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
    for (const source of definition.lane.sources) if (source.result.part === null && source.result.diagnostics.length === 0) defects.push(`${name}: unavailable ${source.name} lost its original diagnosis`);
    for (const source of definition.lane.sources) if (source.name.startsWith("toe.")) toeFrame(`${name}/${source.name}`, source.result, defects);
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
