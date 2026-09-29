/** Geometric and refusal checks against the eleven reviewed interior door openings. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { InteriorDoor } from "../models/interior-door";

const doors = [
  ["hall-bedroom-three-door", 0.95, 0.15, "high", "knob"],
  ["hall-bedroom-two-door", 1, 0.15, "high", "knob"],
  ["service-laundry-door", 1.05, 0.15, "high", "recess"],
  ["entry-living-door", 1, 0.15, "low", "knob"],
  ["service-pantry-door", 0.95, 0.15, "low", "recess"],
  ["service-powder-door", 0.95, 0.15, "high", "knob"],
  ["hall-primary-door", 1, 0.15, "high", "knob"],
  ["hall-shower-door", 1, 0.15, "high", "knob"],
  ["hall-tub-door", 1, 0.15, "low", "knob"],
  ["primary-wardrobe-door", 1, 0.15, "low", "small-knob"],
  ["laundry-garage-door", 1.05, 0.25, "low", "recess"],
] as const;

const near=(a:number,b:number):boolean=>Math.abs(a-b)<1e-8;
const range=(numbers:readonly number[]):readonly [number,number]=>
  [Math.min(...numbers),Math.max(...numbers)];
const axis=(positions:readonly number[],index:number):readonly [number,number]=>
  range(positions.filter((_,i)=>i%3===index));

void test("all eleven door fillings retain their measured clear width and bound faces", ()=>{
  const builder=new InteriorDoor();
  for(const [id,width,wallThickness,side,handle] of doors) {
    const { model,faceByPart,hingePivot,angle,clearWidth }=builder.build({
      id,
      width,
      wallThickness,
      angle:0,
    });
    assert.equal(model.id, `interior-door:${id}`);
    assert.ok(near(clearWidth, width-0.10));
    assert.ok(near(angle, 0));
    assert.ok(near(hingePivot[0], side==="low" ? -width/2+0.03 : width/2-0.03));
    assert.deepEqual(
      new Set(Object.values(faceByPart)),
      new Set([
        "jamb-a",
        "jamb-b",
        "jamb-core",
        "casing-a",
        "casing-b",
        "leaf",
        "leaf-panel",
        "handle",
        "hinge",
      ]),
    );
    assert.equal(model.parts.length, Object.keys(faceByPart).length);
    assert.ok(model.parts.every((part)=>!part.id.includes("threshold")));
    assert.equal(
      model.parts.filter((part)=>part.id.startsWith("hinge/")).length,
      3,
    );
    assert.equal(
      model.parts.filter((part)=>part.id.startsWith("leaf/panel/")).length,
      2,
    );
    assert.equal(
      model.parts.filter((part)=>part.id.startsWith("handle/")).length,
      handle==="recess" ? 2 : 4,
    );
    for(const part of model.parts) {
      assert.equal(part.geometry.type, "mesh", `${id}/${part.id}`);
      if(part.geometry.type!=="mesh") throw new Error("not a mesh");
      const { positions,normals,uvs,indices }=part.geometry.mesh;
      assert.ok(faceByPart[part.id], `${id}/${part.id} binding`);
      assert.ok(positions.length>=9 && positions.length%3===0);
      assert.equal(normals?.length, positions.length);
      assert.equal(uvs?.length, positions.length/3*2);
      assert.ok(indices && indices.length>=3 && indices.length%3===0);
      assert.ok([...positions,...normals!,...uvs!].every(Number.isFinite));
      for(let i=0;i<indices!.length;i+=3) {
        const a=indices![i]!*3,b=indices![i+1]!*3,c=indices![i+2]!*3;
        const u=[
          positions[b]!-positions[a]!,
          positions[b+1]!-positions[a+1]!,
          positions[b+2]!-positions[a+2]!,
        ];
        const v=[
          positions[c]!-positions[a]!,
          positions[c+1]!-positions[a+1]!,
          positions[c+2]!-positions[a+2]!,
        ];
        const n=[
          u[1]!*v[2]!-u[2]!*v[1]!,
          u[2]!*v[0]!-u[0]!*v[2]!,
          u[0]!*v[1]!-u[1]!*v[0]!,
        ];
        const area=Math.hypot(...n);
        assert.ok(area>1e-12, `${id}/${part.id} nondegenerate triangle ${i/3}`);
        assert.ok(
          n[0]!*normals![a]!+n[1]!*normals![a+1]!+n[2]!*normals![a+2]!>0,
          `${id}/${part.id} outward winding ${i/3}`,
        );
      }
    }
  }
});

void test("jamb depth, recessed panels, knobs, garage floor and corner casing follow the design",()=>{
  const builder=new InteriorDoor();
  const built=builder.build({ id:"hall-primary-door",width:1,wallThickness:0.15,angle:0 });
  const part=(id:string)=>{
    const found=built.model.parts.find((item)=>item.id===id);
    if(!found || found.geometry.type!=="mesh") throw new Error(`missing ${id}`);
    return found.geometry.mesh.positions;
  };
  assert.deepEqual(axis(part("jamb/left/a"),2),[0,0]);
  assert.deepEqual(axis(part("jamb/left/b"),2),[-0.15,-0.15]);
  assert.ok(near(axis(part("leaf/panel/front"),2)[0],-0.008));
  assert.ok(near(axis(part("leaf/panel/back"),2)[1],-0.032));
  assert.ok(near(axis(part("handle/front/knob"),2)[1],0.056));
  assert.ok(near(axis(part("handle/back/knob"),2)[0],-0.096));
  const uv=(id:string,index:number)=>{
    const found=built.model.parts.find((item)=>item.id===id);
    if(found?.geometry.type!=="mesh" || found.geometry.mesh.uvs===null)
      throw new Error(`missing UVs: ${id}`);
    return range(found.geometry.mesh.uvs.filter((_,i)=>i%2===index));
  };
  assert.ok(near(uv("leaf/front",0)[1],0.94));
  assert.ok(near(uv("leaf/front",1)[1],2.16));
  assert.ok(near(uv("jamb/left/a",0)[1],2.17));
  assert.ok(near(uv("jamb/left/a",1)[1],0.03));
  assert.ok(near(uv("casing-a/left",0)[1],2.20));
  assert.ok(near(uv("casing-a/left",1)[1],0.07));
  assert.ok(near(uv("hinge/1",0)[1],2*Math.PI*0.009));
  assert.ok(near(uv("hinge/1",1)[1],0.08));
  const garage=builder.build({ id:"laundry-garage-door",width:1.05,wallThickness:0.25,angle:0 });
  const garageCasing=garage.model.parts.find((item)=>item.id==="casing-b/left");
  if(garageCasing?.geometry.type!=="mesh") throw new Error("missing garage casing");
  assert.ok(near(axis(garageCasing.geometry.mesh.positions,1)[0],-0.15));
  assert.ok(near(axis(garageCasing.geometry.mesh.positions,1)[1],2.20));
  const tub=builder.build({ id:"hall-tub-door",width:1,wallThickness:0.15,angle:0 });
  const tubCasing=tub.model.parts.find((item)=>item.id==="casing-b/right");
  if(tubCasing?.geometry.type!=="mesh") throw new Error("missing tub casing");
  const tubWidth=axis(tubCasing.geometry.mesh.positions,0);
  assert.ok(near(tubWidth[1]-tubWidth[0],0.05));
  const pantry=builder.build({ id:"service-pantry-door",width:0.95,wallThickness:0.15,angle:0 });
  const recess=pantry.model.parts.find((item)=>item.id==="handle/front/recess");
  if(recess?.geometry.type!=="mesh") throw new Error("missing recessed grip");
  assert.ok(near(axis(recess.geometry.mesh.positions,2)[0],-0.008));
  assert.ok(near(axis(recess.geometry.mesh.positions,2)[1],0));
});

void test("both hinge variants swing into local positive Z without widening the opening",()=>{
  const builder=new InteriorDoor();
  for(const [id,width,wallThickness,side] of doors) {
    const { model,hingePivot,angle }=builder.build({ id,width,wallThickness });
    assert.ok(near(angle,Math.PI/2));
    const leaf=model.parts.filter((part)=>part.id.startsWith("leaf/"));
    const coordinates=leaf.flatMap((part)=>{
      if(part.geometry.type!=="mesh") throw new Error("leaf not mesh");
      return part.geometry.mesh.positions;
    });
    const z=axis(coordinates,2),x=axis(coordinates,0);
    assert.ok(z[0]>=-1e-8 && near(z[1],width-0.06),id);
    assert.ok(side==="low" ? near(x[0],hingePivot[0]) && near(x[1],hingePivot[0]+0.04)
      : near(x[0],hingePivot[0]-0.04) && near(x[1],hingePivot[0]),id);
  }
});

void test("unknown ids and dimensions or angles outside the reviewed range are refused", ()=>{
  const build=(id:string,width:number,wallThickness:number,angle?:number)=>
    new InteriorDoor().build({ id, width, wallThickness, angle });
  assert.throws(()=> build("not-a-door", 1, 0.15), /unknown interior door/);
  assert.throws(
    ()=> build("hall-primary-door", 0.95, 0.15),
    /unsupported interior opening width/,
  );
  assert.throws(
    ()=> build("hall-primary-door", Number.NaN, 0.15),
    /unsupported interior opening width/,
  );
  assert.throws(
    ()=> build("hall-primary-door", 1, 0.25),
    /incorrect interior wall thickness/,
  );
  assert.throws(
    ()=> build("laundry-garage-door", 1.05, 0.15),
    /incorrect interior wall thickness/,
  );
  assert.throws(
    ()=> build("hall-primary-door", 1, 0.15, -0.01),
    /angle outside/,
  );
  assert.throws(
    ()=> build("hall-primary-door", 1, 0.15, Math.PI/2+0.01),
    /angle outside/,
  );
  assert.throws(
    ()=> build("hall-primary-door", 1, 0.15, Number.NaN),
    /angle outside/,
  );
});
