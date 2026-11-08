import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import type { createHumanPerformer } from "./createHumanPerformer";

/**
 * Fit one original material point and its normal without prescribing free bank.
 * @evidence contracts/common.md#implementation-and-ownership Public arm/wrist IK fits one original bone-local material point. A directed palm uses a separate80mm normal-direction target. A unilateral push can instead use a10mm auxiliary line-offset interval, expressing its actual inward-normal cosine cone without demanding unnecessary exact parallel alignment. Its perpendicular source tangent makes the line offset exactly the transported source-normal projection; the fixed goal normal is converted once to evaluator coordinates. Neither auxiliary is skin. Fingers, other arm, legs, root, original skin and ROM remain unchanged. Per-call numerical precision is explicit; physical contact admission remains with the consumer.
 * @evidence contracts/common.md#authoring-interface Supply the live placed actor, authored pose, side, original material and finite world point/unit normal. Optional normalMinimum is a positive cosine through1 and selects the native cone interval; omission requests the directed normal. Optional positive metre tolerance defaults3mm and remains bounded to16 updates. Returns full public request/result plus actual point/normal residuals. A push may need tighter target precision than its3mm face allowance because the intended stand-off also consumes that allowance. The caller still proves finite receiving faces, all original solids and custody; neither native residual nor cone feasibility proves contact.
 */
export function fitHumanSurfaceContact(actor:ReturnType<typeof createHumanPerformer>,pose:IAutoMovieHumanPose,side:"left"|"right",material:{bone:string;point:[number,number,number];normal:[number,number,number]},goal:{point:THREE.Vector3;normal:THREE.Vector3;normalMinimum?:number;tolerance?:number}):{
  result:AutoMovieHumanClinicalIk.IResult;request:AutoMovieHumanClinicalIk.IRequest;
  point:THREE.Vector3;normal:THREE.Vector3;positionError:number;normalError:number;
} {
  const localNormal:THREE.Vector3=new THREE.Vector3(...material.normal);
  if(!material.bone.startsWith(side)||![...material.point,...material.normal,...goal.point.toArray(),...goal.normal.toArray()].every(Number.isFinite)||Math.abs(localNormal.length()-1)>1e-6||Math.abs(goal.normal.length()-1)>1e-6)throw new Error("Surface fit requires this side's original material and finite unit normals");
  actor.object.updateWorldMatrix(true,false);
  const request:AutoMovieHumanClinicalIk.IRequest={channels:[...AutoMovieHumanRigControls.chain({region:"arm",side}),AutoMovieHumanRigControls.channel("arms."+side+".wrist.flexion"),AutoMovieHumanRigControls.channel("arms."+side+".wrist.radialDeviation")],targets:[{bone:AutoMovieHumanRigControls.joint(material.bone),localPoint:[...material.point],position:actor.object.worldToLocal(goal.point.clone()).toArray()},{bone:AutoMovieHumanRigControls.joint(material.bone),localPoint:new THREE.Vector3(...material.point).addScaledVector(localNormal,.08).toArray(),position:actor.object.worldToLocal(goal.point.clone().addScaledVector(goal.normal,.08)).toArray()}],iterations:16,tolerance:.003};
  if(goal.tolerance!==undefined){if(!Number.isFinite(goal.tolerance)||goal.tolerance<=0)throw new Error("Surface fitting needs a positive finite metre tolerance");request.tolerance=goal.tolerance;}
  if(goal.normalMinimum!==undefined){
    if(!Number.isFinite(goal.normalMinimum)||goal.normalMinimum<=0||goal.normalMinimum>1)throw new Error("Surface normal cone must have a positive finite cosine through1");
    const tangent:THREE.Vector3=localNormal.clone().cross(Math.abs(localNormal.x)<.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0)).normalize();
    const point:AutoMovieHumanClinicalIk.IBonePoint={bone:AutoMovieHumanRigControls.joint(material.bone),localPoint:[...material.point]};
    const bodyNormal:THREE.Vector3=goal.normal.clone().applyQuaternion(actor.object.getWorldQuaternion(new THREE.Quaternion()).invert());
    request.targets=[request.targets[0]!];
    request.constraints=[{kind:"line-offset",point:{bone:point.bone,localPoint:new THREE.Vector3(...material.point).addScaledVector(localNormal,.01).toArray()},line:{origin:point,end:{bone:point.bone,localPoint:new THREE.Vector3(...material.point).addScaledVector(tangent,.01).toArray()}},normal:bodyNormal.toArray(),minimum:.01*goal.normalMinimum}];
  }
  const result:AutoMovieHumanClinicalIk.IResult=AutoMovieHumanClinicalIk.solve(actor.evaluate,pose,request);
  actor.pose(result.pose);actor.object.updateMatrixWorld(true);
  const bone:THREE.Group|undefined=actor.drawing.bones.get(material.bone);if(!bone)throw new Error("Missing original contact bone");
  const point:THREE.Vector3=actor.object.localToWorld(actor.point(material.bone,material.point));
  const normal:THREE.Vector3=localNormal.transformDirection(bone.matrixWorld);
  return {result,request,point,normal,positionError:point.distanceTo(goal.point),normalError:normal.angleTo(goal.normal)*180/Math.PI};
}
