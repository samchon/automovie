import assert from "node:assert/strict";
import { tessellateToMesh } from "@automovie/engine";
import { ellipsoidMetricMesh } from "../materials/ellipsoid-uv";

export function verifyEllipsoidUv(): void {
  const sphere=tessellateToMesh({type:"sphere",radius:.5});
  const scale={x:2,y:1,z:3};
  const result=ellipsoidMetricMesh(sphere,scale);
  assert.deepEqual(result.positions.slice(0,sphere.positions.length),sphere.positions);
  assert.deepEqual(result.normals!.slice(0,sphere.normals!.length),sphere.normals);
  assert.equal(result.indices!.length,sphere.indices!.length);
  assert.ok(result.positions.length>sphere.positions.length);
  assert.ok(result.uvs!.every(Number.isFinite));
  assert.deepEqual(result,ellipsoidMetricMesh(sphere,scale));
  const equatorY=Math.min(...sphere.positions.filter((_,i)=>i%3===1).map(Math.abs));
  const equator:number[]=[];
  for(let i=0;i<sphere.positions.length;i+=3) if(Math.abs(sphere.positions[i+1]!)===equatorY) equator.push(i/3);
  assert.ok(equator.length>4);
  const seam=equator.reduce((a,b)=>sphere.positions[a*3+2]!<sphere.positions[b*3+2]!?a:b);
  assert.equal(result.uvs![seam*2],0);
  const measured=equator.slice(0,-1).reduce((length,index,j)=>{
    const next=equator[(j+1)%(equator.length-1)]!;
    return length+Math.hypot((sphere.positions[index*3]!-sphere.positions[next*3]!)*scale.x,(sphere.positions[index*3+2]!-sphere.positions[next*3+2]!)*scale.z);
  },0);
  const seamCopies:number[]=[];
  for(let i=sphere.positions.length;i<result.positions.length;i+=3) if(result.positions.slice(i,i+3).every((n,k)=>n===sphere.positions[seam*3+k])) seamCopies.push(i/3);
  assert.ok(seamCopies.some(i=>Math.abs(result.uvs![i*2]!-measured)<1e-10));
  assert.throws(()=>ellipsoidMetricMesh({...sphere,normals:null},scale));
  assert.throws(()=>ellipsoidMetricMesh({...sphere,colors:[]},scale));
  assert.throws(()=>ellipsoidMetricMesh(sphere,{...scale,z:0}));
  assert.throws(()=>ellipsoidMetricMesh(tessellateToMesh({type:"box",width:1,height:1,depth:1}),scale));
}
