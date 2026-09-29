/** Geometric invariants for split finishes and the fixed light bodies. */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { IAutoMovieMesh } from "@automovie/interface";
import { WallTilePartitions } from "../materials/wall-tile-partitions";
import { LightingFixtures } from "../models/lighting-fixtures";

const wall=(y0:number,y1:number,z0:number,z1:number):IAutoMovieMesh=>({
  positions:[-5.5,y0,z0,-5.5,y1,z0,-5.5,y1,z1,-5.5,y0,z1],
  normals:[1,0,0,1,0,0,1,0,0,1,0,0],indices:[0,1,2,0,2,3],
  uvs:[0,0,0,y1-y0,z1-z0,y1-y0,z1-z0,0],skin:null,
});
const area=(mesh:IAutoMovieMesh):number=>{
  const p=mesh.positions,i=mesh.indices!;let sum=0;
  for(let k=0;k<i.length;k+=3){
    const a=i[k]!*3,b=i[k+1]!*3,c=i[k+2]!*3;
    const u=[0,1,2].map(j=>p[b+j]!-p[a+j]!),v=[0,1,2].map(j=>p[c+j]!-p[a+j]!);
    const cross=[u[1]!*v[2]!-u[2]!*v[1]!,u[2]!*v[0]!-u[0]!*v[2]!,u[0]!*v[1]!-u[1]!*v[0]!];
    const size=Math.hypot(...cross);assert.ok(size>1e-12,"degenerate triangle");
    const n=mesh.normals!.slice(a,a+3);assert.ok(cross.reduce((s,x,j)=>s+x*n[j]!,0)>0,"winding disagrees with outward normal");
    sum+=size/2;
  }
  assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.normals!.every(Number.isFinite));
  return sum;
};
const near=(a:number,b:number):void=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

void test("backsplash partitions conserve triangle area and linearly interpolated UVs",()=>{
  const source=wall(.5,2,-10,-7),split=new WallTilePartitions().build({id:"left-wall-back",role:"wall"},source);
  assert.ok(split.tile);near(area(split.tile),2.4*.54);near(area(split.paint)+area(split.tile),4.5);
  for(const mesh of [split.paint,split.tile])for(let k=0;k<mesh.positions.length/3;k++){
    near(mesh.uvs![k*2]!,mesh.positions[k*3+2]!+10);near(mesh.uvs![k*2+1]!,mesh.positions[k*3+1]!-.5);
  }
  const dry={...source,positions:source.positions.map((v,i)=>i%3===0?-5.4:v)};
  assert.equal(new WallTilePartitions().build({id:"dry-wall",role:"partition"},dry).tile,null);
  assert.equal(new WallTilePartitions().build({id:"ceiling",role:"ceiling"},source).paint,source);
  for(const invalid of [{...source,normals:null},{...source,indices:null},{...source,skin:{joints:[],boneIndices:[],weights:[]}}])
    assert.throws(()=>new WallTilePartitions().build({id:"bad",role:"wall"},invalid),/unskinned indexed normals/);
});

void test("only the upper bedroom side of the chimney receives interior paint",()=>{
  const source=wall(0,8.9,-2.75,-1.65),maker=new WallTilePartitions();
  const result=maker.chimney({id:"chimney-body",role:"chimney"},source);assert.ok(result.paint);
  near(area(result.paint),2.6*1.1);near(area(result.paint)+area(result.masonry),8.9*1.1);
  for(let k=1;k<result.paint.positions.length;k+=3)assert.ok(result.paint.positions[k]!>=3.06-1e-8&&result.paint.positions[k]!<=5.66+1e-8);
  assert.equal(maker.chimney({id:"fireplace-head",role:"chimney"},source).paint,null);
  assert.equal(maker.chimney({id:"chimney-body",role:"wall"},source).paint,null);
  const exterior={...source,normals:source.normals!.map((v,i)=>i%3===0?-1:v),indices:[0,2,1,0,3,2]};
  assert.equal(maker.chimney({id:"chimney-body",role:"chimney"},exterior).paint,null);
});

void test("all six fixed fixture prototypes have finite nondegenerate outward triangles",()=>{
  const maker=new LightingFixtures();
  for(const built of [maker.flush(),maker.flush(true),maker.pendant("island"),maker.pendant("dining"),maker.vanity(),maker.porch()]){
    assert.ok(built.model.parts.length>0);
    for(const part of built.model.parts){assert.equal(part.geometry.type,"mesh");if(part.geometry.type!=="mesh")throw new Error(part.id);area(part.geometry.mesh);}
  }
});
