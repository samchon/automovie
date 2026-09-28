/** Interior door placements are derived from the same built voids as the viewer. */
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { test } from "node:test";

import { InteriorDoorFills } from "../instances/interior-door-fills";

const require=createRequire(import.meta.url);
const { buildHouseEnvironment }=require(
  "../spaces/environment.ts",
) as typeof import("../spaces/environment");
const { buildHouse }=require(
  "../spaces/house.ts",
) as typeof import("../spaces/house");

const environment = buildHouseEnvironment(buildHouse());
const near=(actual:number,expected:number):void=>
  assert.ok(
    Math.abs(actual-expected)<1e-7,
    `${actual} differs from ${expected}`,
  );

const expected = [
  ["laundry-garage-door", 5.50, 0, -3.875, -Math.PI/2, 1.05, "low"],
  ["entry-living-door", -1.95, 0, -0.850, -Math.PI/2, 1, "low"],
  ["service-powder-door", 3.22, 0, -1.175, Math.PI/2, 0.95, "high"],
  ["service-laundry-door", 3.22, 0, -3.875, Math.PI/2, 1.05, "high"],
  ["service-pantry-door", 3.22, 0, -5.275, Math.PI/2, 0.95, "low"],
  ["hall-primary-door", -2.20, 3.06, -6.06, Math.PI, 1, "high"],
  ["primary-wardrobe-door", 0.75, 3.06, -9.70, -Math.PI/2, 1, "low"],
  ["hall-bedroom-two-door", -2.60, 3.06, -4.56, 0, 1, "high"],
  ["hall-bedroom-three-door", 3.22, 3.06, -3.985, Math.PI/2, 0.95, "high"],
  ["hall-shower-door", 1.55, 3.06, -6.06, Math.PI, 1, "high"],
  ["hall-tub-door", 3.22, 3.06, -5.36, Math.PI/2, 1, "low"],
] as const;

void test("all eleven real door voids receive one opening-local model on the opening room face",()=>{
  const { prototypes,instances }=new InteriorDoorFills().build(environment);
  assert.equal(prototypes.length,11);
  assert.equal(instances.length,11);
  assert.equal(new Set(instances.map((instance)=>instance.id)).size,11);
  for(const [id,x,y,z,yaw,width,side] of expected) {
    const instance=instances.find((item)=>item.id===`fill:${id}`);
    const prototype=prototypes.find((item)=>item.model.id===instance?.modelId);
    assert.ok(instance && prototype,id);
    const p=instance.transform.translation;
    const q=instance.transform.rotation;
    assert.ok(p && q,id);
    near(p.x,x);
    near(p.y,y);
    near(p.z,z);
    near(q.x,0);
    near(q.y,Math.sin(yaw/2));
    near(q.z,0);
    near(q.w,Math.cos(yaw/2));
    near(prototype.clearWidth,width-0.10);
    near(prototype.angle,Math.PI/2);
    near(prototype.hingePivot[0],side==="low" ? -width/2+0.03:width/2-0.03);
    assert.equal(Object.keys(prototype.faceByPart).length,prototype.model.parts.length);
    const opening=environment.openings.find((item)=>item.id===id);
    assert.ok(opening && opening.profile,id);
    near(Math.max(...opening.profile.outline.map((v)=>v.x))-
      Math.min(...opening.profile.outline.map((v)=>v.x)),width);
  }
  for(const id of ["living-common-opening","service-common-opening"]) {
    assert.equal(instances.some((instance)=>instance.id===`fill:${id}`),false);
    assert.equal(environment.openings.find((opening)=>opening.id===id)?.fill,null);
  }
});

void test("missing or duplicate door membership and filled open passage are refused",()=>{
  const builder=new InteriorDoorFills();
  const dropped=structuredClone(environment);
  dropped.openings=dropped.openings.filter((item)=>item.id!=="service-pantry-door");
  assert.throws(()=>builder.build(dropped),/population differs/);
  const doubled=structuredClone(environment);
  const repeated=doubled.openings.find((item)=>item.id==="service-pantry-door");
  assert.ok(repeated);
  doubled.openings.push(repeated);
  assert.throws(()=>builder.build(doubled),/population differs/);
  const filled=structuredClone(environment);
  const passage=filled.openings.find((item)=>item.id==="living-common-opening");
  assert.ok(passage);
  passage.fill="invented-door";
  assert.throws(()=>builder.build(filled),/open passage must remain empty/);
});

void test("a door with no host, distorted void or tilted frame cannot be placed",()=>{
  const builder=new InteriorDoorFills();
  const absent=structuredClone(environment);
  const door=absent.openings.find((item)=>item.id==="hall-primary-door");
  assert.ok(door);
  door.profile=undefined;
  assert.throws(()=>builder.build(absent),/no rectangular wall host/);
  const low=structuredClone(environment);
  const small=low.openings.find((item)=>item.id==="hall-primary-door");
  assert.ok(small?.profile);
  small.profile.outline[2]!.y-=0.1;
  small.profile.outline[3]!.y-=0.1;
  assert.throws(()=>builder.build(low),/outline disagrees/);
  const skewed=structuredClone(environment);
  const skewedDoor=skewed.openings.find((item)=>item.id==="hall-primary-door");
  assert.ok(skewedDoor?.profile);
  skewedDoor.profile.outline[2]!.x-=0.1;
  assert.throws(()=>builder.build(skewed),/outline disagrees/);
  const crossed=structuredClone(environment);
  const crossedDoor=crossed.openings.find((item)=>item.id==="hall-primary-door");
  assert.ok(crossedDoor?.profile);
  [crossedDoor.profile.outline[1],crossedDoor.profile.outline[2]]=
    [crossedDoor.profile.outline[2]!,crossedDoor.profile.outline[1]!];
  assert.throws(()=>builder.build(crossed),/outline disagrees/);
  const tilted=structuredClone(environment);
  const opening=tilted.openings.find((item)=>item.id==="hall-primary-door");
  assert.ok(opening);
  const boundary=tilted.boundaries.find((item)=>item.id===opening.boundary);
  assert.ok(boundary?.face);
  boundary.face.rotation.x=0.1;
  assert.throws(()=>builder.build(tilted),/not a level wall/);
  const nonfinite=structuredClone(environment);
  const changed=nonfinite.boundaries.find((item)=>item.id===opening.boundary);
  assert.ok(changed?.face);
  changed.face.origin.x=Number.NaN;
  assert.throws(()=>builder.build(nonfinite),/not a level wall/);
});
