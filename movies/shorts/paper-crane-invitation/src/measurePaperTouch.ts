import * as THREE from "three";
import { measurePaperSkin } from "./measurePaperSkin";

/**
 * Inspect one pushing skin pad on the finite lower face of an actual paper layer.
 * @evidence contracts/common.md#implementation-and-ownership The addressed original point projects onto the real BoxGeometry lower face. Finite XY coverage, outside material side, three-millimetre distance and normal facing into the paper are independent conditions. Every original hand triangle, closed-solid containment and signed distance is still inspected by the existing complete skin oracle. There is no opposite thumb requirement because this role pushes a flap rather than pinching it. No invalid result recentres the prop or changes a witness.
 * @evidence contracts/common.md#authoring-interface Supply the actual finite flap and original material point/unit world normal plus complete hand skin. Returns every observation and their conjunction. This establishes the stated unilateral contact geometry only, not grip, force balance, inextensible origami or audience readability.
 */
export function measurePaperTouch(base:THREE.Mesh,point:THREE.Vector3,normal:THREE.Vector3,skin:readonly THREE.Mesh[]):{valid:boolean;distance:number;withinFace:boolean;outside:boolean;normalAlignment:number;volume:ReturnType<typeof measurePaperSkin>} {
  if(!(base.geometry instanceof THREE.BoxGeometry)||![...point.toArray(),...normal.toArray()].every(Number.isFinite)||Math.abs(normal.length()-1)>1e-6)throw new Error("Paper push requires a finite box and original point/unit normal");
  base.updateWorldMatrix(true,false);base.geometry.computeBoundingBox();
  const bounds:THREE.Box3=base.geometry.boundingBox!;
  const local:THREE.Vector3=base.worldToLocal(point.clone());
  const withinFace:boolean=local.x>=bounds.min.x&&local.x<=bounds.max.x&&local.y>=bounds.min.y&&local.y<=bounds.max.y;
  const face:THREE.Vector3=base.localToWorld(new THREE.Vector3(THREE.MathUtils.clamp(local.x,bounds.min.x,bounds.max.x),THREE.MathUtils.clamp(local.y,bounds.min.y,bounds.max.y),bounds.min.z));
  const distance:number=point.distanceTo(face);const outside:boolean=local.z<=bounds.min.z+1e-6;
  const normalAlignment:number=normal.dot(new THREE.Vector3(0,0,1).transformDirection(base.matrixWorld));
  const volume:ReturnType<typeof measurePaperSkin>=measurePaperSkin(base,skin);
  return {valid:volume.valid&&withinFace&&outside&&distance<=.003&&normalAlignment>.25,distance,withinFace,outside,normalAlignment,volume};
}
