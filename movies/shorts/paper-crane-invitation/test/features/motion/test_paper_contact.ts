import assert from "node:assert/strict";
import * as THREE from "three";
import { measurePaperContact } from "../../../src/measurePaperContact";

/**
 * Separate finite face contact from point coincidence and interior collision.
 * @evidence contracts/testing.md#observable-behavior Executes the real inspector on independently authored opposite finite faces and closed original box meshes. Tangentially separated material points pass with sub-millimetre face errors; outside-face, reversed-normal and interior-crossing cases fail. Nonempty lists containing empty meshes, out-of-range elements or nonscalar/normalized/floating index layouts must retain invalid coverage despite other valid geometry. This is a geometry unit test, not a Human or visible-motion acceptance.
 * @evidence contracts/testing.md#independent-cases Literal12by8by0.8mm paper and closed supporting boxes with inner faces at±1mm define0.6mm surface distances. Points six millimetres apart tangentially must not be forced to coincide. A central crossing box intersects the actual shrunken paper; a separate4cm enclosing solid must fail containment even with zero boundary crossings; a point2cm outside its finite face and a reversed normal independently invalidate contact.
 */
export function test_paper_contact(): void {
  const base: THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.008,0.0008));
  const front: THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.004,0.002));
  const back: THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.004,0.002));
  front.position.set(0.003,0,0.002);back.position.set(-0.003,0,-0.002);
  const contact: Parameters<typeof measurePaperContact>[1]={index:new THREE.Vector3(0.003,0,0.001),thumb:new THREE.Vector3(-0.003,0,-0.001),indexNormal:new THREE.Vector3(0,0,-1),thumbNormal:new THREE.Vector3(0,0,1)};
  const crossing: THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(0.002,0.002,0.002));
  const enclosing: THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.04,0.04));
  const empty: THREE.Mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute([],3)));
  const malformed: THREE.Mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute([0,0,0,0.001,0,0,0,0.001,0],3)).setIndex([0,1,9]));
  const layout: THREE.Mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute([0,0,0,0.001,0,0,0,0.001,0],3)).setIndex(new THREE.BufferAttribute(new Uint16Array([0,1,2,0,0,0,1,1,1]),3)));
  const normalized: THREE.Mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute([0,0,0,0.001,0,0,0,0.001,0],3)).setIndex(new THREE.BufferAttribute(new Uint16Array([0,1,2]),1,true)));
  const floating: THREE.Mesh=new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position",new THREE.Float32BufferAttribute([0,0,0,0.001,0,0,0,0.001,0],3)).setIndex(new THREE.BufferAttribute(new Float32Array([0,1,2]),1)));
  try {
    const good: ReturnType<typeof measurePaperContact>=measurePaperContact(base,contact,[front,back]);
    assert.equal(good.trianglesExamined,24);assert.equal(good.coverageComplete,true);
    assert.equal(good.valid,true);assert.equal(good.withinFaces,true);assert.equal(good.intersections,0);
    assert.ok(Math.abs(good.frontError-0.0006)<1e-9&&Math.abs(good.backError-0.0006)<1e-9);
    assert.equal(measurePaperContact(base,{...contact,index:new THREE.Vector3(0.02,0,0.001)},[front,back]).valid,false);
    assert.equal(measurePaperContact(base,{...contact,indexNormal:new THREE.Vector3(0,0,1)},[front,back]).valid,false);
    for(const invalid of [empty,malformed,layout,normalized,floating]){
      const rejected: ReturnType<typeof measurePaperContact>=measurePaperContact(base,contact,[front,back,invalid]);
      assert.equal(rejected.valid,false);assert.equal(rejected.coverageComplete,false);assert.ok(rejected.invalidMeshes.length>0);
      assert.equal(rejected.trianglesExamined,24);assert.equal(rejected.withinFaces,true); // Other constraints remain examined and reported.
    }
    const bad: ReturnType<typeof measurePaperContact>=measurePaperContact(base,contact,[front,back,crossing]);
    assert.ok(bad.intersections>0);assert.equal(bad.valid,false);
    const contained:ReturnType<typeof measurePaperContact>=measurePaperContact(base,contact,[front,back,enclosing]);
    assert.equal(contained.intersections,0,"a fully enclosed tab need not cross any skin triangle");
    assert.equal(contained.containments,1);assert.equal(contained.valid,false);
  } finally {for(const m of [base,front,back,crossing,enclosing,empty,malformed,layout,normalized,floating]){m.geometry.dispose();(m.material as THREE.Material).dispose();}}
}
