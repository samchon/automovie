/** Numeric witnesses for the four reviewed exterior opening fillings. */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { ExteriorDoor } from "../models/exterior-door";
import { GarageDoor } from "../models/garage-door";
import { Gate } from "../models/gate";
const GATE_GROUND=-.45;

type Bounds = readonly [readonly [number,number],readonly [number,number],readonly [number,number]];
const bounds=(m:IAutoMovieMesh):Bounds=>{
  const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<m.positions.length;i+=3)
    for(let axis=0;axis<3;axis++){
      low[axis]=Math.min(low[axis]!,m.positions[i+axis]!);
      high[axis]=Math.max(high[axis]!,m.positions[i+axis]!);
    }
  return [
    [low[0]!, high[0]!],
    [low[1]!, high[1]!],
    [low[2]!, high[2]!],
  ];
};
const near=(a:number,b:number,tolerance=1e-8):void=>
  assert.ok(Math.abs(a-b)<=tolerance,`${a} is not ${b}`);
const meshOf=(model:IAutoMovieModel,id:string):IAutoMovieMesh=>{
  const part=model.parts.find((p)=>p.id===id);
  assert.equal(part?.geometry.type,"mesh",id);
  if(part?.geometry.type!=="mesh")throw new Error(`missing mesh ${id}`);
  return part.geometry.mesh;
};
const checked=(model:IAutoMovieModel,faces:Readonly<Record<string,string>>):void=>{
  assert.ok(model.parts.length>0);
  assert.equal(Object.keys(faces).length,model.parts.length);
  for(const part of model.parts){
    assert.ok(faces[part.id],`missing face for ${part.id}`);
    assert.equal(part.geometry.type,"mesh",part.id);
    if(part.geometry.type!=="mesh")continue;
    const m=part.geometry.mesh;
    assert.ok(m.positions.length>=9&&m.positions.length%3===0,part.id);
    assert.equal(m.normals?.length,m.positions.length,`${part.id} normals`);
    assert.equal(m.uvs?.length,m.positions.length/3*2,`${part.id} UVs`);
    assert.ok(m.indices&&m.indices.length%3===0,`${part.id} triangles`);
    assert.ok(
      [...m.positions,...m.normals!,...m.uvs!].every(Number.isFinite),
      `${part.id} finite geometry`,
    );
    for(let i=0;i<m.normals!.length;i+=3)
      near(Math.hypot(m.normals![i]!,m.normals![i+1]!,m.normals![i+2]!),1,1e-6);
    for(const index of m.indices!)assert.ok(
      index>=0&&index<m.positions.length/3,
      `${part.id} index`,
    );
    for(let i=0;i<m.indices!.length;i+=3){
      const a=m.indices![i]!*3,b=m.indices![i+1]!*3,c=m.indices![i+2]!*3;
      const ux=m.positions[b]!-m.positions[a]!,uy=m.positions[b+1]!-m.positions[a+1]!,
        uz=m.positions[b+2]!-m.positions[a+2]!;
      const vx=m.positions[c]!-m.positions[a]!,vy=m.positions[c+1]!-m.positions[a+1]!,
        vz=m.positions[c+2]!-m.positions[a+2]!;
      const cross=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
      const area=Math.hypot(...cross);
      assert.ok(area>1e-12,`${part.id} triangle ${i/3} degenerate`);
      const aligned=cross[0]!*m.normals![a]!+cross[1]!*m.normals![a+1]!+
        cross[2]!*m.normals![a+2]!;
      assert.ok(aligned>1e-12,`${part.id} triangle ${i/3} reversed`);
    }
  }
};

void test("front leaf fits its threshold and carries six distinct upper lites", ()=>{
  const built=new ExteriorDoor().buildFront();
  checked(built.model, built.faceByPart);
  near(bounds(meshOf(built.model,"leaf/bottom/leaf-exterior"))[1][0], .03);
  near(bounds(meshOf(built.model,"fixed/jamb/left/jamb"))[1][0], .02);
  near(
    bounds(meshOf(built.model,"fixed/exterior-trim/head/exterior-trim"))[1][1],
    2.30,
  );
  assert.equal(
    Object.values(built.faceByPart).filter((v)=>v==="glass").length,
    6,
  );
  const lite=meshOf(built.model, "leaf/glass/0-0/glass");
  near(bounds(lite)[0][0], -.35);
  near(bounds(lite)[0][1], -.13666666666666666);
  near(bounds(lite)[1][0], 1.30);
  near(bounds(lite)[1][1], 1.66);
  near(bounds(lite)[2][0], -.128);
  near(bounds(lite)[2][1], -.122);
  assert.deepEqual(
    new Set(Object.values(built.faceByPart)),
    new Set([
      "jamb",
      "exterior-trim",
      "casing",
      "leaf-exterior",
      "leaf-interior",
      "leaf-edge",
      "leaf-panel",
      "muntin",
      "glass",
      "hinge",
      "handle",
    ]),
  );
});

void test("front and garden hinge angles keep moving leaf geometry within authored sweeps",()=>{
  const doors=new ExteriorDoor();
  const closed=doors.buildFront(),open=doors.buildFront(Math.PI/2);
  const tipClosed=bounds(meshOf(closed.model,"leaf/bottom/leaf-exterior"));
  const tipOpen=bounds(meshOf(open.model,"leaf/bottom/leaf-exterior"));
  near(tipClosed[0][0],-.47);
  assert.ok(tipOpen[2][0]<-.9,`front leaf did not open inward: ${tipOpen[2][0]}`);
  near(tipOpen[0][1],.43,1e-8);
  assert.throws(()=>doors.buildFront(-.01),/outside/);
  assert.throws(()=>doors.buildFront(Math.PI),/outside/);
  const garden=doors.buildGarden();
  checked(garden.model,garden.faceByPart);
  assert.equal(Object.values(garden.faceByPart).filter((v)=>v==="glass").length,2);
  near(bounds(meshOf(garden.model,"left/glass/glass"))[0][0],-1.05);
  near(bounds(meshOf(garden.model,"right/glass/glass"))[0][1],1.05);
  near(bounds(meshOf(garden.model,"fixed/casing/head/casing"))[1][1],2.32);
  const openGarden=doors.buildGarden(Math.PI/2,Math.PI/2);
  const left=bounds(meshOf(openGarden.model,"left/bottom/leaf-exterior"));
  const right=bounds(meshOf(openGarden.model,"right/bottom/leaf-exterior"));
  assert.ok(left[2][1]>1.0&&right[2][1]>1.0,"garden leaves open outdoors");
  assert.throws(()=>doors.buildGarden(0,Infinity),/outside/);
});

void test("sectional garage panels retain their four fields and follow the analytic rail path",()=>{
  const garage=new GarageDoor(),closed=garage.build(),open=garage.build(2.30);
  checked(closed.model,closed.faceByPart);
  checked(open.model,open.faceByPart);
  assert.equal(Object.values(closed.faceByPart).filter((v)=>v==="glass").length,4);
  assert.equal(Object.values(closed.faceByPart).filter((v)=>v==="leaf-panel").length,12);
  near(closed.joints[0]!.y,0);
  near(closed.joints[4]!.y,2.15);
  near(open.joints[0]!.y,2.30);
  near(open.joints[1]!.y,2.60);
  near(open.joints[1]!.z,-.66-Math.sqrt(.5375**2-.30**2)+.30,1e-6);
  for(let k=0;k<4;k++)
    near(Math.hypot(open.joints[k+1]!.y-open.joints[k]!.y,
      open.joints[k+1]!.z-open.joints[k]!.z),.5375,1e-7);
  const panel=meshOf(closed.model,"panel-4/glass-0/glass");
  near(bounds(panel)[1][0],1.7475);
  near(bounds(panel)[1][1],2.015);
  near(bounds(panel)[2][0],-.338);
  near(bounds(panel)[2][1],-.332);
  const rail=meshOf(closed.model,"rail/left");
  assert.ok(bounds(rail)[0][0]>=-2.48&&bounds(rail)[0][1]<=-2.44);
  assert.throws(()=>garage.build(2.31),/outside/);
});

void test("gate has eight gapped boards and an inward ninety-degree clearance",()=>{
  const gate=new Gate(),closed=gate.build(GATE_GROUND),open=gate.build(GATE_GROUND,Math.PI/2);
  checked(closed.model,closed.faceByPart);
  checked(open.model,open.faceByPart);
  assert.deepEqual(new Set(Object.keys(closed.faceByPart).filter((id)=>id.startsWith("leaf-panel/"))
    .map((id)=>id.split("/")[1])),new Set(["1","2","3","4","5","6","7","8"]));
  for(let k=1;k<8;k++){
    const left=bounds(meshOf(closed.model,`leaf-panel/${k}`))[0];
    const right=bounds(meshOf(closed.model,k===7?"leaf-panel/8/middle":`leaf-panel/${k+1}`))[0];
    near(right[0]-left[1],.008);
  }
  near(bounds(meshOf(closed.model,"leaf-panel/1"))[1][0],GATE_GROUND+.05);
  near(bounds(meshOf(closed.model,"leaf-panel/8/middle"))[0][1],13.488);
  const far=bounds(meshOf(open.model,"leaf-panel/1"));
  assert.ok(far[2][0]<-1.2,"gate opens toward the garden");
  near(bounds(meshOf(closed.model,"hinge/1/knuckle"))[0][1],13.50,1e-8);
  assert.throws(()=>gate.build(GATE_GROUND,NaN),/outside/);
  assert.throws(()=>gate.build(NaN),/ground datum/);
});
