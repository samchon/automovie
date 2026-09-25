import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateModel } from "@automovie/engine";
import { buildGatePrototype, gateProfile } from "../models/gate";

test("gate plank gaps stay open and the model owns no post", () => {
  const model=buildGatePrototype("side-yard-gate",1.18,1.65);
  const result=validateModel({model:model.model});
  assert.equal(result.success,true,result.success?"":JSON.stringify(result.violations));
  const planks=model.model.parts.filter((part)=>part.material==="leaf-panel");
  assert.equal(planks.length,gateProfile.plankCount);
  const spans=planks.map((part)=>{
    if(part.geometry.type!=="mesh") throw Error("plank mesh missing");
    const xs=part.geometry.mesh.positions.filter((_,index)=>index%3===0);
    return [Math.min(...xs),Math.max(...xs)] as const;
  });
  for(let index=1;index<spans.length;index++)
    assert.ok(Math.abs(spans[index]![0]-spans[index-1]![1]-gateProfile.gap)<1e-9);
  assert.deepEqual([...new Set(model.bindings.map((binding)=>binding.surface))].sort(),
    ["gate-batten","handle","hinge","leaf-panel"].sort());
  assert.ok(!model.model.parts.some((part)=>/post|header/.test(part.id)));
  for(const hinge of model.model.parts.filter((part)=>part.material==="hinge")) {
    if(hinge.geometry.type!=="mesh") throw Error("hinge mesh missing");
    const axis=(n:number)=>hinge.geometry.mesh.positions.filter((_,index)=>index%3===n);
    const span=(n:number)=>Math.max(...axis(n))-Math.min(...axis(n));
    assert.ok(Math.abs(span(0)-2*gateProfile.hingeRadius)<1e-9);
    assert.ok(Math.abs(span(1)-gateProfile.hingeHeight)<1e-9);
  }
});

test("gate refuses a reservation that cannot contain its hardware", () => {
  assert.throws(()=>buildGatePrototype("bad",1.18,1.2),/invalid gate reservation/);
  assert.throws(()=>buildGatePrototype("bad",0.01,1.65),/invalid gate reservation/);
});
