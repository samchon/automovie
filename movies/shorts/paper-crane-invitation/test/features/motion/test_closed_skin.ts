import assert from "node:assert/strict";
import * as THREE from "three";
import { inspectClosedSkin } from "../../../src/inspectClosedSkin";

/**
 * Refuse ambiguous grazing events instead of certifying an enclosing solid as outside.
 * @evidence contracts/testing.md#observable-behavior Inspects real closed box triangles containing the origin, then adds three distant closed components tangent to the inspector's three published rays. Every ray must still distinguish a solid exit from a noncrossing edge touch; this deliberately adversarial mesh must not receive a determinate outside certificate. Ordinary inside/outside cases remain independently established by a literal enclosing4cm cube. No Human, solver or visual acceptance is inferred.
 * @evidence contracts/testing.md#independent-cases The origin is strictly inside the first cube and outside each distant component. At each distant component the selected ray reaches x-maximum and y-minimum simultaneously, so it touches one edge without entering its interior. Counting that touch as one crossing would cancel the genuine enclosing-cube exit on all three rays. Ambiguity must fail closed; an exterior point at5/5/5 looking further positive is unambiguously outside all components.
 */
export function test_closed_skin():void {
  /** Read independent BoxGeometry triangles in one explicitly translated frame. */
  const cube:(centre:THREE.Vector3,width:number)=>THREE.Triangle[]=(centre:THREE.Vector3,width:number):THREE.Triangle[]=>{
    const geometry:THREE.BoxGeometry=new THREE.BoxGeometry(width,width,width);
    try {
      const positions:THREE.BufferAttribute=geometry.getAttribute("position") as THREE.BufferAttribute;
      const indices:THREE.BufferAttribute=geometry.getIndex()!;
      const triangles:THREE.Triangle[]=[];
      for(let offset:number=0;offset<indices.count;offset+=3) {
        const points:THREE.Vector3[]=[0,1,2].map((n:number):THREE.Vector3=>new THREE.Vector3().fromBufferAttribute(positions,indices.getX(offset+n)).add(centre));
        triangles.push(new THREE.Triangle(points[0]!,points[1]!,points[2]!));
      }
      return triangles;
    }finally {geometry.dispose();}
  };
  const enclosing:THREE.Triangle[]=cube(new THREE.Vector3(),0.04);
  assert.deepEqual(inspectClosedSkin(enclosing,new THREE.Vector3()),{closed:true,inside:true,determinate:true});
  assert.deepEqual(inspectClosedSkin(enclosing,new THREE.Vector3(5,5,5)),{closed:true,inside:false,determinate:true});
  const combined:THREE.Triangle[]=[...enclosing];
  for(const direction of [new THREE.Vector3(1,0.371,0.173),new THREE.Vector3(0.237,1,0.419),new THREE.Vector3(0.193,0.317,1)]) {
    const edge:THREE.Vector3=direction.normalize();
    const halfWidth:number=Math.fround(0.01);
    combined.push(...cube(edge.add(new THREE.Vector3(-halfWidth,halfWidth,0)),0.02));
  }
  const grazing:ReturnType<typeof inspectClosedSkin>=inspectClosedSkin(combined,new THREE.Vector3());
  assert.equal(grazing.closed,true);
  assert.equal(grazing.determinate,false,"noncrossing edge touches must not certify outside");
  assert.equal(inspectClosedSkin(combined,new THREE.Vector3(5,5,5)).inside,false);
}
