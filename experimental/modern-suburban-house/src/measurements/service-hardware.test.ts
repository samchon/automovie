/** Closed-volume and reservation tests derived from the service-room design. */
import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import type {IAutoMovieMesh} from "@automovie/interface";
import {ServiceRooms} from "../models/furnishings/service-rooms";
import {buildingModelFinish} from "../materials/model-bindings";
const require=createRequire(import.meta.url);
const {buildHouse}=require("../spaces/house.ts") as typeof import("../spaces/house");
const {ArchitecturalFitout}=require("../instances/architectural-fitout.ts") as typeof import("../instances/architectural-fitout");

const volume=(m:IAutoMovieMesh):number=>{
  let result=0;const edges=new Map<string,number>();
  const p=(i:number):number[]=>m.positions.slice(i*3,i*3+3);
  const key=(v:number[]):string=>v.map(n=>n.toFixed(8)).join(",");
  for(let i=0;i<m.indices!.length;i+=3){
    const vs=[p(m.indices![i]!),p(m.indices![i+1]!),p(m.indices![i+2]!)];
    const [a,b,c]=vs as [number[],number[],number[]];
    result+=(a[0]!*(b[1]!*c[2]!-b[2]!*c[1]!)+a[1]!*(b[2]!*c[0]!-b[0]!*c[2]!)+a[2]!*(b[0]!*c[1]!-b[1]!*c[0]!))/6;
    for(let j=0;j<3;j++){
      const from=key(vs[j]!),to=key(vs[(j+1)%3]!);
      const id=from<to?`${from}/${to}`:`${to}/${from}`;
      edges.set(id,(edges.get(id)??0)+(from<to?1:-1));
    }
  }
  for(const [edge,count] of edges)assert.equal(count,0,`open or reversed edge ${edge}`);
  return result;
};

void test("laundry slab closes the exact casing notch and cleat sockets without shared volume",()=>{
  const built=new ServiceRooms().laundryTop();
  const volumes=built.model.parts.map(part=>{
    assert.equal(part.geometry.type,"mesh");if(part.geometry.type!=="mesh")throw Error(part.id);
    assert.ok(buildingModelFinish(built.model.id,built.faceByPart[part.id]!).material.id);
    return volume(part.geometry.mesh);
  });
  const expected=.75*1.30*.06-.015*.07*.06-2*.03*.03*.04;
  assert.ok(Math.abs(volumes[0]!-expected)<1e-10);
  for(const v of volumes.slice(1))assert.ok(Math.abs(v-.03*.03*.04)<1e-10);
  assert.ok(Math.abs(volumes.reduce((a,b)=>a+b,0)-(.75*1.30*.06-.015*.07*.06))<1e-10);
});

void test("four mitred round hooks form watertight equal-volume joints against their wall plate",()=>{
  const built=new ServiceRooms().coatHooks();
  assert.equal(built.model.parts.length,5);
  const area=24/2*.006**2*Math.sin(2*Math.PI/24);
  for(const part of built.model.parts){
    assert.equal(part.geometry.type,"mesh");if(part.geometry.type!=="mesh")throw Error(part.id);
    const got=volume(part.geometry.mesh),want=part.id==="board"?.02*.10*.80:area*(.08+.025);
    assert.ok(Math.abs(got-want)<1e-10,`${part.id} ${got} != ${want}`);
    assert.equal(buildingModelFinish(built.model.id,built.faceByPart[part.id]!).material.id,part.id==="board"?"furniture-wood":"black-coated-metal");
  }
});

void test("the folding slab and wall hooks remain inside the actual laundry world reservations",()=>{
  const house=buildHouse(),built=new ArchitecturalFitout().build(house);
  const selected=built.instances.filter(i=>i.id==="laundry-folding-top"||i.id==="laundry-coat-hooks");
  assert.equal(selected.length,2);
  for(const instance of selected){
    const model=built.prototypes.find(p=>p.model.id===instance.modelId)!.model;
    const zone=house.spaces.flatMap(s=>s.reservations??[]).find(z=>z.id===instance.id)!;
    const t=instance.transform.translation!;
    for(const part of model.parts){
      assert.equal(part.geometry.type,"mesh");if(part.geometry.type!=="mesh")throw Error(part.id);
      const ps=part.geometry.mesh.positions;
      for(let k=0;k<ps.length;k+=3)for(const [j,axis] of (["x","y","z"] as const).entries()){
        const n=ps[k+j]!+t[axis],range=zone[axis]!;
        assert.ok(n>=range[0]-1e-8&&n<=range[1]+1e-8,`${instance.id}/${part.id}/${axis}`);
      }
    }
  }
});
