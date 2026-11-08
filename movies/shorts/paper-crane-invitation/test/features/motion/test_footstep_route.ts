import assert from "node:assert/strict";
import * as THREE from "three";
import { sampleFootstepRoute } from "../../../src/sampleFootstepRoute";

/**
 * Keep a planted sole fixed and preserve the exact accepted continuation root.
 * @evidence contracts/testing.md#observable-behavior Calls the actual route module before, during, after and out of order across two footfalls. Checks initial-root retention despite a measured nonneutral offset, unchanged stance reference/heading,5cm swing, exact landing and ownership/refusal. Toe/air roles remain through an open stride and both become flat only at an explicitly paired common landing. No actual Human or movie approval transfers from this planner test.
 * @evidence contracts/testing.md#independent-cases Literal initial root7/0.2/9 deliberately differs from neutral footprint mean. The left foot moves during0–1 while the right remains at its original point/heading; midpoint lift is exactly5cm. NaN initial heading must refuse rather than propagate. The public Human support solver remains responsible for anatomy and contact.
 */
export function test_footstep_route(): void {
  const options: Omit<Parameters<typeof sampleFootstepRoute>[0],"seconds">={rest:{left:new THREE.Vector3(0.1,0,0.1),right:new THREE.Vector3(0.1,0,-0.1)},initial:{root:new THREE.Vector3(7,0.2,9),yaw:0,feet:{left:new THREE.Vector3(7.2,0,9.1),right:new THREE.Vector3(7.2,0,8.9)},headings:{left:0,right:0}},steps:[{begin:0,end:1,side:"left",root:new THREE.Vector3(7.3,0,9),yaw:0.2},{begin:1,end:2,side:"right",root:new THREE.Vector3(7.5,0,9),yaw:0.2}]};
  const first: ReturnType<typeof sampleFootstepRoute>=sampleFootstepRoute({...options,seconds:0});
  assert.deepEqual(first.root.toArray(),options.initial.root.toArray());
  const mid: ReturnType<typeof sampleFootstepRoute>=sampleFootstepRoute({...options,seconds:0.5});
  assert.deepEqual(mid.feet.right.toArray(),options.initial.feet.right.toArray());assert.equal(mid.headings.right,0);
  assert.ok(Math.abs(mid.feet.left.y-0.05)<1e-12);assert.equal(mid.swing,"left");
  const end: ReturnType<typeof sampleFootstepRoute>=sampleFootstepRoute({...options,seconds:2});
  const expected: THREE.Vector3=options.rest.right.clone().applyAxisAngle(new THREE.Vector3(0,1,0),0.2).add(options.steps[1]!.root);
  assert.ok(end.feet.right.distanceTo(expected)<1e-12);
  const toeSteps:typeof options.steps=options.steps.map((s):typeof options.steps[number]=>({...s,stance:"toe"}));
  const toeMid:ReturnType<typeof sampleFootstepRoute>=sampleFootstepRoute({...options,steps:toeSteps,seconds:.5});assert.deepEqual(toeMid.contacts,{left:"air",right:"toe"});
  const strideEnd:ReturnType<typeof sampleFootstepRoute>=sampleFootstepRoute({...options,steps:toeSteps,seconds:2});assert.deepEqual(strideEnd.contacts,{left:"toe",right:"flat"});
  const settled:ReturnType<typeof sampleFootstepRoute>=sampleFootstepRoute({...options,steps:toeSteps.map((s):typeof options.steps[number]=>({...s,root:new THREE.Vector3(7.5,0,9)})),seconds:2});assert.deepEqual(settled.contacts,{left:"flat",right:"flat"});
  assert.deepEqual(sampleFootstepRoute({...options,seconds:0.5}),mid);
  assert.deepEqual(options.initial.root.toArray(),[7,0.2,9]);assert.equal(options.initial.feet.left.y,0);
  assert.throws(()=>sampleFootstepRoute({...options,initial:{...options.initial,yaw:NaN},seconds:0}));
}
