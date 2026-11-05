import * as THREE from "three";
import { measurePaperSkin } from "./measurePaperSkin";
import { placePropAnchor } from "./placePropAnchor";

/**
 * Rest the actual finite paper underside on the highest original palm material within its footprint.
 * @evidence contracts/common.md#implementation-and-ownership Original palm triangles are transformed to the actual support frame and clipped against the real BoxGeometry XY footprint. Linear triangle clipping preserves material provenance; its highest point determines the supporting plane, rather than putting the base centre inside skin. Actual bottom-face and support material coincide. Every original hand solid is then checked for finite-box interior crossing/containment and independent signed penetration, permitting true boundary touch only. No hand or paper geometry moves independently of its owner; this placement cannot certify force balance or the wings.
 * @evidence contracts/common.md#authoring-interface Supply the unparented prop root, its actual base mesh, actual palm material frame, original Hand mesh and complete original hand skin. Returns all support and penetration observations after placement. The caller admits an upward palm and the actual normal/contact/coverage results; failed placement stays visibly diagnostic. Clipped points remain on their source triangle, including footprint edges.
 */
export function placePaperOnPalm(object:THREE.Object3D,base:THREE.Mesh,frame:{point:THREE.Vector3;normal:THREE.Vector3;rotation:THREE.Quaternion},palm:THREE.Mesh,skin:readonly THREE.Mesh[]):{valid:boolean;anchorError:number;centre:THREE.Vector3;bottom:THREE.Vector3;support:THREE.Vector3;supportNormal:THREE.Vector3;normalUp:number;triangle:number;volume:ReturnType<typeof measurePaperSkin>} {
  if(!(base.geometry instanceof THREE.BoxGeometry))throw new Error("Palm support needs actual finite paper base");
  base.geometry.computeBoundingBox();const bounds:THREE.Box3=base.geometry.boundingBox!;
  const inverse:THREE.Quaternion=frame.rotation.clone().invert();
  const local:(p:THREE.Vector3)=>THREE.Vector3=(p:THREE.Vector3):THREE.Vector3=>p.clone().sub(frame.point).applyQuaternion(inverse);
  palm.updateWorldMatrix(true,false);
  const positions:THREE.BufferAttribute=palm.geometry.getAttribute("position") as THREE.BufferAttribute;
  const indices:THREE.BufferAttribute|null=palm.geometry.index;
  const count:number=indices?.count??positions.count;
  let best:THREE.Vector3|undefined;let triangle:number=-1;let supportNormal:THREE.Vector3=new THREE.Vector3();
  for(let offset:number=0;offset<count;offset+=3) {
    const original:THREE.Vector3[]=[0,1,2].map((k:number):THREE.Vector3=>local(palm.localToWorld(new THREE.Vector3().fromBufferAttribute(positions,indices?indices.getX(offset+k):offset+k))));
    let polygon:THREE.Vector3[]=original;
    for(const [axis,bound,sign] of [["x",bounds.min.x,1],["x",bounds.max.x,-1],["y",bounds.min.y,1],["y",bounds.max.y,-1]] as const) {
      const next:THREE.Vector3[]=[];
      for(let j:number=0;j<polygon.length;j++) {
        const a:THREE.Vector3=polygon[j]!;const b:THREE.Vector3=polygon[(j+1)%polygon.length]!;
        const da:number=(a[axis]-bound)*sign;const db:number=(b[axis]-bound)*sign;
        if(da>=0)next.push(a);
        if((da>=0)!==(db>=0))next.push(a.clone().lerp(b,da/(da-db)));
      }
      polygon=next;
    }
    for(const point of polygon)if(!best||point.z>best.z){best=point.clone();triangle=offset/3;supportNormal=new THREE.Triangle(original[0]!,original[1]!,original[2]!).getNormal(new THREE.Vector3()).applyQuaternion(frame.rotation);}
  }
  if(!best)throw new Error("Actual palm has no material under the finite paper footprint");
  const bottom:THREE.Vector3=frame.point.clone().add(new THREE.Vector3(0,0,best.z).applyQuaternion(frame.rotation));
  const support:THREE.Vector3=best.clone().applyQuaternion(frame.rotation).add(frame.point);
  const baseBottom:THREE.Vector3=new THREE.Vector3(0,0,bounds.min.z).multiply(base.scale).applyQuaternion(base.quaternion).add(base.position);
  const anchorError:number=placePropAnchor(object,baseBottom,bottom,frame.rotation);
  const volume:ReturnType<typeof measurePaperSkin>=measurePaperSkin(base,skin,true);
  const normalUp:number=frame.normal.y;
  const centre:THREE.Vector3=base.getWorldPosition(new THREE.Vector3());
  return {valid:volume.valid&&normalUp>=.95&&supportNormal.dot(frame.normal)>.25&&anchorError<=1e-6,anchorError,centre,bottom,support,supportNormal,normalUp,triangle,volume};
}
