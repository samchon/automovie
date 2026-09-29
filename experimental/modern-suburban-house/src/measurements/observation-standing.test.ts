/** Person-sized observation stations remain clear without changing their question. */
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import type { IRoomReservation } from "../spaces/rooms/reservations";
import type { IObservationPose } from "../spaces/observation-records";
const require=createRequire(import.meta.url);
const { standingObservation }=require("../spaces/observation-standing.ts") as typeof import("../spaces/observation-standing");

const space:IAutoMovieBuiltSpace={id:"test-room",kind:"room",parent:null,cells:[{id:"room-cell",planes:[
  {normal:{x:1,y:0,z:0},offset:2},{normal:{x:-1,y:0,z:0},offset:0},
  {normal:{x:0,y:1,z:0},offset:2.75},{normal:{x:0,y:-1,z:0},offset:0},
  {normal:{x:0,y:0,z:1},offset:2},{normal:{x:0,y:0,z:-1},offset:0},
]}]};
const pose:IObservationPose={position:{x:1,y:1.6,z:1},target:{x:1,y:1.6,z:2}};
const input={space,pose,floor:0,eye:1.6,preserveDirection:true,occupied:[] as IRoomReservation[],previous:[],ranges:[{x:[0,2] as const,z:[0,2] as const}]};

void test("an unobstructed station is retained, while a wall-adjacent eye moves its full footprint inside",()=>{
  assert.equal(standingObservation(input),pose);
  const atWall={...pose,position:{x:.1,y:1.6,z:1},target:{x:.1,y:1.6,z:2}};
  const result=standingObservation({...input,pose:atWall});assert.ok(result);
  assert.ok(result.position.x>=.3-1e-9);assert.equal(result.position.z,1);
  assert.ok(Math.abs(result.target.x-result.position.x)<1e-9);
  assert.ok(Math.abs(result.target.z-result.position.z-1)<1e-9);
  assert.match(result.reason!,/boundary\/body\/swing/);
});

void test("a station moves outside a solid body or swing and retains the authored target",()=>{
  for(const kind of ["furniture","swing"] as const){
    const occupied:IRoomReservation[]=[{id:"blocked",kind,x:[.8,1.2],z:[.8,1.2]}];
    const result=standingObservation({...input,occupied,preserveDirection:false});assert.ok(result);
    assert.deepEqual(result.target,pose.target);
    assert.ok(Math.hypot(result.position.x-1,result.position.z-1)>=.4);
  }
});

void test("diagonal footprints use separating axes rather than centre-only occupancy",()=>{
  const diagonal={...pose,target:{x:2,y:1.6,z:2}};
  const occupied:IRoomReservation[]=[{id:"corner-body",kind:"fixture",x:[1.12,1.20],z:[1.12,1.20]}];
  const result=standingObservation({...input,pose:diagonal,occupied});assert.ok(result);
  assert.notDeepEqual(result.position,pose.position);
  assert.ok(Math.abs((result.target.x-result.position.x)-(result.target.z-result.position.z))<1e-9);
});

void test("a previous station is not duplicated and another space does not prohibit this station",()=>{
  const previous=[{id:"old",role:"center" as const,space:space.id,subject:null,pose}];
  const moved=standingObservation({...input,previous});assert.ok(moved);
  assert.ok(Math.hypot(moved.position.x-1,moved.position.z-1)>=.05);
  assert.equal(standingObservation({...input,previous:[{...previous[0]!,space:"other-room"}]}),pose);
});

void test("no human-sized clear location is explicitly unavailable",()=>{
  const occupied:IRoomReservation[]=[{id:"all-body",kind:"storage",x:[0,2],z:[0,2]}];
  assert.equal(standingObservation({...input,occupied}),null);
  const low:IAutoMovieBuiltSpace={...space,cells:[{...space.cells[0]!,planes:space.cells[0]!.planes.map(p=>p.normal.y===1?{...p,offset:1.8}:p)}]};
  assert.equal(standingObservation({...input,space:low}),null);
  assert.equal(standingObservation({...input,preserveDirection:false,pose:{...pose,target:pose.position},ranges:[]}),null);
});
