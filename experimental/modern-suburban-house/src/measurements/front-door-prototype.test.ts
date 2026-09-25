import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateModel } from "@automovie/engine";
import { buildFrontDoorPrototype, buildGardenDoorPrototype, frontDoorProfile } from "../models/exterior-door";

function hingeCentres(door:ReturnType<typeof buildFrontDoorPrototype>):number[] {
  return door.model.parts.filter((part)=>part.material==="hinge").map((part)=>{
    if(part.geometry.type!=="mesh") throw Error("hinge mesh missing");
    const y=part.geometry.mesh.positions.filter((_,index)=>index%3===1);
    return (Math.min(...y)+Math.max(...y))/2;
  });
}

test("entry infill makes six separate lites, both trim sides and no threshold", () => {
  const door=buildFrontDoorPrototype("front-door",1.00,2.20);
  const result=validateModel({model:door.model});
  assert.equal(result.success,true,result.success?"":JSON.stringify(result.violations));
  const count=(face:string)=>door.model.parts.filter((part)=>part.material===face).length;
  assert.equal(count("glass"),frontDoorProfile.gridColumns*frontDoorProfile.gridRows);
  assert.equal(count("exterior-trim"),3);
  assert.equal(count("casing"),3);
  assert.equal(count("hinge"),frontDoorProfile.hingeLevels.length);
  assert.deepEqual(hingeCentres(door).sort((a,b)=>a-b).map((y)=>Number(y.toFixed(6))),
    frontDoorProfile.hingeLevels.map((level)=>Number((0.03+level).toFixed(6))));
  assert.ok(count("leaf-panel")>0);
  assert.ok(!door.model.parts.some((part)=>/threshold/.test(part.id)));
  const panel=door.model.parts.find((part)=>part.material==="leaf-panel")!;
  if(panel.geometry.type!=="mesh") throw Error("panel mesh missing");
  const z=panel.geometry.mesh.positions.filter((_,index)=>index%3===2);
  assert.equal(Math.max(...z),-frontDoorProfile.leafWeatherInset-0.008);
});

test("entry infill refuses glassless dimensions", () => {
  assert.throws(()=>buildFrontDoorPrototype("bad",0.2,2.2),/cannot contain/);
  assert.throws(()=>buildFrontDoorPrototype("bad",1,1),/cannot contain/);
});

test("garden infill keeps two glazed leaves and six outer hinges", () => {
  const door=buildGardenDoorPrototype("garden-door",2.40,2.25);
  const result=validateModel({model:door.model});
  assert.equal(result.success,true,result.success?"":JSON.stringify(result.violations));
  const count=(face:string)=>door.model.parts.filter((part)=>part.material===face).length;
  assert.equal(count("glass"),2);
  assert.equal(count("hinge"),2*frontDoorProfile.hingeLevels.length);
  assert.deepEqual(hingeCentres(door).sort((a,b)=>a-b).map((y)=>Number(y.toFixed(6))),
    frontDoorProfile.hingeLevels.flatMap((level)=>[level,level]).sort((a,b)=>a-b)
      .map((level)=>Number((0.03+level).toFixed(6))));
  assert.equal(count("casing"),3);
  assert.equal(count("exterior-trim"),3);
  assert.ok(!door.model.parts.some((part)=>/threshold/.test(part.id)));
  assert.throws(()=>buildGardenDoorPrototype("bad",0.2,2.25),/cannot contain/);
});
