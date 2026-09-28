/** Fixed sanitary bodies stay within their source-owned room reservations. */
import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {buildingModelFinish} from "../materials/model-bindings";
import {SanitaryFittings} from "../models/furnishings/sanitary-fittings";
const require=createRequire(import.meta.url);
const {buildHouse}=require("../spaces/house.ts") as typeof import("../spaces/house");
const {ArchitecturalFitout}=require("../instances/architectural-fitout.ts") as typeof import("../instances/architectural-fitout");

void test("all sanitary prototype faces resolve to one authored finish",()=>{
  const f=new SanitaryFittings();
  for(const built of [f.toilet(),f.mirror(.60),f.mirror(.70),f.mirror(.85),f.towelBar(.25,.40),f.towelBar(.50,.30),f.towelBar(.75,.40),f.curtainRail()])
    for(const face of Object.values(built.faceByPart))assert.ok(buildingModelFinish(built.model.id,face).material.id);
});

void test("three toilets, mirrors and towel bars plus the rail fit their world reservations",()=>{
  const house=buildHouse(),built=new ArchitecturalFitout().build(house);
  const prototypes=new Map(built.prototypes.map(p=>[p.model.id,p.model]));
  const reservations=new Map(house.spaces.flatMap(s=>s.reservations??[]).map(z=>[z.id,z]));
  const selected=built.instances.filter(i=>/-(toilet|mirror|towel)$|curtain-rail$/.test(i.id));
  assert.equal(selected.length,10);
  for(const instance of selected){
    const model=prototypes.get(instance.modelId)!,zone=reservations.get(instance.id)!;
    assert.ok(model&&zone);
    const q=instance.transform.rotation!,t=instance.transform.translation!;
    const yaw=2*Math.atan2(q.y,q.w),sin=Math.sin(yaw),cos=Math.cos(yaw);
    for(const part of model.parts){
      assert.equal(part.geometry.type,"mesh");if(part.geometry.type!=="mesh")throw Error(part.id);
      const p=part.geometry.mesh.positions;
      for(let k=0;k<p.length;k+=3){
        const world=[t.x+cos*p[k]!+sin*p[k+2]!,t.y+p[k+1]!,t.z-sin*p[k]!+cos*p[k+2]!];
        for(const [j,axis] of (["x","y","z"] as const).entries()){
          const range=zone[axis]!;
          assert.ok(world[j]!>=range[0]-1e-7&&world[j]!<=range[1]+1e-7,`${instance.id}/${part.id} ${axis}=${world[j]} outside ${range}`);
        }
      }
    }
  }
});
