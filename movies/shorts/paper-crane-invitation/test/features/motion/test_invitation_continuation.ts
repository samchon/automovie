import assert from "node:assert/strict";
import * as THREE from "three";
import { sampleInvitationContinuation } from "../../../src/sampleInvitationContinuation";

/**
 * Keep future receive/release, supported-seat intent and prop ordering on one clock.
 * @evidence contracts/testing.md#observable-behavior Samples the actual unassembled continuation module across every24fps instant and explicit custody boundaries. Checks exact accepted-entry roots, independent unchanged footprints through seat descent, receive-before-release windows, inscription reveal after the admission, note support before either cup leaves the sill and two owned raised cups at the ending. No real Human support, scene join or future motion acceptance is transferred from these pure checks.
 * @evidence contracts/testing.md#independent-cases Literal bay/bench marks and different measured entry footprint/root offsets distinguish preserved entry from neutral resetting. Harry's feet at28.3 and29.5 must be identical while only his seat intent/root height lowers. At30.5 the paper has both owners before31.1 transfers it; at51.8 the cup has both owners before52.3 transfers it. All cup pickup states require the note already on the sill.60seconds is the finite held ending, not an empty tail.
 */
export function test_invitation_continuation():void {
  const entry:(x:number,z:number,yaw:number)=>Parameters<typeof sampleInvitationContinuation>[0]["carina"]=(x:number,z:number,yaw:number):Parameters<typeof sampleInvitationContinuation>[0]["carina"]=>({rest:{left:new THREE.Vector3(0.08,0,0.09),right:new THREE.Vector3(0.08,0,-0.09)},initial:{root:new THREE.Vector3(x,-0.02,z),yaw,feet:{left:new THREE.Vector3(x+0.12,0,z+0.11),right:new THREE.Vector3(x+0.04,0,z-0.12)},headings:{left:yaw,right:yaw}}});
  const carina:Parameters<typeof sampleInvitationContinuation>[0]["carina"]=entry(4.314,0.698,-2.07);
  const harry:Parameters<typeof sampleInvitationContinuation>[0]["harry"]=entry(3.35,1.75,1.8);
  const at:(seconds:number)=>ReturnType<typeof sampleInvitationContinuation>=(seconds:number):ReturnType<typeof sampleInvitationContinuation>=>sampleInvitationContinuation({seconds,carina,harry});
  assert.deepEqual(at(9).carina.root.toArray(),carina.initial.root.toArray());
  assert.deepEqual(at(9).harry.root.toArray(),harry.initial.root.toArray());
  assert.ok(at(12.2).carina.root.distanceTo(at(12.2).harry.root)>.9,"approach retains a clear central paper/hand workspace before the offered return");
  assert.equal(at(30.5).paper.owner,"shared return");assert.equal(at(31.1).paper.owner,"Carina");
  assert.equal(at(32.9).paper.audienceReveal,false);assert.equal(at(33.3).paper.audienceReveal,true);
  assert.equal(at(32.9).paper.orientation,"blank-back-to-audience");assert.equal(at(33.3).paper.orientation,"legible-front");assert.equal(at(37).paper.orientation,"manual-fold");assert.equal(at(40).paper.orientation,"supported-free-bank");
  assert.equal(at(51.8).cups.rightSillCup,"shared cup");assert.equal(at(52.3).cups.rightSillCup,"Harry right");
  const before:ReturnType<typeof sampleInvitationContinuation>=at(28.3);
  const seated:ReturnType<typeof sampleInvitationContinuation>=at(29.5);
  assert.deepEqual(seated.harry.feet,before.harry.feet);
  assert.equal(before.harry.seatWeight,0);assert.equal(seated.harry.seatWeight,1);
  assert.ok(seated.harry.root.y<before.harry.root.y-0.4);
  for(let frame:number=216;frame<=1440;frame++) {
    const state:ReturnType<typeof sampleInvitationContinuation>=at(frame/24);
    assert.ok(state.phase.length>0&&state.camera.length>0);
    for(const actor of [state.carina,state.harry])assert.ok([...actor.root.toArray(),...actor.feet.left.toArray(),...actor.feet.right.toArray(),actor.yaw,actor.seatWeight,...actor.lookAt.toArray()].every(Number.isFinite));
    if(state.cups.leftSillCup!=="sill"||state.cups.rightSillCup!=="sill")assert.equal(state.paper.owner,"sill");
  }
  const ending:ReturnType<typeof sampleInvitationContinuation>=at(60);
  assert.equal(ending.carina.seatWeight,1);assert.equal(ending.harry.seatWeight,1);
  assert.equal(ending.cups.leftSillCup,"Carina right");assert.equal(ending.cups.rightSillCup,"Harry right");assert.equal(ending.cups.raise,1);
  assert.deepEqual(at(30.5),at(30.5));assert.deepEqual(carina.initial.root.toArray(),[4.314,-0.02,0.698]);
  assert.throws(()=>at(8.9));assert.throws(()=>at(NaN));assert.throws(()=>at(60.01));
}
