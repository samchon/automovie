import assert from "node:assert/strict";
import * as THREE from "three";
import { admitSurfacePushFit } from "../../../src/admitSurfacePushFit";
import { measurePaperTouch } from "../../../src/measurePaperTouch";

/**
 * Accept physical contact despite missing a tighter optional preparation goal.
 * @evidence contracts/testing.md#observable-behavior Combines the actual fit predicate with the real finite paper/closed skin inspector. A literal0.9mm target miss exceeds the0.7mm requested preparation but remains valid actual0.6mm face contact. Altering preparation metadata cannot change admission. Missing, negative, nonfinite, excessive, clamped and interval-failed native outcomes reject; reversed physical normals still fail the separate geometry inspector even when fit telemetry passes.
 * @evidence contracts/testing.md#independent-cases Literal12×8×0.8mm paper and a closed pushing box whose top is−1mm establish actual face gap0.6mm. Desired pad−1.9mm gives independently computed native miss0.9mm. The original5mm transported-point budget and3mm physical face allowance remain unchanged; neither0.7mm preparation nor cosine0.3 margin is introduced as a final criterion.
 */
export function test_surface_push_fit():void {
  const paper:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.012,.008,.0008));
  const pad:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.004,.004,.002));pad.position.z=-.002;
  const actual:THREE.Vector3=new THREE.Vector3(0,0,-.001);const desired:THREE.Vector3=new THREE.Vector3(0,0,-.0019);const normal:THREE.Vector3=new THREE.Vector3(0,0,1);
  const fit:{request:{tolerance:number};error:number;position:number;normal:number;constraintsSatisfied:boolean;clamps:unknown[]}={request:{tolerance:.0007},error:actual.distanceTo(desired),position:actual.distanceTo(desired),normal:0,constraintsSatisfied:true,clamps:[]};
  try {
    assert.ok(fit.error>fit.request.tolerance);assert.equal(admitSurfacePushFit(fit),true);
    const contact:ReturnType<typeof measurePaperTouch>=measurePaperTouch(paper,actual,normal,[pad]);assert.equal(contact.valid,true);assert.ok(Math.abs(contact.distance-.0006)<1e-9);
    const tighterPreparation:typeof fit={...fit,request:{tolerance:.0001}};assert.equal(admitSurfacePushFit(tighterPreparation),true);
    assert.equal(admitSurfacePushFit(undefined),false);assert.equal(admitSurfacePushFit({...fit,error:.005001}),false);assert.equal(admitSurfacePushFit({...fit,constraintsSatisfied:false}),false);assert.equal(admitSurfacePushFit({...fit,clamps:[{path:"native-clamp"}]}),false);
    for(const key of ["error","position","normal"] as const)for(const value of [-.001,NaN,Infinity])assert.equal(admitSurfacePushFit({...fit,[key]:value}),false);
    assert.equal(measurePaperTouch(paper,actual,normal.clone().negate(),[pad]).valid,false);
  } finally {for(const mesh of [paper,pad]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}}
}
