import type { AutoMovieHumanClinicalIk, AutoMovieHumanSkeleton, IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import type { createHumanPerformer } from "./createHumanPerformer";
import { createRigidHandCarry } from "./createRigidHandCarry";
import { meshSurfacePoint } from "./meshSurfacePoint";

/**
 * Move an actual open palm's material frame through the public arm and wrist fit.
 * @evidence contracts/common.md#implementation-and-ownership A ray addresses the emitted palmar surface using the source index/little/middle axes. Three original vertices of that exact triangle and two explicitly auxiliary frame probes feed the existing public rigid carrying action. Their reference is the same actor's neutral FK. The actual current mesh transform supplies the returned surface point/normal; wrist-centre position alone cannot certify a supporting palm orientation. No geometry, ROM, other body controls or original surface point changes. This helper acquires no renderer resources.
 * @evidence contracts/common.md#authoring-interface Supply the fixed actor and anatomical side. fit accepts a complete pose and finite world origin/unit quaternion, applies the real public result and retains its residual. frame reads that resulting real material frame. The caller owns orientation/support admission, finite prop underside placement, all skin clearance and Viewer inspection; a successful frame fit alone is not a grasp or force-balance proof. The copied record identifies its actual palm triangle and original materials.
 */
export function createPalmCarry(actor:ReturnType<typeof createHumanPerformer>,side:"left"|"right"):{
  fit:(pose:IAutoMovieHumanPose,origin:THREE.Vector3,rotation:THREE.Quaternion)=>AutoMovieHumanClinicalIk.IResult;
  frame:()=>{point:THREE.Vector3;normal:THREE.Vector3;rotation:THREE.Quaternion};
  record:{palm:{bone:string;triangle:number;point:number[];normal:number[]};carry:ReturnType<typeof createRigidHandCarry>["record"]};
} {
  const handId:"leftHand"|"rightHand"=side==="left"?"leftHand":"rightHand";
  const mesh:THREE.Mesh|undefined=actor.drawing.parts.get(handId);
  if(!mesh)throw new Error("Palm carrying requires the real Hand mesh");
  /** Resolve each original joint once in the source's body-metre frame. */
  const source:(name:string)=>THREE.Vector3=(name:string):THREE.Vector3=>{
    const bone:AutoMovieHumanSkeleton.IBone|undefined=actor.neutral.bones.find((row:AutoMovieHumanSkeleton.IBone):boolean=>row.bone===side+name);
    if(!bone)throw new Error("Missing palm construction joint "+name);
    return new THREE.Vector3(...bone.position);
  };
  const forward:THREE.Vector3=source("MiddleProximal").sub(source("Hand")).normalize();
  const palmar:THREE.Vector3=source("IndexProximal").sub(source("LittleProximal")).normalize().cross(forward).normalize().multiplyScalar(side==="left"?1:-1);
  mesh.geometry.computeBoundingBox();
  const centre:THREE.Vector3=mesh.geometry.boundingBox!.getCenter(new THREE.Vector3());
  const palm:ReturnType<typeof meshSurfacePoint>=meshSurfacePoint(mesh,centre.clone().addScaledVector(palmar,0.15),palmar.clone().negate());
  const neutral:AutoMovieHumanSkeleton.IOutput=actor.evaluate({});
  const hand:AutoMovieHumanSkeleton.IPlacement|undefined=neutral.posed.find((row:AutoMovieHumanSkeleton.IPlacement):boolean=>row.bone===handId);
  if(!hand)throw new Error("Missing actual neutral palm frame");
  const handRotation:THREE.Quaternion=new THREE.Quaternion(...hand.rotation);
  const n:THREE.Vector3=palm.normal.clone().applyQuaternion(handRotation);
  const y:THREE.Vector3=forward.clone().applyQuaternion(handRotation);y.addScaledVector(n,-y.dot(n)).normalize();
  const x:THREE.Vector3=y.clone().cross(n).normalize();
  if(y.lengthSq()<0.5||x.lengthSq()<0.5)throw new Error("Actual palm direction is degenerate");
  const positions:THREE.BufferAttribute=mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const indices:THREE.BufferAttribute|null=mesh.geometry.getIndex();
  const material:(offset:number)=>{bone:typeof handId;localPoint:[number,number,number]}=(offset:number):{bone:typeof handId;localPoint:[number,number,number]}=>({bone:handId,localPoint:new THREE.Vector3().fromBufferAttribute(positions,indices?indices.getX(palm.triangle*3+offset):palm.triangle*3+offset).toArray()});
  const carry:ReturnType<typeof createRigidHandCarry>=createRigidHandCarry(actor,side,{}, {
    origin:palm.point.clone().applyQuaternion(handRotation).add(new THREE.Vector3(...hand.position)),
    rotation:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,n)),
  },[material(0),material(1),material(2)]);
  return {
    fit:carry.fit,
    record:{palm:{bone:handId,triangle:palm.triangle,point:palm.point.toArray(),normal:palm.normal.toArray()},carry:structuredClone(carry.record)},
    frame():{point:THREE.Vector3;normal:THREE.Vector3;rotation:THREE.Quaternion} {
      actor.object.updateMatrixWorld(true);
      const normal:THREE.Vector3=palm.normal.clone().transformDirection(mesh.matrixWorld);
      const along:THREE.Vector3=forward.clone().transformDirection(mesh.matrixWorld);along.addScaledVector(normal,-along.dot(normal)).normalize();
      const across:THREE.Vector3=along.clone().cross(normal).normalize();
      return {point:mesh.localToWorld(palm.point.clone()),normal,rotation:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,along,normal))};
    },
  };
}
