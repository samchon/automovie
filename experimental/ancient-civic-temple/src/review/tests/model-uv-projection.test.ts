import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../../geometry/object-mesh";
import { TempleFixtures } from "../../models/fixtures";
import { TempleLandscape } from "../../models/landscape";
import { TemplePortable } from "../../models/portable";
import { TempleWares } from "../../models/wares";

const mesh=(model:IAutoMovieModel,id:string):IAutoMovieMesh=>{
  const geometry=model.parts.find((part)=>part.id===id)?.geometry;
  assert.ok(geometry?.type==="mesh",`${model.id}/${id}: missing mesh`);
  return geometry.mesh;
};
type Vertex={x:number;y:number;z:number;u:number;v:number;nx:number;ny:number;nz:number};
const vertices=(part:IAutoMovieMesh):Vertex[]=>{
  const {positions,normals,uvs}=part;
  assert.ok(normals&&uvs,"UV0 and normals are required");
  return Array.from({length:positions.length/3},(_,i)=>({
    x:positions[3*i]!,y:positions[3*i+1]!,z:positions[3*i+2]!,
    u:uvs[2*i]!,v:uvs[2*i+1]!,
    nx:normals[3*i]!,ny:normals[3*i+1]!,nz:normals[3*i+2]!,
  }));
};
const close=(actual:number,expected:number)=>
  assert.ok(Math.abs(actual-expected)<1e-6,`${actual} differs from ${expected}`);
const span=(values:number[])=>Math.max(...values)-Math.min(...values);

void test("wooden long faces use their local long direction as U",()=>{
  const fixture=new TempleFixtures(),portable=new TemplePortable();
  for(const [model,id,axis] of [
    [fixture.desk("writing"),"leg","y"],
    [fixture.displayShelf("offering"),"side","y"],
    [fixture.stool(),"leg","y"],
    [portable.jarRack(),"leg","y"],
    [portable.handcart(),"support","y"],
  ] as const){
    const face=vertices(mesh(model,id)).filter((vertex)=>vertex.nz>0.99);
    assert.ok(face.length>=4,`${model.id}/${id}: no front face`);
    close(span(face.map((vertex)=>vertex.u)),span(face.map((vertex)=>vertex[axis])));
    for(const vertex of face)
      close(vertex.u,vertex.y-Math.min(...face.map((item)=>item.y)));
  }
  const sheet=vertices(mesh(new TempleWares().scroll("open"),"sheet"))
    .filter((vertex)=>vertex.ny>0.99&&Math.abs(vertex.y-0.002)<1e-8);
  assert.ok(sheet.length>=4,"open scroll has no upper sheet face");
  close(span(sheet.map((vertex)=>vertex.u)),0.35);
  for(const vertex of sheet)close(vertex.u,vertex.z+0.175);
});

void test("X-axis scroll, axle, and wheel unfold circumference U and axial V",()=>{
  const m=new ObjectMesh();
  m.cylinder("sample",{x:-0.2,y:0,z:0},{x:0.2,y:0,z:0},0.1,16,"x");
  const part=vertices(mesh(m.model("sample","sample"),"sample"));
  const side=part.filter((vertex)=>Math.abs(vertex.nx)<0.99);
  const seam=side.filter((vertex)=>Math.abs(vertex.z-0.1)<1e-8&&Math.abs(vertex.y)<1e-8);
  assert.ok(seam.some((vertex)=>Math.abs(vertex.u)<1e-8&&Math.abs(vertex.v)<1e-8));
  assert.ok(seam.some((vertex)=>Math.abs(vertex.u)<1e-8&&Math.abs(vertex.v-0.4)<1e-8));
  assert.ok(side.some((vertex)=>Math.abs(vertex.y-0.1)<1e-8&&
    Math.abs(vertex.u-Math.PI*0.1/2)<1e-8));
  for(const [model,id,axial] of [
    [new TempleWares().scroll("rolled"),"sheet",0.28],
    [new TemplePortable().handcart(),"axle",0.68],
    [new TemplePortable().handcart(),"wheel",0.08],
  ] as const){
    const side=vertices(mesh(model,id)).filter((vertex)=>Math.abs(vertex.nx)<0.99);
    assert.ok(side.length>0,`${model.id}/${id}: no cylinder side`);
    close(span(side.map((vertex)=>vertex.v)),axial);
    assert.ok(side.some((vertex)=>Math.abs(vertex.u)<1e-8));
  }
  assert.throws(()=>new ObjectMesh().cylinder("bad",{x:0,y:0,z:0},{x:0,y:0,z:0},1),/원통 입력/);
  assert.throws(()=>new ObjectMesh().cylinder("bad",{x:0,y:0,z:0},{x:1,y:0,z:0},0),/원통 입력/);
  assert.throws(()=>new ObjectMesh().cylinder("bad",{x:0,y:0,z:0},{x:1,y:0,z:0},1,2),/원통 입력/);
  assert.throws(()=>new ObjectMesh().cylinder("bad",{x:0,y:0,z:0},{x:0,y:1,z:0},1,16,"x"),/X축 원통/);
});

void test("oblique branches project the +X seam and fall back to +Y on an X axis",()=>{
  for(const [end,radius,seam] of [
    [{x:1,y:1,z:0},0.08,{x:1/Math.sqrt(2),y:-1/Math.sqrt(2),z:0}],
    [{x:1,y:0,z:0},0.08,{x:0,y:1,z:0}],
  ] as const){
    const builder=new ObjectMesh();
    builder.cylinder("branch",{x:0,y:0,z:0},end,radius,8);
    const length=Math.hypot(end.x,end.y,end.z);
    const side=vertices(mesh(builder.model("branch","branch"),"branch"))
      .filter((v)=>Math.abs((v.nx*end.x+v.ny*end.y+v.nz*end.z)/length)<0.1);
    const start=side.find((v)=>Math.abs(v.u)<1e-8&&Math.abs(v.v)<1e-8);
    assert.ok(start,"projected seam start missing");
    close(start.x,radius*seam.x);
    close(start.y,radius*seam.y);
    close(start.z,radius*seam.z);
    close(span(side.map((v)=>v.v)),length);
  }
});

void test("neighbor roof top UV runs outward U and uphill V on each slope",()=>{
  const source=new TempleLandscape();
  for(const kind of ["gable","shed"] as const){
    const roof=vertices(mesh(source.neighborHouse(kind),"roof"));
    const slope=kind==="gable"?22*Math.PI/180:12*Math.PI/180;
    const tops=roof.filter((vertex)=>vertex.ny>0.8&&Math.abs(vertex.nz)>0.1);
    assert.ok(tops.length>=(kind==="gable"?8:4),`${kind}: roof top missing`);
    for(const vertex of tops){
      const rear=kind==="gable"&&vertex.nz<0;
      close(vertex.u,rear?4.3-vertex.x:vertex.x+(kind==="gable"?4.3:3.3));
      close(vertex.v,(rear?vertex.z+3.3:(kind==="gable"?3.3:3.8)-vertex.z)/Math.cos(slope));
    }
    assert.ok(tops.some((vertex)=>Math.abs(vertex.v)<1e-8),`${kind}: eave datum`);
  }
});
