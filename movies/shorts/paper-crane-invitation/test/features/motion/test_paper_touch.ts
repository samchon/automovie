import assert from "node:assert/strict";
import * as THREE from "three";
import { measurePaperTouch } from "../../../src/measurePaperTouch";

/**
 * Keep unilateral finite contact distinct from grip, gap and material penetration.
 * @evidence contracts/testing.md#observable-behavior Executes the actual one-face inspector on an independently positioned closed pushing solid and finite paper layer. A lower outside pad with0.6mm gap passes; reversed normal, wrong material side, outside finite edge, excessive gap and crossing/enclosing solids fail independently. Every original skin row remains measured even when a point criterion fails. This geometry test establishes no Human reach or visible unfolding.
 * @evidence contracts/testing.md#independent-cases Literal12×8×0.8mm paper and a4×4×2mm pad whose upper face is at−1mm establish the lower-face distance0.6mm. The source physical3mm allowance is not enlarged. A central solid crosses the tab, and a4cm enclosing solid rejects containment without needing a boundary crossing; a point20mm away in X is outside the actual face.
 */
export function test_paper_touch():void {
  const paper:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.012,.008,.0008));
  const pad:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.004,.004,.002));pad.position.z=-.002;
  const cross:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.002,.002,.002));
  const enclosing:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.04));
  const point:THREE.Vector3=new THREE.Vector3(0,0,-.001);const normal:THREE.Vector3=new THREE.Vector3(0,0,1);
  try {
    const good:ReturnType<typeof measurePaperTouch>=measurePaperTouch(paper,point,normal,[pad]);assert.equal(good.valid,true);assert.ok(Math.abs(good.distance-.0006)<1e-9);assert.equal(good.volume.trianglesExamined,12);
    assert.equal(measurePaperTouch(paper,point,normal.clone().negate(),[pad]).valid,false);
    assert.equal(measurePaperTouch(paper,new THREE.Vector3(0,0,.001),normal,[pad]).valid,false);
    assert.equal(measurePaperTouch(paper,new THREE.Vector3(.02,0,-.001),normal,[pad]).valid,false);
    assert.equal(measurePaperTouch(paper,new THREE.Vector3(0,0,-.004),normal,[pad]).valid,false);
    const crossed:ReturnType<typeof measurePaperTouch>=measurePaperTouch(paper,point,normal,[pad,cross]);assert.equal(crossed.valid,false);assert.ok(crossed.volume.intersections>0);assert.equal(crossed.volume.trianglesExamined,24);
    const contained:ReturnType<typeof measurePaperTouch>=measurePaperTouch(paper,point,normal,[pad,enclosing]);assert.equal(contained.valid,false);assert.equal(contained.volume.containments,1);
    assert.throws(()=>measurePaperTouch(paper,new THREE.Vector3(NaN,0,0),normal,[pad]));
  } finally {for(const mesh of [paper,pad,cross,enclosing]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}}
}
