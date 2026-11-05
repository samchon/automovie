import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import { calibratedPaperGrasps } from "./calibratedPaperGrasps";
import type { createHumanPerformer } from "./createHumanPerformer";
import { meshSurfacePoint } from "./meshSurfacePoint";
import { measurePaperContact } from "./measurePaperContact";
import { measurePaperSkin } from "./measurePaperSkin";
import { inspectGraspModel } from "./inspectGraspModel";
import { paperGripThickness } from "./paperGripThickness";

/** Original material address with an explicit anatomical contact role. */
type Witness={bone:AutoMovieHumanRigControls.Joint;localPoint:[number,number,number];normal:THREE.Vector3;segmentFraction:number;palmarAgreement:number;siteAgreement:number;siteRole:"radial-side"|"palmar-pulp";radialAgreement:number;triangle:number};
/** Retained material observations, not replacement mesh points. */
type MaterialRecord={bone:string;local:number[];normal:number[];segmentFraction:number;palmarAgreement:number;siteRole:string;siteAgreement:number;radialAgreement:number;triangle:number};
/** One complete replay result; a failed original request stays a failed request. */
type Attempt={material:{index:MaterialRecord;thumb:MaterialRecord};kind:string;orientation:number;constraints:Record<string,boolean>;reasons:string[];measured:ReturnType<typeof measurePaperContact>;rawGap:number;margin:number;normalDot:number;initialPose:IAutoMovieHumanPose;pose:IAutoMovieHumanPose;fit:{error:number;iterations:number;physicalTarget:number[];directionProbe:{purpose:string;local:number[];target:number[]};request:AutoMovieHumanClinicalIk.IRequest;constraintValues:AutoMovieHumanClinicalIk.IResult["constraintValues"];constraintsSatisfied:boolean;probes:{purpose:string;bone:string;local:number[];target:number[]}[]};paperOutward:number;centre:number[];rotation:number[];source:{cast:string;resultSha256:string;bindSha256:string;meshSha256:string};solid:ReturnType<typeof measurePaperSkin>;identity:ReturnType<typeof inspectGraspModel>;retargeted:boolean;originalCalibrationRequest:AutoMovieHumanClinicalIk.IRequest;materialDifferences:{bone:string;expectedTriangle:number;actualTriangle:number;pointDistance:number;normalDistance:number}[]};
/** Fixed Hand-local paper carrier plus the actual applied complete finger pose. */
type Prepared={hand:NonNullable<NonNullable<IAutoMovieHumanPose["arms"]>["left"]["hand"]>;index:Witness;thumb:Witness;axisLocal:THREE.Vector3;xLocal:THREE.Vector3;centreLocal:THREE.Vector3;kind:string;valid:boolean;error:number;margin:number;normalDot:number;report:Attempt[]};
/**
 * Replay measured authored finger controls on the exact model, then remeasure all physical contacts.
 * @evidence contracts/common.md#implementation-and-ownership The four retained control poses and Hand-local prop frames are measured motion data. Public SHA256 records both original and actual model arrays and every component difference; canonical parameters, same-factory rest coherence and required-hand topology determine whether this actual model can re-enter validation. Original source rays reconstruct declared material roles; captured coordinates diagnose identity drift without replacing current skin. A changed compatible model retargets the same complete nine-control pose to its own actual material targets and the retained Hand-local prop frame before a new physical validation; no Vite success is transferred to Node. Carina honestly uses intermediate radial index skin against thumb pulp; Harry uses distal palmar skin. One public nine-channel request retains its two original targets and all eight native finite-face/normal intervals. Actual triangles, both material faces, signed closed-solid probes, ROM and ray ambiguity are evaluated independently after the fit. No failed result recentres the fixed paper. No source skin, ROM or tolerance changes. Original failed searches remain historical failures.
 * @evidence contracts/common.md#authoring-interface Supply the fixed commissioned actor and side before scene placement. Records full expected/actual identity and throws on incoherent factory, changed canonical parameters or incompatible required-hand topology. Original-model requests and each retargeted actual request remain separate. Returns the complete hand pose and fixed Hand-local prop frame; valid is only this static finite grasp, never later arm reach or film acceptance. Caller remeasures transported contacts and supports. Actual factory raw source identity is retained by source bookends/CPU checks; runtime checks generated model data instead of claiming a bundled function is its raw source. Owned temporary geometry retires and the actor returns to neutral.
 */
export function preparePaperGrasp(actor:ReturnType<typeof createHumanPerformer>,side:"left"|"right"):Prepared {
  const identity:ReturnType<typeof inspectGraspModel>=inspectGraspModel(actor,side);
  const cast:"carina"|"harry"=identity.cast;
  const data:typeof calibratedPaperGrasps.entries[string]=calibratedPaperGrasps.entries[cast+"-"+side]!;
  const model:typeof calibratedPaperGrasps.models.carina=calibratedPaperGrasps.models[cast];
  const materialDifferences:{bone:string;expectedTriangle:number;actualTriangle:number;pointDistance:number;normalDistance:number}[]=[];
  if(!identity.applicable)throw new Error("Incompatible actual grasp factory: "+JSON.stringify(identity));
  /** Resolve the source skeleton's immutable body coordinates. */
  const source:(name:string)=>THREE.Vector3=(name:string):THREE.Vector3=>{
    const bone:AutoMovieHumanSkeleton.IBone|undefined=actor.neutral.bones.find((b:AutoMovieHumanSkeleton.IBone):boolean=>b.bone===side+name);
    if(!bone)throw new Error("Missing source hand joint "+name);return new THREE.Vector3(...bone.position);
  };
  const forward:THREE.Vector3=source("MiddleProximal").sub(source("Hand")).normalize();
  const radial:THREE.Vector3=source("IndexProximal").sub(source("LittleProximal")).normalize();
  const palmar:THREE.Vector3=radial.clone().cross(forward).normalize().multiplyScalar(side==="left"?1:-1);
  /** Re-address true radial or palmar material from the actual source triangles. */
  const patch:(kind:"index"|"thumb")=>Witness=(kind:"index"|"thumb"):Witness=>{
    const recorded:typeof data.materials.index=data.materials[kind];
    const bone:AutoMovieHumanRigControls.Joint=AutoMovieHumanRigControls.joint(recorded.bone);
    const rest:AutoMovieHumanSkeleton.IBone=actor.neutral.bones.find((b:AutoMovieHumanSkeleton.IBone):boolean=>b.bone===bone)!;
    const end:[number,number,number]=rest.tip??actor.neutral.bones.find((b:AutoMovieHumanSkeleton.IBone):boolean=>b.parent===bone)!.position;
    const span:THREE.Vector3=new THREE.Vector3(...end).sub(new THREE.Vector3(...rest.position));
    const axis:THREE.Vector3=span.clone().normalize();
    const volar:THREE.Vector3=palmar.clone().addScaledVector(axis,-palmar.dot(axis)).normalize();
    const radialSide:THREE.Vector3=radial.clone().addScaledVector(axis,-radial.dot(axis)).normalize();
    const site:THREE.Vector3=recorded.siteRole==="radial-side"?radialSide:volar;
    const direction:THREE.Vector3=site.clone().applyAxisAngle(axis,recorded.rayDegrees*Math.PI/180);
    const mesh:THREE.Mesh=actor.drawing.parts.get(bone)!;
    const hit:ReturnType<typeof meshSurfacePoint>=meshSurfacePoint(mesh,span.clone().multiplyScalar(recorded.fraction).addScaledVector(direction,.06),direction.clone().negate());
    materialDifferences.push({bone,expectedTriangle:recorded.triangle,actualTriangle:hit.triangle,pointDistance:hit.point.distanceTo(new THREE.Vector3(...recorded.localPoint)),normalDistance:hit.normal.distanceTo(new THREE.Vector3(...recorded.normal))});
    return {bone,localPoint:hit.point.toArray(),normal:hit.normal,triangle:hit.triangle,segmentFraction:hit.point.dot(axis)/span.length(),palmarAgreement:hit.normal.dot(volar),radialAgreement:hit.normal.dot(radialSide),siteAgreement:hit.normal.dot(site),siteRole:recorded.siteRole};
  };
  const index:Witness=patch("index");const thumb:Witness=patch("thumb");
  const base:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.012,.008,paperGripThickness));
  try {
    const initialPose:IAutoMovieHumanPose=structuredClone(data.pose);
    let request:AutoMovieHumanClinicalIk.IRequest=structuredClone(data.request);
    if(!identity.matchingCalibration) {
      // Retarget these authored controls to THIS coherent original model, without a new search.
      // Source-valid pose targets are frozen before IK, not recentered from failed output.
      const initial:AutoMovieHumanSkeleton.IOutput=actor.pose(initialPose);
      const at:AutoMovieHumanSkeleton.IPlacement=initial.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===side+"Hand")!;
      const hq:THREE.Quaternion=new THREE.Quaternion(...at.rotation);
      const centre:THREE.Vector3=new THREE.Vector3(...data.paperFrame.handLocalOrigin).applyQuaternion(hq).add(new THREE.Vector3(...at.position));
      const rotation:THREE.Quaternion=hq.clone().multiply(new THREE.Quaternion(...data.paperFrame.handLocalRotation));
      const axis:THREE.Vector3=new THREE.Vector3(0,0,1).applyQuaternion(rotation);const x:THREE.Vector3=new THREE.Vector3(1,0,0).applyQuaternion(rotation);const y:THREE.Vector3=new THREE.Vector3(0,1,0).applyQuaternion(rotation);
      const handPoint:(p:THREE.Vector3)=>AutoMovieHumanClinicalIk.IBonePoint=(p:THREE.Vector3):AutoMovieHumanClinicalIk.IBonePoint=>({bone:side==="left"?"leftHand":"rightHand",localPoint:p.clone().sub(new THREE.Vector3(...at.position)).applyQuaternion(hq.clone().invert()).toArray()});
      const targets:AutoMovieHumanClinicalIk.ITarget[]=[];const intervals:AutoMovieHumanClinicalIk.IConstraint[]=[];
      for(const [w,sign] of [[index,1],[thumb,-1]] as const) {
        targets.push({bone:w.bone,localPoint:[...w.localPoint],position:actor.point(w.bone,w.localPoint).toArray()});
        for(const [normal,lineAxis,minimum,maximum] of [[axis,x,sign === 1 ? 0.0004 : -0.0034,sign === 1 ? 0.0034 : -0.0004],[x,y,-.006,.006],[y,x,-.004,.004]] as const)intervals.push({kind:"line-offset",point:{bone:w.bone,localPoint:[...w.localPoint]},line:{origin:handPoint(centre),end:handPoint(centre.clone().addScaledVector(lineAxis,.01))},normal:normal.toArray(),minimum,maximum});
        const tangent:THREE.Vector3=w.normal.clone().cross(Math.abs(w.normal.x)<.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0)).normalize();
        intervals.push({kind:"line-offset",point:{bone:w.bone,localPoint:new THREE.Vector3(...w.localPoint).addScaledVector(w.normal,.01).toArray()},line:{origin:{bone:w.bone,localPoint:[...w.localPoint]},end:{bone:w.bone,localPoint:new THREE.Vector3(...w.localPoint).addScaledVector(tangent,.01).toArray()}},normal:axis.toArray(),...(sign===1?{maximum:-.008}:{minimum:.008})});
      }
      request={channels:[...AutoMovieHumanRigControls.chain({region:"finger",side,digit:"index"}),...AutoMovieHumanRigControls.chain({region:"finger",side,digit:"thumb"})],targets,constraints:intervals,iterations:16,tolerance:.0007};
    }
    const fitted:AutoMovieHumanClinicalIk.IResult=AutoMovieHumanClinicalIk.solve(actor.evaluate,initialPose,request);
    const output:AutoMovieHumanSkeleton.IOutput=actor.pose(fitted.pose);
    const hand:AutoMovieHumanSkeleton.IPlacement=output.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===side+"Hand")!;
    const handQ:THREE.Quaternion=new THREE.Quaternion(...hand.rotation);
    const centreLocal:THREE.Vector3=new THREE.Vector3(...data.paperFrame.handLocalOrigin);
    const localQ:THREE.Quaternion=new THREE.Quaternion(...data.paperFrame.handLocalRotation);
    const centre:THREE.Vector3=centreLocal.clone().applyQuaternion(handQ).add(new THREE.Vector3(...hand.position));
    const rotation:THREE.Quaternion=handQ.clone().multiply(localQ);
    const axis:THREE.Vector3=new THREE.Vector3(0,0,1).applyQuaternion(rotation);
    const ip:THREE.Vector3=actor.point(index.bone,index.localPoint);const tp:THREE.Vector3=actor.point(thumb.bone,thumb.localPoint);
    const normal:(w:Witness)=>THREE.Vector3=(w:Witness):THREE.Vector3=>w.normal.clone().applyQuaternion(new THREE.Quaternion(...output.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===w.bone)!.rotation));
    const ni:THREE.Vector3=normal(index);const nt:THREE.Vector3=normal(thumb);
    base.position.copy(centre);base.quaternion.copy(rotation);
    const skin:THREE.Mesh[]=[...actor.drawing.parts].filter(([id]):boolean=>id.startsWith(side)&&/Hand|Index|Thumb|Middle|Ring|Little/.test(id)).map(([,mesh]):THREE.Mesh=>mesh);
    const measured:ReturnType<typeof measurePaperContact>=measurePaperContact(base,{index:ip,thumb:tp,indexNormal:ni,thumbNormal:nt},skin);
    const solid:ReturnType<typeof measurePaperSkin>=measurePaperSkin(base,skin);
    const margin:number=ip.clone().sub(tp).dot(axis);const normalDot:number=ni.dot(nt);
    const outward:THREE.Vector3=centre.clone().sub(new THREE.Vector3(...hand.position));outward.addScaledVector(axis,-outward.dot(axis)).normalize();
    const paperOutward:number=new THREE.Vector3(0,1,0).applyQuaternion(rotation).dot(outward);
    const constraints:Record<string,boolean>={nativeOriginalTargetsReached:fitted.error<=.0007,nativeFiniteFaceIntervals:fitted.constraintsSatisfied,paperLongAxisOutward:paperOutward>.5,originalSkinCoverage:measured.coverageComplete,anatomicalSourcePatches:[index,thumb].every((w:Witness):boolean=>w.segmentFraction>=.65&&w.segmentFraction<=.85&&w.siteAgreement>.25),sameActorHandSide:index.bone.startsWith(side)&&thumb.bone.startsWith(side),finiteFaceFootprints:measured.withinFaces,actualFaceDistances:measured.frontError<=.003&&measured.backError<=.003,opposedOrientedPatches:normalDot<-.25&&measured.normalAlignment.every((n:number):boolean=>n>.25),opposingMaterialFaceSides:margin>=paperGripThickness-1e-6,noOriginalHandInteriorIntersection:measured.intersections===0&&measured.containments===0,actualFiniteGrasp:measured.valid,originalRom:output.clamped.length===0,independentOriginalSolidsOutside:solid.independentOutside,parityRayUnambiguous:solid.coverageComplete};
    const reasons:string[]=Object.entries(constraints).filter(([,ok]):boolean=>!ok).map(([key]):string=>key);
    const material:(w:Witness)=>MaterialRecord=(w:Witness):MaterialRecord=>({bone:w.bone,local:w.localPoint,normal:w.normal.toArray(),segmentFraction:w.segmentFraction,palmarAgreement:w.palmarAgreement,radialAgreement:w.radialAgreement,siteAgreement:w.siteAgreement,siteRole:w.siteRole,triangle:w.triangle});
    const record:Attempt={material:{index:material(index),thumb:material(thumb)},kind:data.construction,orientation:0,constraints,reasons,measured,rawGap:ip.distanceTo(tp),margin,normalDot,initialPose,pose:fitted.pose,fit:{error:fitted.error,iterations:fitted.iterations,physicalTarget:request.targets[1]!.position,directionProbe:{purpose:"auxiliary normal direction; not a material contact",local:new THREE.Vector3(...thumb.localPoint).addScaledVector(thumb.normal,.01).toArray(),target:new THREE.Vector3(...request.targets[1]!.position).addScaledVector(axis,.01).toArray()},request,constraintValues:fitted.constraintValues,constraintsSatisfied:fitted.constraintsSatisfied,probes:[]},paperOutward,centre:centre.toArray(),rotation:rotation.toArray(),source:{cast,resultSha256:data.sourceSha256,bindSha256:model.bindSha256,meshSha256:model.meshSha256},solid,identity,retargeted:!identity.matchingCalibration,originalCalibrationRequest:structuredClone(data.request),materialDifferences};
    return {hand:structuredClone(fitted.pose.arms?.[side].hand??{}),index,thumb,axisLocal:new THREE.Vector3(0,0,1).applyQuaternion(localQ),xLocal:new THREE.Vector3(1,0,0).applyQuaternion(localQ),centreLocal,kind:data.construction,valid:reasons.length===0,error:Math.max(measured.frontError,measured.backError),margin,normalDot,report:[record]};
  } finally {base.geometry.dispose();(base.material as THREE.Material).dispose();actor.pose({});}
}
