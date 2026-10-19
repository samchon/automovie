import { AutoMoviePchip64, type IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as I } from "../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as K } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanSurfaceMeasurements as M } from "../structures/IAutoMovieHumanSurfaceMeasurements";
import { AutoMovieHumanSectionField64 } from "./AutoMovieHumanSectionField64";
import { AutoMovieHumanSurfaceBuilder64 } from "./AutoMovieHumanSurfaceBuilder64";
import { AutoMovieHumanSurfaceJunction64 } from "./AutoMovieHumanSurfaceJunction64";
import { AutoMovieHumanSurfaceLimb64 } from "./AutoMovieHumanSurfaceLimb64";
import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";
import { generateAutoMovieHumanSection64 } from "./generateAutoMovieHumanSection64";
import type { resolveAutoMovieHumanSurfaceTargets } from "./resolveAutoMovieHumanSurfaceTargets";

/**
 * Generate one rest field from detailed identity, the common skeleton and optional
 * physical observations. The trunk owns the shoulder/axilla and pelvis/groin
 * junction topology; all incident fields consume exact owner cuts and full jets.
 * Skin, construction, UV addresses and rig support read this same atlas.
 *
 * Automatic planes and missing-aspect rules carry explicit engineering grades.
 * They are not clinical pose conversions or fitted population laws. A refused
 * local limb family leaves a diagnosed partial layout rather than substituting
 * an old cage. Face apertures, hands, feet and their attachments remain missing.
 * Collar first derivatives are prescribed; hub-internal G1/twist compatibility
 * and global immersion/embedding remain unqualified, including when core
 * tessellation reports complete geometry and a qualified approximation.
 */
export function generateAutoMovieHumanSurfaceDefinition(props: {
  skeleton: K;
  identity: I;
  /** Admitted once before the owning rest cache is consulted. */
  targets: ReturnType<typeof resolveAutoMovieHumanSurfaceTargets>;
}): D {
  const targets: ReturnType<typeof resolveAutoMovieHumanSurfaceTargets> = props.targets;
  const body: I["identity"]["body"] = props.identity.identity.body;
  const diagnostics: string[] = [...targets.qualifications];
  const names: readonly (keyof NonNullable<M["trunk"]>)[] = ["chest", "waist", "buttock"];
  const samples: M.Section[] = names.map((name: keyof NonNullable<M["trunk"]>): M.Section => targets.trunk[name]);
  const stations: number[] = samples.map((sample: M.Section): number => -sample.heightMm);
  if (stations.some((s: number, i: number): boolean => i > 0 && s <= stations[i-1]!))
    throw new Error("Physical trunk planes must be ordered chest above waist above buttock");
  const supports: K.IJoint[] = props.skeleton.joints.filter((joint: K.IJoint): boolean =>
    ["hips", "spine", "chest", "upperChest", "neck"].includes(joint.bone),
  ).sort((a: K.IJoint,b: K.IJoint): number => a.position.y-b.position.y);
  if (supports.length !== 5) throw new Error("All five common trunk support centres required");
  const sagittal: AutoMoviePchip64 = new AutoMoviePchip64(
    supports.map((joint: K.IJoint): number => joint.position.y),
    supports.map((joint: K.IJoint): number => joint.position.z));
  /** Continue the terminal support chord outside the spinal joint interval. */
  function axisZ(height: number): number {
    const below: boolean = height < supports[0]!.position.y;
    const above: boolean = height > supports.at(-1)!.position.y;
    if (!below && !above) return sagittal.at(height);
    const a: K.IJoint = below ? supports[0]! : supports.at(-2)!;
    const b: K.IJoint = below ? supports[1]! : supports.at(-1)!;
    return a.position.z+(height-a.position.y)*(b.position.z-a.position.z)/(b.position.y-a.position.y);
  }
  const generated: ReturnType<typeof generateAutoMovieHumanSection64>[] = samples.map(
    (sample: M.Section,i: number): ReturnType<typeof generateAutoMovieHumanSection64> =>
      generateAutoMovieHumanSection64({name: `trunk.${names[i]}`,
        breadthMm: sample.breadthMm, depthMm: sample.depthMm, perimeterMm: sample.perimeterMm,
        centreMm: [0,sample.heightMm,axisZ(sample.heightMm)+(sample.anteriorFraction-0.5)*sample.depthMm],
        breadthAxis: [1,0,0], anteriorAxis: [0,0,1]}));
  const trunk: AutoMovieHumanSectionField64 = new AutoMovieHumanSectionField64(stations,
    generated.map((sample: ReturnType<typeof generateAutoMovieHumanSection64>): C.Cubic => sample.curve));
  const cuts: D.Boundary[] = names.map((name: keyof NonNullable<M["trunk"]>, i: number): D.Boundary => ({
    id: `trunk/${name}`, curve: trunk.courses[i]!, fullJ: trunk.fullJ[i]!,
    longitudinalAxis: [0,-1,0], incidents: [],
  }));
  const limbs: Map<string, AutoMovieHumanSurfaceLimb64> = new Map();
  for (const side of ["left", "right"] as const)
    for (const part of ["arm", "leg"] as const)
      try {
        const section: readonly [M.Envelope,M.Envelope,M.Envelope,M.Envelope] = part === "arm"
          ? [targets.arms[side].upperArm!,targets.arms[side].elbow!,targets.arms[side].forearm!,targets.arms[side].wrist!]
          : [targets.legs[side].thigh!,targets.legs[side].knee!,targets.legs[side].calf!,targets.legs[side].ankle!];
        limbs.set(`${part}.${side}`, new AutoMovieHumanSurfaceLimb64({part,side,
          skeleton: props.skeleton, sections: section}));
      } catch (cause: unknown) {
        diagnostics.push(`${part}.${side} not emitted: ${cause instanceof Error ? cause.message : String(cause)}`);
      }
  const neckJoint: K.IJoint | undefined = props.skeleton.joints.find((joint: K.IJoint): boolean => joint.bone === "neck");
  const headJoint: K.IJoint | undefined = props.skeleton.joints.find((joint: K.IJoint): boolean => joint.bone === "head");
  if (neckJoint === undefined || headJoint === undefined) throw new Error("Common neck/head joints required");
  const neckVector: C.Vector = [headJoint.position.x-neckJoint.position.x,
    headJoint.position.y-neckJoint.position.y,headJoint.position.z-neckJoint.position.z];
  const neckLength: number = Math.hypot(...neckVector);
  if (!(neckLength > 0)) throw new Error("Positive common neck/head chord required");
  const neckAxis: C.Vector = neckVector.map((x: number): number => x/neckLength) as unknown as C.Vector;
  const anteriorLength: number = Math.sqrt(1-neckAxis[2]**2);
  if (!(anteriorLength > 0)) throw new Error("Unresolved anterior neck reference");
  const anterior: C.Vector = [-neckAxis[0]*neckAxis[2]/anteriorLength,
    -neckAxis[1]*neckAxis[2]/anteriorLength,(1-neckAxis[2]**2)/anteriorLength];
  const breadth: C.Vector = [anterior[1]*neckAxis[2]-anterior[2]*neckAxis[1],
    anterior[2]*neckAxis[0]-anterior[0]*neckAxis[2],anterior[0]*neckAxis[1]-anterior[1]*neckAxis[0]];
  const neckCentres: C.Vector[] = [0.35,0.7].map((fraction: number): C.Vector => [
    neckJoint.position.x+fraction*neckVector[0],neckJoint.position.y+fraction*neckVector[1],
    neckJoint.position.z+fraction*neckVector[2]]);
  const neck: AutoMovieHumanSectionField64 = new AutoMovieHumanSectionField64([0,0.35*neckLength],
    neckCentres.map((centre: C.Vector,i: number): C.Cubic => generateAutoMovieHumanSection64({
      name: i === 0 ? "neck.midTube" : "neck.upperTube",...targets.neck,
      centreMm: centre,breadthAxis: breadth,anteriorAxis: anterior}).curve));
  const neckCut: D.Boundary = {id: "neck.midTube",curve: neck.courses[0]!,fullJ: neck.fullJ[0]!,
    longitudinalAxis: neckAxis, incidents: []};
  const builder: AutoMovieHumanSurfaceBuilder64 = new AutoMovieHumanSurfaceBuilder64({
    domain: "human.rest",revision: "physical-rest-field-2",toleranceMm: 0.5,
    maxCells: 32768,maxVertices: 131072});
  const shoulderConnected: boolean = limbs.has("arm.left") && limbs.has("arm.right");
  const pelvisConnected: boolean = limbs.has("leg.left") && limbs.has("leg.right");
  if (shoulderConnected) {
    const centre: C.Vector = [0,(samples[0]!.heightMm+neckCentres[0]![1])/2,
      (axisZ(samples[0]!.heightMm)+neckCentres[0]![2])/2];
    new AutoMovieHumanSurfaceJunction64({id: "shoulder-axilla",centreMm: centre,
      radiiMm: [samples[0]!.breadthMm/2,(neckCentres[0]![1]-samples[0]!.heightMm)/2,samples[0]!.depthMm/2],
      ports: {"y-": {cut: cuts[0]!,outwardSign: 1,firstSpan: 0,reversePhase: true},
        "y+": {cut: neckCut,outwardSign: 1,firstSpan: 0,reversePhase: true},
        "x+": {cut: limbs.get("arm.left")!.proximal,outwardSign: 1,firstSpan: 0,reversePhase: true},
        "x-": {cut: limbs.get("arm.right")!.proximal,outwardSign: 1,firstSpan: 0,reversePhase: true}},
      owner: {part: "trunk",side: null,branch: "shoulder-axilla",skinRole: "ordinary",
        bones: ["chest","upperChest","neck","leftUpperArm","rightUpperArm"],
        textureRectangle: [0,0,1,1],headChart: null}}).emit(builder);
  } else diagnostics.push("Shoulder/axilla junction missing because an incident limb family is unsupported.");
  if (pelvisConnected) {
    const left: D.Boundary = limbs.get("leg.left")!.proximal;
    const right: D.Boundary = limbs.get("leg.right")!.proximal;
    const legHeight: number = [...left.curve.spans,...right.curve.spans].reduce(
      (sum: number, span: C.Span): number => sum+span[0][1]/16, 0);
    const centre: C.Vector = [0,(samples[2]!.heightMm+legHeight)/2,axisZ(samples[2]!.heightMm)];
    new AutoMovieHumanSurfaceJunction64({id: "pelvis-groin",centreMm: centre,
      radiiMm: [body.hipBreadth/2,(samples[2]!.heightMm-legHeight)/2,body.buttockDepth/2],
      ports: {"y+": {cut: cuts[2]!,outwardSign: -1,firstSpan: 4,reversePhase: false},
        "x+": {cut: left,outwardSign: 1,firstSpan: 0,reversePhase: true},
        "x-": {cut: right,outwardSign: 1,firstSpan: 0,reversePhase: true}},
      owner: {part: "trunk",side: null,branch: "pelvis-groin",skinRole: "ordinary",
        bones: ["hips","spine","leftUpperLeg","rightUpperLeg"],
        textureRectangle: [0,0,1,1],headChart: null}}).emit(builder);
  } else diagnostics.push("Pelvis/groin junction missing because an incident limb family is unsupported.");
  for (let i: number = 0; i < 2; ++i)
    builder.strip({id: `trunk/${names[i]}-${names[i+1]}`,
      start: {id: cuts[i]!.id,curve: trunk.courses[i]!,fullJ: trunk.fullJ[i]!},
      end: {id: cuts[i+1]!.id,curve: trunk.courses[i+1]!,fullJ: trunk.fullJ[i+1]!},
      lengthMm: stations[i+1]!-stations[i]!,owner: {part: "trunk",side: null,branch: null,
        skinRole: "ordinary",bones: ["hips","spine","chest","upperChest"],
        textureRectangle: [0,i/2,1,(i+1)/2],headChart: null}});
  for (let i: number = 0; i < 3; ++i)
    builder.boundary({...cuts[i]!,incidents: [
      {chart: i === 0 ? "shoulder-axilla" : `trunk/${names[i-1]}-${names[i]}`,
        status: i === 0 && !shoulderConnected ? "missing" : "generated"},
      {chart: i === 2 ? "pelvis-groin" : `trunk/${names[i]}-${names[i+1]}`,
        status: i === 2 && !pelvisConnected ? "missing" : "generated"},
    ]});
  builder.strip({id: "neck",start: {id: neckCut.id,curve: neck.courses[0]!,fullJ: neck.fullJ[0]!},
    end: {id: "neck.upperTube",curve: neck.courses[1]!,fullJ: neck.fullJ[1]!},lengthMm: 0.35*neckLength,
    owner: {part: "neck",side: null,branch: null,skinRole: "ordinary",bones: ["neck","head"],
      textureRectangle: [0,0,1,1],headChart: null}});
  builder.boundary({...neckCut,incidents: [{chart: "shoulder-axilla",
    status: shoulderConnected ? "generated" : "missing"},{chart: "neck",status: "generated"}]});
  builder.boundary({id: "neck.upperTube",curve: neck.courses[1]!,fullJ: neck.fullJ[1]!,
    longitudinalAxis: neckAxis,incidents: [{chart: "neck",status: "generated"},{chart: "head",status: "missing"}]});
  for (const limb of limbs.values()) limb.emit(builder, limb.proximal.id.startsWith("arm") ? shoulderConnected : pelvisConnected);
  diagnostics.push(
    "Partial common Human layout: head/face openings, ears, hands/digits, feet/toes and attachments are not emitted. No old skin supplies missing charts.",
    "Neck support stations use 0.35 and 0.70 of the actual neck-to-head joint chord; they are engineering tube planes, not measured clinical cuts.",
    "Hub topology and collar P/fullJ are explicit. Hub-internal C0 edges do not certify G1/twist compatibility, immersion or embedding.",
    "Only supplied station triples are physical target assertions. Automatic neutral-rest defaults and intermediate section fields remain unvalidated shape/posture conventions.",
    ...generated.map((sample: ReturnType<typeof generateAutoMovieHumanSection64>): string =>
      `${sample.curve.name}: perimeter residual ${sample.perimeterResidualMm} mm; quadrature agreement ${sample.quadratureAgreementMm} mm; tolerance ${sample.numericalToleranceMm} mm (not a certified integration error bound).`));
  return builder.finish(diagnostics);
}
