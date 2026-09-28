/** Exterior frames point out without translating or mirroring the physical wall. */
import assert from "node:assert/strict";
import test from "node:test";
import { boundaryOrientation } from "../spaces/boundary-orientation";

void test("both axes and both exterior sides preserve the world tangent and face outward",()=>{
  for(const axis of ["x","z"] as const)for(const outside of [0,1] as const){
    const sides=outside===0?["house-site","room"] as const:["room","house-site"] as const;
    const {rotation,sign}=boundaryOrientation(axis,sides),yaw=2*Math.atan2(rotation.y,rotation.w);
    const normal=axis==="x"?Math.cos(yaw):Math.sin(yaw);
    assert.ok(Math.abs(normal-(outside===0?-1:1))<1e-12);
    for(const u of [-3.75,0,2.4]){
      const x=Math.cos(yaw)*u*sign,z=-Math.sin(yaw)*u*sign;
      assert.ok(Math.abs(x-(axis==="x"?u:0))<1e-12);
      assert.ok(Math.abs(z-(axis==="z"?u:0))<1e-12);
    }
  }
});

void test("an internal pair retains its original axis frame",()=>{
  for(const axis of ["x","z"] as const){
    const {rotation,sign}=boundaryOrientation(axis,["room-a","room-b"]);
    assert.equal(sign,1);
    assert.ok(Math.abs(2*Math.atan2(rotation.y,rotation.w)-(axis==="x"?0:-Math.PI/2))<1e-12);
  }
});
