import type { IAutoMovieModel } from "@automovie/interface";
import { HumanFootBody } from "./extremities/HumanFootBody";
import { HumanHandShafts } from "./extremities/HumanHandShafts";
import { HumanHead } from "./head/HumanHead";
import { HumanMouthFeatures } from "./head/HumanMouthFeatures";
import { HumanFaceFeatures } from "./head/HumanFaceFeatures";
import { HumanEarFeatures } from "./head/HumanEarFeatures";
import { HumanNoseFeatures } from "./head/HumanNoseFeatures";
import { HumanHeadFrame } from "./head/HumanHeadFrame";
import { HumanUpperFaceFeatures } from "./head/HumanUpperFaceFeatures";
import { HumanUpperFaceSurface } from "./head/HumanUpperFaceSurface";
import { HumanCranialDomain } from "./head/HumanCranialDomain";
import { HumanForeheadSideNetwork } from "./head/HumanForeheadSideNetwork";
import { HumanPosteriorIntegration } from "./head/HumanPosteriorIntegration";
import { HumanEyelidAnnulus } from "./head/HumanEyelidAnnulus";
import { HumanLowerEyeSurface } from "./head/HumanLowerEyeSurface";
import { HumanEyeFoldNetwork } from "./head/HumanEyeFoldNetwork";
import { HumanCurveFamily } from "./internal/HumanCurveFamily";
import { HumanCurveMesh } from "./internal/HumanCurveMesh";
import { HumanSkeleton } from "./internal/HumanSkeleton";
import { HumanHandFrame } from "./internal/HumanHandFrame";
import { HumanPelvisAssembly } from "./internal/HumanPelvisAssembly";
import { HumanPelvisLateralAssembly } from "./internal/HumanPelvisLateralAssembly";
import { HumanAnkleAssembly } from "./internal/HumanAnkleAssembly";
import { HumanPalmContours } from "./hand/HumanPalmContours";
import { HumanPalmRules } from "./hand/HumanPalmRules";
import { HumanFourGroupContours } from "./hand/HumanFourGroupContours";
import { HumanFourGroupRules } from "./hand/HumanFourGroupRules";
import { HumanDigitRegularJoint } from "./hand/HumanDigitRegularJoint";
import { HumanThumbContours } from "./hand/HumanThumbContours";
import { HumanThumbTerminal } from "./hand/HumanThumbTerminal";
import { HumanPatchMesh } from "./internal/HumanPatchMesh";
import { HumanJointAssembly } from "./internal/HumanJointAssembly";
import type { HumanSurface } from "./internal/HumanSurface";
import { HumanShoulderAssembly } from "./internal/HumanShoulderAssembly";
import { HumanShoulderStationRules } from "./shoulder/HumanShoulderStationRules";
import type { HumanCurve } from "./internal/HumanCurve";
import { HumanLimbCurves } from "./limbs/HumanLimbCurves";
import type { IAutoMovieHumanBodyParameters } from "./structures/body/IAutoMovieHumanBodyParameters";
import type { IAutoMovieHumanCurveSupplement } from "./structures/body/IAutoMovieHumanCurveSupplement";
import type { IAutoMovieHumanHeadIdentity } from "./structures/head/IAutoMovieHumanHeadIdentity";
import type { IAutoMovieHumanPair } from "./structures/common/IAutoMovieHumanPair";
import { HumanTrunkAssembly } from "./internal/HumanTrunkAssembly";
import { HumanLowerFaceSurface } from "./head/HumanLowerFaceSurface";
import { HumanNeckCurves } from "./neck/HumanNeckCurves";
import { HumanNeckRules } from "./neck/HumanNeckRules";

/** Generate identified neutral Human regions from physical parameters and shared
 * recovered-curve rules. The returned coverage remains partial until every
 * regional and junction domain has an identified generating rule. No reference
 * files, source mesh or source normals are consumed by this operation.
 */
export function generateAutoMovieHuman(body: IAutoMovieHumanBodyParameters, head: IAutoMovieHumanHeadIdentity, extremities: generateAutoMovieHuman.ExtremityDimensions = {}, supplement?: IAutoMovieHumanCurveSupplement, generationScope: generateAutoMovieHuman.GenerationScope = {mode:"full"}): generateAutoMovieHuman.Result {
  const allRegions: readonly generateAutoMovieHuman.GenerationRegion[] = ["head","neck","shoulder","trunk","pelvis","limbs","hands","feet"];
  if (generationScope === null || typeof generationScope !== "object" || (generationScope.mode !== "full" && generationScope.mode !== "isolated-regions")) throw new Error("An explicit full or isolated-regions generation scope is required");
  if (generationScope.mode === "full" && Object.keys(generationScope).some((key:string):boolean=>key!=="mode")) throw new Error("Full generation scope has no regional selection");
  if (generationScope.mode === "isolated-regions" && (Object.keys(generationScope).some((key:string):boolean=>key!=="mode"&&key!=="regions") || !Array.isArray(generationScope.regions) || generationScope.regions.length===0 || new Set(generationScope.regions).size!==generationScope.regions.length || generationScope.regions.some((region:generateAutoMovieHuman.GenerationRegion):boolean=>!allRegions.includes(region)))) throw new Error("Isolated generation requires a nonempty unique explicit region list");
  const selectedRegions: readonly generateAutoMovieHuman.GenerationRegion[] = generationScope.mode === "full" ? allRegions : generationScope.regions;
  const requested: readonly generateAutoMovieHuman.GenerationRegion[] = allRegions.filter((region:generateAutoMovieHuman.GenerationRegion):boolean=>selectedRegions.includes(region));
  const scope: generateAutoMovieHuman.GenerationScope = generationScope.mode === "full" ? {mode:"full"} : {mode:"isolated-regions",regions:[...requested]};
  const take: (region:generateAutoMovieHuman.GenerationRegion)=>boolean = (region:generateAutoMovieHuman.GenerationRegion):boolean => requested.includes(region);
  if (scope.mode === "isolated-regions" && take("hands") && extremities.hands === undefined) throw new Error("An explicit hands observation requires the existing independent hand dimensions");
  if (scope.mode === "isolated-regions" && take("feet") && extremities.feet === undefined) throw new Error("An explicit feet observation requires the existing independent foot dimensions");
  const needTrunk: boolean = take("trunk") || take("pelvis"), needLimbs: boolean = take("limbs") || take("pelvis") || take("shoulder") || take("feet");
  const joinedFeet: boolean = extremities.footAssembly === "joined", needJoints: boolean = take("limbs") || take("shoulder") || (take("feet") && joinedFeet);
  const needFeet: boolean = take("feet") || (joinedFeet && needJoints);
  const generationDependencies: string[] = ["common-generated-skeleton",...(needTrunk&&!take("trunk")?["actual-trunk-Hip-function-authority"]:[]),...(needLimbs&&!take("limbs")?["actual-limb-curve-and-support-authority"]:[]),...(needJoints&&!take("limbs")?["actual-retained-shaft-and-joint-boundary-owner"]:[]),...(needFeet&&!take("feet")&&extremities.feet!==undefined?["actual-foot-boundary-dependency-for-joined-shafts"]:[])];
  const patchDepth: number = 4;
  const skeleton: HumanSkeleton.Result = HumanSkeleton.build(body);
  const supports: Map<string, HumanCurve.Vector> = new Map(skeleton.supports);
  const trunkAssembly: HumanTrunkAssembly.Result | undefined = needTrunk ? HumanTrunkAssembly.build(body,skeleton) : undefined;
  const limbs: HumanLimbCurves.Result | undefined = needLimbs ? HumanLimbCurves.build(body,skeleton) : undefined;
  const pelvis: HumanPelvisAssembly.Result | undefined = take("pelvis") ? HumanPelvisAssembly.build(body,skeleton,trunkAssembly!.family,limbs!,trunkAssembly!.hip) : undefined;
  const lateralPelvis: HumanPelvisLateralAssembly.Result | undefined = pelvis === undefined ? undefined : HumanPelvisLateralAssembly.build(body,skeleton,trunkAssembly!,pelvis);
  const neck: HumanNeckCurves.Result | undefined = take("neck") ? HumanNeckCurves.build(body,skeleton,HumanNeckRules.rule) : undefined;
  const feet: Map<"l"|"r",HumanJointAssembly.Foot> = new Map();
  if (needFeet && extremities.feet !== undefined)
    for (const [side,key] of [["l","left"],["r","right"]] as const) {
      const support: HumanCurve.Vector | undefined = supports.get("foot_"+side);
      if (support === undefined) throw new Error("A foot has no generated common support");
      const foot: HumanFootBody.Result = HumanFootBody.build(support,side,extremities.feet[key]);
      register(foot.supports);
      feet.set(side,{body:foot,breadthMm:extremities.feet[key].footBreadth});
    }
  const ankles: HumanAnkleAssembly.Result | undefined = take("feet") ? HumanAnkleAssembly.build(skeleton,limbs!,feet) : undefined;
  const angularParameters: number[] = Array.from({length:97},(_:unknown,index:number):number=>index*2*Math.PI/96);
  const joints: HumanJointAssembly.Result | undefined = needJoints ? HumanJointAssembly.build(body,skeleton,limbs!,angularParameters,joinedFeet?feet:new Map()) : undefined;
  const shoulders: HumanShoulderAssembly.Result | undefined = take("shoulder") ? HumanShoulderAssembly.build(body,skeleton,joints!,HumanShoulderStationRules.law) : undefined;
  const headRegion: HeadRegion | undefined = take("head") ? buildHead() : undefined;
  const featureCurves: HumanSurface.Boundary[] = [...(shoulders?.curves??[]),...(pelvis?.curves??[]),...(lateralPelvis?.curves??[]),...(ankles?.curves??[]),...(headRegion?.curves??[])];
  for (const curve of [...(take("trunk")?trunkAssembly!.boundaries:[]),...(headRegion?.extraCurves??[])]) {
    const existing: HumanSurface.Boundary | undefined = featureCurves.find((candidate:HumanSurface.Boundary):boolean=>candidate.id===curve.id);
    if (existing === undefined) featureCurves.push(curve); else if (existing !== curve) throw new Error("The common assembly has multiple authorities for "+curve.id);
  }
  const featureConstruction: HumanCurveMesh.Line[] = featureCurves.map((curve:HumanSurface.Boundary):HumanCurveMesh.Line=>({id:curve.id,points:Array.from({length:65},(_:unknown,index:number):HumanCurve.Vector=>curve.evaluate(index===64?curve.end:curve.start+(curve.end-curve.start)*index/64).map((value:number):number=>value/1000) as HumanCurve.Vector)}));
  const boundaryRegistry: Map<string,HumanSurface.Boundary> = new Map();
  const selectedJointPatches: HumanSurface.Patch[] = (joints?.patches??[]).filter((patch:HumanSurface.Patch):boolean=>patch.id.startsWith("foot-")?take("feet"):take("limbs"));
  const patches: HumanPatchMesh.Result[] = [...(shoulders?.patches??[]),...(take("trunk")?trunkAssembly!.patches:[]),...(lateralPelvis?.patches??[]),...(headRegion?.beforeJoints??[]),...selectedJointPatches,...(headRegion?.afterJoints??[])].map((patch:HumanSurface.Patch):HumanPatchMesh.Result=>HumanPatchMesh.build(patch,boundaryRegistry,patchDepth));
  const regions: HumanCurveMesh.Result[] = [...(headRegion?[headRegion.shell]:[]),...(neck?[HumanCurveMesh.build(neck.id,neck.family,neck.outwardSign)]:[]),...(joints?.regions??[]).filter((region:HumanJointAssembly.Region):boolean=>region.id.startsWith("joint-ankle-")?take("feet"):take("limbs")).map((region:HumanJointAssembly.Region):HumanCurveMesh.Result=>HumanCurveMesh.build(region.id,region.family,region.outwardSign))];
  const limitations: string[] = [...skeleton.limitations,...(trunkAssembly?.limitations??[]),...(pelvis?.limitations??[]),...(lateralPelvis?.limitations??[]),...(limbs?.limitations??[]),...(ankles?.limitations??[]),...(neck?.limitations??[]),...(joints?.limitations??[]),...(shoulders?.limitations??[]),...(headRegion?.limitations??[])];
  if (scope.mode === "isolated-regions") limitations.push("This is an explicitly selected isolated-regions observation, never an automatic fallback from failed whole-body generation. Only requested regional skins/construction are emitted; declared dependencies supply actual common functions and boundaries without emitting their unrequested skin.");
  if (trunkAssembly !== undefined) limitations.push("The common posterior station-secant trunk law reduces the observed lower reversal excursion but does not remove every internal reversal. Its affine first-G1 witness may lie outside original class brackets; source correspondence and independent physiological q effects remain unqualified");
  if (lateralPelvis !== undefined && trunkAssembly !== undefined) limitations.push("Actual lateral pelvic chart/root evidence; query indices refer to the complete Hip queries below: " + JSON.stringify(lateralPelvis.reports.map((entry: HumanPelvisLateralAssembly.Result["reports"][number]): unknown => {
    const {originalEndpointQueries,samples,...remainder}: typeof entry.report = entry.report;
    const queryIndex = (query: typeof originalEndpointQueries[number]): number => {
      const index: number = trunkAssembly.hipQueries.indexOf(query);
      if (index < 0) throw new Error("Lateral pelvic evidence has an unowned Hip query");
      return index;
    };
    return {side:entry.side,trueQuarter:entry.trueQuarter,report:{...remainder,
      originalEndpointQueryIndices:originalEndpointQueries.map(queryIndex),
      samples:samples.map((sample: typeof samples[number]): unknown => {const {originalQuery,...record}: typeof sample = sample;return {...record,originalQueryIndex:queryIndex(originalQuery)};})}};
  })));
  if (trunkAssembly !== undefined) limitations.push("Actual full-piece Hip root queries, with separate coefficient and owner admissions: " + JSON.stringify(trunkAssembly.hipQueries));
  if (supplement !== undefined) limitations.push("Only supplied eye canthal slant, recession and margin bulge currently affect generation through the shared eye curves. Other supplied curve-supplement fields remain unsupported; no independent fold, roll, torso, pelvis, arm, leg, palm, heel or toe effect is claimed");
  for (const [side, key] of [["l", "left"], ["r", "right"]] as const) {
    if (take("hands") && extremities.hands !== undefined) {
      const circumference: number | null = body.controls.handCircumference.value;
      if (circumference === null) throw new Error("Hand shaft generation requires its independent physical circumference");
      const handFrame: HumanHandFrame.Result = HumanHandFrame.build(supports.get("hand_" + side)!,side);
      const hand: HumanHandShafts.Result = HumanHandShafts.build(handFrame.originMm, side, extremities.hands[key], circumference, handFrame);
      const palmFrame: HumanFourGroupContours.Frame = {n:handFrame.longitudinal,u:handFrame.across.map((value:number):number=>-value) as HumanCurve.Vector,v:handFrame.normal.map((value:number):number=>-value) as HumanCurve.Vector};
      const palm: HumanPalmContours.Result = HumanPalmContours.build({
        id:"unjoined-proximal-palm-"+side,wristMm:handFrame.originMm,
        frame:palmFrame,
        palmLengthMm:extremities.hands[key].palmLength,handCircumferenceMm:circumference,
        endStationMm:extremities.hands[key].palmLength*HumanPalmRules.maximumObservedFraction,
      });
      for (const patch of palm.patches) patches.push(HumanPatchMesh.build(patch,boundaryRegistry));
      register(hand.supports);
      const groupSupports: HumanFourGroupContours.Supports = {handMm:handFrame.originMm,thumbRootMm:hand.supports.get("thumb_01_"+side)!,thumbSecondMm:hand.supports.get("thumb_02_"+side)!,middleRootMm:hand.supports.get("middle_01_"+side)!,pinkyRootMm:hand.supports.get("pinky_01_"+side)!,indexRootMm:hand.supports.get("index_01_"+side)!};
      const groupFeatures: HumanFourGroupContours.Features = HumanFourGroupContours.proposeFeatures(groupSupports);
      const group: HumanFourGroupContours.Result = HumanFourGroupContours.build({id:"unjoined-four-digit-group-"+side,supports:groupSupports,features:groupFeatures,frame:palmFrame,handCircumferenceMm:circumference,startFraction:HumanFourGroupRules.observedFraction[0],endFraction:HumanFourGroupRules.observedFraction[1]});
      for (const patch of group.patches) patches.push(HumanPatchMesh.build(patch,boundaryRegistry));
      featureConstruction.push({id:group.axis.id,points:Array.from({length:65},(_:unknown,index:number):HumanCurve.Vector=>group.axis.evaluate(index===64?group.axis.end:group.axis.start+(group.axis.end-group.axis.start)*index/64).map((value:number):number=>value/1000) as HumanCurve.Vector)});
      limitations.push(...group.limitations);
      const thumb: HumanThumbContours.Result = HumanThumbContours.build({id:"unjoined-thumb-candidate-"+side,handFrame,rootMm:hand.supports.get("thumb_01_"+side)!,secondMm:hand.supports.get("thumb_02_"+side)!,endMm:hand.supports.get("thumb_03_"+side)!,handCircumferenceMm:circumference});
      for (const patch of thumb.patches) patches.push(HumanPatchMesh.build(patch,boundaryRegistry));
      const terminal: HumanThumbTerminal.Result = HumanThumbTerminal.build({
        id:"thumb-terminal-hypothesis-"+side,handFrame,boundary:thumb.principal[1],
        boundaryJet:(phase:number):HumanThumbContours.Jet=>thumb.jet(thumb.domainMm[1],phase),
        chart:thumb.terminalChart,handCircumferenceMm:circumference,
        reachMm:.3942638482035268*thumb.terminalChart.thumbChordMm,
      });
      regions.push(HumanCurveMesh.build("thumb-terminal-hypothesis-"+side,terminal.family,terminal.outwardSign,64));
      limitations.push(...thumb.limitations,...terminal.limitations,
        "Terminal axial reach uses the common support-chord hypothesis R=0.3942638482035268*thumb01-to-03 chord; scalar source RMS 1.670 mm and held-out maximum 3.239 mm do not identify clinical skin-tip length or source multiple-peak topology");
      for (const digit of hand.families) {
        if (digit.digit === "thumb") continue;
        const port: HumanHandShafts.DistalPort = hand.distalPorts.get(digit.digit)!;
        const reachRatios: Record<HumanDigitRegularJoint.Digit,number> = {index:1.040066961514043,middle:.8404037279566073,ring:.7210319778175478,pinky:1.2511118010936149};
        const joint: HumanDigitRegularJoint.Result = HumanDigitRegularJoint.build({id:"hand-"+side+"-"+digit.digit,digit:digit.digit,port,handCircumferenceMm:circumference,reachMm:reachRatios[digit.digit]*(port.stationMm-port.family.intervals[0]!.startMm)});
        regions.push(HumanCurveMesh.build("hand-" + side + "-" + digit.digit, joint.family, joint.outwardSign));
        limitations.push(...joint.limitations,"The common digit-specific reach/support-projection ratio is a source-conditioned precritical-domain hypothesis, not a clinical tip length or independently validated parameter law");
      }
      limitations.push(...hand.limitations, ...hand.unsupported);
      limitations.push(...palm.limitations,"The proximal palm is an independently generated candidate in the same common hand frame as the finger shafts. Its last common observed station is a support-domain limit, not a certified anatomical principal layer or a wrist/thumb/web attachment");
      limitations.push("Post-branch thumb and a shared-boundary smooth terminal hypothesis are emitted; thumb root, thenar branch, web and source terminal multi-peak topology remain unimplemented");
    }
    if (take("feet") && feet.has(side)) {
      const foot: HumanFootBody.Result = feet.get(side)!.body;
      limitations.push(...foot.limitations, ...foot.unsupported);
      if (joinedFeet)
        limitations.push("Foot and calf consume one actual ankle boundary owner; the complete assembled inspection must establish the absence of the earlier overlapping interiors and assess source fidelity");
      else {
        regions.push(HumanCurveMesh.build("unjoined-foot-candidate-"+side,foot.family,-1));
        limitations.push("The displayed foot body is an independent unjoined candidate at its generated anatomical support. Its proximal interior can overlap the calf; no ankle join, smooth attachment or accepted assembled surface is claimed");
      }
    }
  }
  const completeCoverage: generateAutoMovieHuman.Result["coverage"] = { generated: ["two diagnostic common-q six-chart shoulder candidates with native-role C and retained shafts still unjoined", "whole-vector eight-arc hip-through-chest trunk with an approximate posterior C0-to-G1 witness principal and exact Green centroid axis", "two diagnostic lateral pelvic patches sharing the actual whole-Hip authority and inferred true-quarter traces", "two central external lower-lip-to-mentolabial patches from the shared source-identified lower principal", "retained medial cranial candidates, two common physical-Y posterior hemispheres sharing the actual full upper-cap boundary, and the forehead-through-crown shell", "regular oblique neck tube", "two central upper-eyelid annulus patches, two retained fold-to-brow hood patches, four common central/lateral forehead vector patches and four diagnostic outer-to-crease-to-fold patches sharing the same three-layer eye-fold network", "ear graph, nasal rim and nasolabial construction curves", "eight restricted limb shafts and eight constrained elbow/knee half-domains", ...(extremities.hands === undefined ? [] : ["eight jointly identified non-thumb shafts with open precritical prefixes, two independent proximal-palm candidates, two independent regular four-digit group strips, two independent post-branch thumb candidates and two smooth thumb-terminal hypotheses"]), ...(extremities.feet === undefined ? [] : joinedFeet ? ["two retained foot bodies and four common ankle half-domains"] : ["two independent unjoined foot-body candidates"])], missing: ["shoulder A/B regional attachment and native-C-to-retained-shaft continuation, inner/anterior pelvic branches and lateral-quarter-to-thigh joins", "shoulder collar, neck-to-jaw junction and lateral lower-face skin", "medial forehead attachment, lower posterior-to-neck/ear attachment, remaining face skin, canthal and lower eyelid domains, lid cavities, oral/vermilion sheets and accessories", "wrist transitions", ...(extremities.hands === undefined ? ["hands"] : ["palm-to-group joins and branch junctions, finger roots, webs, thumb roots, non-thumb skin tips and source terminal multi-peak domains"]), ...(extremities.feet === undefined ? ["feet and ankle transitions"] : ["posterior heels, toe webs and toes", ...(joinedFeet ? [] : ["ankle attachment; displayed feet remain independent candidates"])])] };
  const coverage: generateAutoMovieHuman.Result["coverage"] = scope.mode === "full" ? completeCoverage : {
    generated: scope.regions.map((region:generateAutoMovieHuman.GenerationRegion):string=>"Explicit isolated regional observation: "+region),
    missing: [...allRegions.filter((region:generateAutoMovieHuman.GenerationRegion):boolean=>!take(region)).map((region:generateAutoMovieHuman.GenerationRegion):string=>"Outside the explicit observation scope: "+region),...completeCoverage.missing,"Isolated observations do not certify whole-body assembly or cross-region attachment"],
  };
  const model: IAutoMovieModel = { id: scope.mode === "full" ? "parametric-human" : "parametric-human-isolated", name: scope.mode === "full" ? "Parametric Human" : "Parametric Human isolated regions", origin: "generated", asset: null, skeleton: null, body: null, materials: [], parts: [...regions.map((region: HumanCurveMesh.Result): IAutoMovieModel["parts"][number] => region.part), ...patches.map((patch: HumanPatchMesh.Result): IAutoMovieModel["parts"][number] => patch.part)] };
  return {
    status: "partial", generationScope: scope, generationDependencies, model, construction: [...regions.flatMap((region: HumanCurveMesh.Result): HumanCurveMesh.Line[] => region.construction), ...patches.flatMap((patch: HumanPatchMesh.Result): HumanCurveMesh.Line[] => patch.construction), ...featureConstruction], skeleton: { ...skeleton, supports },
    diagnostics: { schema: "human-shoulder-numeric-diagnostics-v1", headPosterior:headRegion?.diagnostics, shoulder: (shoulders?.shoulders ?? []).map((shoulder: HumanShoulderAssembly.Result["shoulders"][number]): generateAutoMovieHuman.ShoulderDiagnostics => ({
      patchIds: shoulder.skin.patches.map((patch: HumanSurface.Patch): string => patch.id),
      endpointAuthorities: shoulder.graph.endpointAuthorities,
      cornerEnclosure: shoulder.skin.cornerEnclosure,
      transport: shoulder.skin.endpointTransport,
    })) },
    coverage,
    limitations: [...limitations, "The generated regions have open unresolved joins; no source surface fills their omitted domains", "Regional shape coefficients describe shared observations; independent unobserved parameter interactions remain unverified"],
  };

  /** One unchanged head assembly, invoked only before a requested head emission. */
  interface HeadRegion {
    /** Existing lower-face and retained cranial patches before the shared limb owner. */
    beforeJoints: HumanSurface.Patch[];
    /** Existing eyelid, upper-face and eye-fold patches after the shared limb owner. */
    afterJoints: HumanSurface.Patch[];
    /** Same generating head feature authorities, never source copies. */
    curves: HumanSurface.Boundary[];
    /** Same lower-eye and lower-face feature authorities in the original append order. */
    extraCurves: HumanSurface.Boundary[];
    /** Unchanged generated upper cranial shell and its copied construction. */
    shell: HumanCurveMesh.Result;
    /** Entire current posterior numeric diagnostic type, only when head is selected. */
    diagnostics: HumanPosteriorIntegration.Diagnostics;
    /** Original head-specific omissions and continuity qualifications. */
    limitations: string[];
  }
  /** Build the existing complete head from its unchanged shared source rules. */
  function buildHead(): HeadRegion {
  const headFrame: HumanHeadFrame.Result = HumanHeadFrame.build(head, skeleton);
  const cranial: HumanHead.Result = HumanHead.build(head, skeleton, undefined, headFrame);
  const skull: HumanCurveFamily.Family = HumanCurveFamily.build(cranial.sections, cranial.endpointDerivatives);
  const mouth: HumanMouthFeatures.Result = HumanMouthFeatures.build(head, skeleton, headFrame);
  const lowerFace: HumanLowerFaceSurface.Result = HumanLowerFaceSurface.build(mouth.lowerCentral);
  const eyes: HumanFaceFeatures.Result = HumanFaceFeatures.build(head, skeleton, supplement?.face.eyePair, headFrame);
  const eyelids: HumanEyelidAnnulus.Result = HumanEyelidAnnulus.build(eyes);
  const ears: HumanEarFeatures.Result = HumanEarFeatures.build(head, skeleton, headFrame);
  const nose: HumanNoseFeatures.Result = HumanNoseFeatures.build(head, headFrame, mouth);
  const upperFace: HumanUpperFaceFeatures.Result = HumanUpperFaceFeatures.build(headFrame, eyes);
  const cranialDomain: HumanCranialDomain.Result = HumanCranialDomain.build(skull,eyes,1);
  const upperSkin: HumanUpperFaceSurface.Result = HumanUpperFaceSurface.build(headFrame,eyes,upperFace,cranialDomain.foreheads,1);
  const foreheadSide: HumanForeheadSideNetwork.Result = HumanForeheadSideNetwork.build(upperSkin.browPorts.map((brow: HumanUpperFaceSurface.BrowPort): HumanForeheadSideNetwork.Input => {
    const opening: typeof eyes.openings[number] | undefined = eyes.openings.find((value: typeof eyes.openings[number]): boolean => value.upper.side === brow.side);
    const forehead: HumanCranialDomain.Forehead | undefined = cranialDomain.foreheads.find((value: HumanCranialDomain.Forehead): boolean => value.side === brow.side);
    if (opening === undefined || forehead === undefined) throw new Error("The forehead-side domain lacks its existing common eye or cap owner");
    const start: HumanCurve.Vector = opening.upper.evaluate(0), end: HumanCurve.Vector = opening.upper.evaluate(1);
    const chord: HumanCurve.Vector = end.map((value: number, axis: number): number => value-start[axis]!) as HumanCurve.Vector;
    const lengthMm: number = Math.hypot(...chord);
    return {side:brow.side,normal:chord.map((value: number): number => value/lengthMm) as HumanCurve.Vector,lengthMm,brow,
      forehead:{boundary:forehead.boundary,transverseUnit:"meridian-station-mm",transverse:(u: number): {derivative: HumanCurve.Vector;derivativeU: HumanCurve.Vector} => {
        const value: ReturnType<HumanCranialDomain.Forehead["transverse"]> = forehead.transverse(u);
        return {derivative:value.derivativeS,derivativeU:value.derivativeSU};
      }}};
  }),{outerYPowers:true});
  const posteriorHead: HumanPosteriorIntegration.Result = HumanPosteriorIntegration.build({frame:headFrame,eyes,cranial:cranialDomain,forehead:foreheadSide,defaultPatchDepth:patchDepth});
  cranialDomain.retained = posteriorHead.posterior.retained;
  cranialDomain.upperPhases = posteriorHead.upperPhases;
  upperSkin.patches = [...upperSkin.patches.filter((patch: HumanSurface.Patch): boolean => !patch.id.endsWith(".brow-to-forehead.central")),...posteriorHead.posterior.fronts];
  upperSkin.boundaries = upperSkin.boundaries.filter((curve: HumanSurface.Boundary): boolean => !curve.id.includes(".brow-to-forehead.central"));
  for (const curve of posteriorHead.boundaries) {
    const existing: HumanSurface.Boundary | undefined = upperSkin.boundaries.find((candidate: HumanSurface.Boundary): boolean => candidate.id === curve.id);
    if (existing === undefined) upperSkin.boundaries.push(curve);
    else if (existing !== curve) throw new Error("The forehead-side assembly has multiple authorities for " + curve.id);
  }
  const lowerEye: HumanLowerEyeSurface.Result = HumanLowerEyeSurface.build(eyes,eyelids.outerPorts,upperSkin.foldPorts);
  const eyeFoldNetwork: HumanEyeFoldNetwork.Result = HumanEyeFoldNetwork.build(eyelids,lowerEye,upperSkin);
  const facialArcs: Array<HumanMouthFeatures.Curve | HumanFaceFeatures.Curve> = [...eyes.curves, ...Object.values(mouth.curves).flatMap((pair: HumanMouthFeatures.Result["curves"]["left"]): HumanMouthFeatures.Curve[] => Object.values(pair))];
    return {beforeJoints:[...lowerFace.patches,...cranialDomain.retained],afterJoints:[...eyelids.patches,...upperSkin.patches,...eyeFoldNetwork.additionalDiagnosticPatches],
      curves:[...upperSkin.boundaries,...eyelids.boundaries,...ears.ears.flatMap((ear:HumanEarFeatures.Ear):HumanSurface.Boundary[]=>ear.graph.paths),...Object.values(nose.nostrils),...Object.values(nose.nasolabial),...upperFace.curves,...facialArcs.map((curve:HumanMouthFeatures.Curve|HumanFaceFeatures.Curve):HumanSurface.Boundary=>({id:curve.id,unit:"normalized",start:0,end:1,evaluate:curve.evaluate,derivative:curve.derivative}))],
      diagnostics:posteriorHead.diagnostics,extraCurves:[...lowerEye.boundaries,...lowerFace.boundaries],shell:HumanCurveMesh.build("cranial-shell",cranialDomain.upper,1,96,3,cranialDomain.upperPhases),
      limitations:[...cranial.limitations,...cranialDomain.limitations,...mouth.limitations,...lowerFace.limitations,...eyes.limitations,...eyelids.limitations,...upperSkin.limitations,...ears.limitations,...nose.limitations,...upperFace.limitations,...lowerEye.limitations,...eyeFoldNetwork.limitations,...foreheadSide.limitations,...posteriorHead.posterior.limitations,...posteriorHead.posterior.posterior.limitations,
        "The failed perioral diamond, unqualified equal-parameter lid strips and ear-overhang radial posterior candidate are excluded; their surrounding skin remains unimplemented until source-corresponding charts replace them",
        "The earlier brow-to-forehead central candidate is superseded by the common central/lateral vector field; its unused patch side curves are not emitted. Existing fold-to-brow hood and medial cranial candidates retain their neighbor defects; both old posterior cranial candidates are replaced by the common physical-Y posterior halves"]};
  }
  function register(additions: ReadonlyMap<string, HumanCurve.Vector>): void {
    for (const [name, point] of additions) {
      if (supports.has(name)) throw new Error("Two regions claim one generated support: " + name);
      supports.set(name, point);
    }
  }
}

/** Generated geometry, its actual construction and explicit domain coverage. */
export namespace generateAutoMovieHuman {
  /** Existing regional observation addresses; these introduce no physical q. */
  export type GenerationRegion = "head"|"neck"|"shoulder"|"trunk"|"pelvis"|"limbs"|"hands"|"feet";
  /** Default complete assembly; failures remain observable and are never omitted. */
  export interface FullGenerationScope {
    /** Run the existing complete regional assembly. */
    mode:"full";
  }
  /** Explicit observation selection made before any regional builder runs. */
  export interface IsolatedGenerationScope {
    /** Separate partial observation, never an automatic full-scene fallback. */
    mode:"isolated-regions";
    /** Nonempty unique requested skins/construction; common dependencies are explicit. */
    regions:readonly GenerationRegion[];
  }
  /** Selection is separate from existing body/head/extremity physical parameters. */
  export type GenerationScope = FullGenerationScope|IsolatedGenerationScope;


  /** Independent existing physical hand and foot dimensions. Omission declares
   * the corresponding domain absent. Source-geometric proxy experiments must
   * label their distinct acquisition meaning instead of claiming clinical input.
   */
  export interface ExtremityDimensions {
    /** Independently supplied left and right hand lengths and breadth. */
    hands?: IAutoMovieHumanPair<HumanHandShafts.Dimensions>;
    /** Independently supplied left and right foot lengths, breadth and ankle height. */
    feet?: IAutoMovieHumanPair<HumanFootBody.Dimensions>;
    /** Explicit research mode. The default displays unjoined regional foot
     * candidates. Joined mode currently refuses the four observed inputs where
     * its bisector cut exits the calf domain; it never silently falls back.
     */
    footAssembly?: "independent" | "joined";
  }

  /** Plain numeric evidence from the same successful shoulder skin authorities.
   * This contains no curve functions, source geometry, copied mesh or q inputs.
   */
  export interface ShoulderDiagnostics {
    /** Exact model part addresses consuming this shoulder authority. */
    patchIds: string[];

    /** Original physical tangent laws and explicit common C1 owner selection. */
    endpointAuthorities: HumanShoulderAssembly.Result["shoulders"][number]["graph"]["endpointAuthorities"];

    /** Same finite sector audits, inside jets, corners and endpoint fields. */
    cornerEnclosure: HumanShoulderAssembly.Result["shoulders"][number]["skin"]["cornerEnclosure"];

    /** Actual endpoint constraint changes, separate from source fitting error. */
    transport: HumanShoulderAssembly.Result["shoulders"][number]["skin"]["endpointTransport"];
  }

  /** Bounded function-free evidence from a successful generation only. */
  export interface Diagnostics {
    /** Stable numeric payload identity; failure diagnostics use a separate path. */
    schema: "human-shoulder-numeric-diagnostics-v1";

    /** Requested shoulders by actual model patch addresses; empty outside scope. */
    shoulder: ShoulderDiagnostics[];

    /** Entire actual common posterior evidence; absent outside an explicit head scope. */
    headPosterior?: HumanPosteriorIntegration.Diagnostics;
  }

  /** Caller-owned result; the model contains only independently generated parts. */
  export interface Result {
    /** Partial coverage is explicit and independent of command success. */
    status: "partial";

    /** Explicit default/full or isolated observation identity, preserved in every publication. */
    generationScope: GenerationScope;

    /** Common function/boundary dependencies whose unrequested skins are not emitted. */
    generationDependencies: string[];

    /** Generated skin in ordinary model metres. */
    model: IAutoMovieModel;

    /** The same curve authority sampled for visible construction, in metres. */
    construction: HumanCurveMesh.Line[];

    /** The sole generated geometric support hierarchy. */
    skeleton: HumanSkeleton.Result;

    /** Produced and unresolved physical domains, without hidden fallback parts. */
    coverage: { generated: string[]; missing: string[] };

    /** Same-authority numeric records; unavailable if generation throws. */
    diagnostics: Diagnostics;

    /** Unsupported inputs, joins and inference limits. */
    limitations: string[];
  }
}
