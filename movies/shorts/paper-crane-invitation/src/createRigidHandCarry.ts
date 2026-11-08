import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import type { createHumanPerformer } from "./createHumanPerformer";

type Material = AutoMovieHumanClinicalIk.IBonePoint & {localPoint:[number,number,number]};

/**
 * Carry a fixed functional hand pose by real material points and explicit orientation probes.
 * @evidence contracts/common.md#implementation-and-ownership Public arm and wrist IK moves the original actor with three original skin witnesses plus two explicitly auxiliary 50 mm frame-direction probes on Hand. All five targets describe one rigid reference frame, so the goal preserves their measured spacing. The named arm chain deliberately excludes wrist controls; this fit explicitly adds both registered wrist channels while retaining all fingers. Actual skin contact/clearance stays independently inspected. Probes are orientation constraints, never contact substitutes. No vertex or solver limit changes; one sixteen-update solve retains residuals and clamps.
 * @evidence contracts/common.md#authoring-interface Supply a fixed actor/side, unclamped reference finger pose, three noncollinear original material offsets and its body-frame origin/unit quaternion. fit accepts the same fixed fingers in a complete pose and a finite world frame, retaining root/legs and changing only the recorded public arm/wrist channels. It applies the complete returned FK, including garment updates. The copied record belongs to this actor/model; it is not contact or balance acceptance. No native resource is acquired.
 */
export function createRigidHandCarry(actor: ReturnType<typeof createHumanPerformer>,side:"left"|"right",referencePose:IAutoMovieHumanPose,referenceFrame:{origin:THREE.Vector3;rotation:THREE.Quaternion},materials:readonly[Material,Material,Material]): {fit:(pose:IAutoMovieHumanPose,origin:THREE.Vector3,rotation:THREE.Quaternion)=>AutoMovieHumanClinicalIk.IResult;record:{channels:string[];materials:Material[];auxiliary:{purpose:string;bone:string;localPoint:number[]}[];referenceOrigin:number[];referenceRotation:number[]}} {
  const reference: AutoMovieHumanSkeleton.IOutput=actor.evaluate(referencePose);
  if(reference.clamped.length)throw new Error("Rigid carry reference must retain original ROM");
  const read: (point:Material)=>THREE.Vector3=(point:Material):THREE.Vector3=>{
    const at:AutoMovieHumanSkeleton.IPlacement|undefined=reference.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===point.bone);
    if(!at||!point.bone.startsWith(side)||!point.localPoint.every(Number.isFinite))throw new Error("Rigid carry requires this actor's real material offsets");
    return new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...at.rotation)).add(new THREE.Vector3(...at.position));
  };
  const positions:THREE.Vector3[]=materials.map(read);
  if(positions[1]!.clone().sub(positions[0]!).cross(positions[2]!.clone().sub(positions[0]!)).lengthSq()<1e-16)throw new Error("Rigid carry material triangle is degenerate");
  const hand:AutoMovieHumanSkeleton.IPlacement|undefined=reference.posed.find((p:AutoMovieHumanSkeleton.IPlacement):boolean=>p.bone===side+"Hand");
  if(!hand||Math.abs(referenceFrame.rotation.lengthSq()-1)>1e-6||![...referenceFrame.origin.toArray(),...referenceFrame.rotation.toArray()].every(Number.isFinite))throw new Error("Invalid rigid carry reference frame");
  const inverse:THREE.Quaternion=referenceFrame.rotation.clone().invert();
  const toLocal:(p:THREE.Vector3)=>THREE.Vector3=(p:THREE.Vector3):THREE.Vector3=>p.clone().sub(referenceFrame.origin).applyQuaternion(inverse);
  const physical:Material[]=materials.map((p:Material):Material=>({bone:p.bone,localPoint:[p.localPoint[0],p.localPoint[1],p.localPoint[2]]}));
  const localFrame:THREE.Vector3[]=positions.map(toLocal);
  const handInverse:THREE.Quaternion=new THREE.Quaternion(...hand.rotation).invert();
  const auxiliary:Material[]=[];
  for(const axis of [new THREE.Vector3(0.05,0,0),new THREE.Vector3(0,0.05,0)]) {
    const body:THREE.Vector3=axis.clone().applyQuaternion(referenceFrame.rotation).add(referenceFrame.origin);
    auxiliary.push({bone:side==="left"?"leftHand":"rightHand",localPoint:body.sub(new THREE.Vector3(...hand.position)).applyQuaternion(handInverse).toArray()});
    localFrame.push(axis);
  }
  const all:Material[]=[...physical,...auxiliary];
  const channels:AutoMovieHumanRigControls.DegreeChannel[]=[...AutoMovieHumanRigControls.chain({region:"arm",side}),AutoMovieHumanRigControls.channel("arms."+side+".wrist.flexion"),AutoMovieHumanRigControls.channel("arms."+side+".wrist.radialDeviation")];
  return {
    record:{channels:[...channels],materials:structuredClone(physical),auxiliary:auxiliary.map((p:Material)=>({purpose:"orientation-only frame direction; not skin contact",bone:p.bone,localPoint:[...p.localPoint]})),referenceOrigin:referenceFrame.origin.toArray(),referenceRotation:referenceFrame.rotation.toArray()},
    fit(pose:IAutoMovieHumanPose,origin:THREE.Vector3,rotation:THREE.Quaternion):AutoMovieHumanClinicalIk.IResult {
      if(![...origin.toArray(),...rotation.toArray()].every(Number.isFinite)||Math.abs(rotation.lengthSq()-1)>1e-6)throw new Error("Rigid carry requires a finite world frame");
      actor.object.updateWorldMatrix(true,false);
      const targets:AutoMovieHumanClinicalIk.ITarget[]=all.map((point:Material,i:number):AutoMovieHumanClinicalIk.ITarget=>({bone:point.bone,localPoint:[point.localPoint[0],point.localPoint[1],point.localPoint[2]],position:actor.object.worldToLocal(localFrame[i]!.clone().applyQuaternion(rotation).add(origin)).toArray()}));
      const result:AutoMovieHumanClinicalIk.IResult=AutoMovieHumanClinicalIk.solve(actor.evaluate,pose,{channels,targets,iterations:16,tolerance:0.003});
      actor.pose(result.pose);
      return result;
    }
  };
}
