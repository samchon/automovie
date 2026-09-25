import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildHouseObjects, buildHousePrototypes, housePrototypeSpecs } from "../models/catalogue";
import { metricBeam, metricBox, metricCup, metricEllipsoid, metricFrustum, metricInvertedCup, metricOvalCup, metricRingZ } from "../models/parts";
import { buildPrototype } from "../models/templates";
import { auditPrototypePopulation, runRandomMutations } from "./prototype-audit";

test("metric generators reject impossible solids and produce aligned UVs", () => {
  assert.throws(() => metricBox([0,0,0],[0,1,1]));
  assert.throws(() => metricFrustum([0,0,0],0.1,0.1,0));
  const box=metricBox([-1,0,0],[1,0.5,1]);
  assert.equal(box.positions.length/3,24);
  assert.equal(box.indices?.length,36);
  assert.equal(box.uvs?.length,48);
  assert.deepEqual(box.uvs?.slice(0,8),[0,0,2,0,2,0.5,0,0.5]);
  const cylinder=metricFrustum([0,0,0],0.2,0.1,1,12);
  assert.equal(cylinder.uvs?.length,(cylinder.positions.length/3)*2);
  assert.equal(cylinder.indices?.length,12*12);
  for(const mesh of [
    metricBeam([0,0,0],[1,1,0],0.05,0.02),
    metricEllipsoid([0,0,0],[1,0.5,1]),
    metricRingZ([0,0,0],0.1,0.2,0.02),
    metricCup([0,0,0],0.1,0.14,0.1,0.008),
    metricOvalCup([0,0,0],0.1,0.14,0.1,0.008),
    metricInvertedCup([0,0,0],0.14,0.10,0.1,0.008),
  ]) {
    assert.ok(mesh.indices?.length);
    assert.equal(mesh.uvs?.length,mesh.positions.length/3*2);
  }
  assert.throws(()=>metricBeam([0,0,0],[0,0,0],0.05,0.02));
  assert.throws(()=>metricEllipsoid([0,0,0],[1,0,1]));
  assert.throws(()=>metricRingZ([0,0,0],0.2,0.1,0.02));
  assert.throws(()=>metricCup([0,0,0],0.1,0.14,0.1,0.11));
  assert.throws(()=>metricOvalCup([0,0,0],0.1,0.008,0.1,0.008));
  assert.throws(()=>metricInvertedCup([0,0,0],0.14,0.10,0.1,0.11));
});

test("separate room objects keep each reviewed face once", () => {
  const parents=buildHousePrototypes();
  const objects=buildHouseObjects(parents);
  assert.equal(objects.length,70);
  assert.ok(!objects.some((p)=>["porch-mat-planter","wall-art-indoor-plant","pantry-containers","kitchen-food-utensils","pendant-fixtures"].includes(p.id)));
  for(const [parentId,children] of [
    ["porch-mat-planter",["porch-mat","porch-planter"]],
    ["wall-art-indoor-plant",["wall-art","indoor-plant"]],
    ["pantry-containers",["pantry-container","pantry-box","pantry-basket"]],
    ["kitchen-food-utensils",["kitchen-cutting-board","kitchen-tool-cup","kitchen-food-jar","dining-fruit-bowl"]],
  ] as const) {
    const parent=parents.find((p)=>p.id===parentId)!;
    const split=children.map((id)=>objects.find((p)=>p.id===id)!);
    assert.equal(split.reduce((n,p)=>n+p.model.parts.length,0),parent.model.parts.length);
    assert.deepEqual(new Set(split.flatMap((p)=>p.bindings.map((b)=>b.surface))),new Set(parent.bindings.map((b)=>b.surface)));
    for(const object of split) {
      const positions=object.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
      const xs=positions.filter((_,i)=>i%3===0),zs=positions.filter((_,i)=>i%3===2);
      assert.ok(Math.abs(Math.min(...xs)+Math.max(...xs))<1e-9);
      assert.ok(Math.abs(Math.min(...zs)+Math.max(...zs))<1e-9);
    }
  }
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="porch-mat-planter")),/missing design host/);
  assert.throws(()=>buildHouseObjects(parents.filter((p)=>p.id!=="pendant-fixtures")),/missing design host/);
  const withoutMat=structuredClone(parents);
  const porch=withoutMat.find((p)=>p.id==="porch-mat-planter")!;
  porch.model.parts.splice(0,porch.model.parts.length,...porch.model.parts.filter((p)=>p.material!=="field"&&p.material!=="border"));
  assert.throws(()=>buildHouseObjects(withoutMat),/empty object/);
  const nonMesh=structuredClone(parents);
  const altered=nonMesh.find((p)=>p.id==="porch-mat-planter")!;
  altered.model.parts[0]!.geometry={type:"invalid"} as unknown as typeof altered.model.parts[0]["geometry"];
  assert.throws(()=>buildHouseObjects(nonMesh),/non-mesh component/);
  const withoutBinding=parents.map((p)=>p.id==="porch-mat-planter"?{...p,bindings:p.bindings.slice(1)}:p);
  assert.throws(()=>buildHouseObjects(withoutBinding),/incomplete extracted material faces/);
  const extraBinding=parents.map((p)=>p.id==="porch-mat-planter"?{...p,bindings:[...p.bindings,{...p.bindings[0]!,surface:"orphan-face"}]}:p);
  assert.throws(()=>buildHouseObjects(extraBinding),/unassigned object face/);
  const towels=objects.find((p)=>p.id==="linen-folded-towels")!;
  assert.equal(towels.model.parts.length,2);
  const towelYs=towels.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions.filter((_,i)=>i%3===1):[]);
  assert.equal(Math.min(...towelYs),0);
  assert.equal(Math.max(...towelYs),0.12);
  for(const [id,width,drop] of [["island-pendant",0.28,0.80],["dining-pendant",0.48,1.20]] as const) {
    const object=objects.find((p)=>p.id===id)!;
    const positions=object.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
    const xs=positions.filter((_,i)=>i%3===0),ys=positions.filter((_,i)=>i%3===1);
    assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-width)<1e-9);
    assert.ok(Math.abs(Math.min(...ys)+drop)<1e-9);
    assert.equal(Math.max(...ys),0);
  }
});

test("ceiling pendant lives below its origin and rejects an upward escape", () => {
  const models=buildHousePrototypes();
  const pendant=models.find((p)=>p.id==="pendant-fixtures")!;
  const positions=pendant.model.parts.flatMap((part)=>part.geometry.type==="mesh"?part.geometry.mesh.positions:[]);
  const ys=positions.filter((_,i)=>i%3===1);
  assert.equal(Math.min(...ys),-1.20);
  assert.equal(Math.max(...ys),0);
  const geometry=pendant.model.parts.find((part)=>part.material==="fixture-shade")!.geometry;
  if(geometry.type!=="mesh") throw Error("expected shade mesh");
  for(let i=1;i<geometry.mesh.positions.length;i+=3) geometry.mesh.positions[i]+=2;
  assert.ok(auditPrototypePopulation(models).failures.some((line)=>line.includes("pendant-fixtures")&&line.includes("outside declared model envelope")));
});

test("every design H2 has one generated prototype, source owner and face bindings", () => {
  const report=auditPrototypePopulation(buildHousePrototypes());
  assert.ok(report.designed>0);
  assert.equal(report.accounted,report.designed);
  assert.equal(report.built,report.designed);
  assert.ok(report.measuredParts>300);
  assert.equal(report.failures.length,0,report.failures.join("\n"));
  assert.ok(!buildHousePrototypes().some((p)=>/car|automobile|vehicle/.test(p.id)));
});

test("every declared furniture finish binds its own fallback, scale, and roughness", () => {
  const models=new Map(buildHousePrototypes().map((p)=>[p.id,p]));
  const expected={
    "furniture-wood":{fallback:0xa87a4e,scale:[1,1],roughness:0.50},
    upholstery:{fallback:0xb7afa3,scale:[0.01,0.01],roughness:0.92},
  } as const;
  let checked=0;
  for(const spec of housePrototypeSpecs) for(const [surface,role] of Object.entries(spec.finishes??{})) {
    const model=models.get(spec.id)!;
    const binding=model.bindings.find((b)=>b.surface===surface);
    const material=model.model.materials.find((m)=>m.id===surface);
    assert.ok(binding,`${spec.id}/${surface}: missing binding`);
    assert.ok(material,`${spec.id}/${surface}: missing material`);
    assert.equal(binding.fallback,expected[role].fallback);
    assert.deepEqual(binding.scale,expected[role].scale);
    assert.equal(material.roughness,expected[role].roughness);
    checked++;
  }
  assert.ok(checked>0);
});

test("face and metric UV defects are rejected across the whole population", () => {
  const altered=buildHousePrototypes();
  const prototype=altered.find((p)=>p.model.parts.length>1)!;
  prototype.model.parts[0]!.material="unowned-surface";
  assert.ok(auditPrototypePopulation(altered).failures.some((line)=>line.includes("extra face")));
  const another=buildHousePrototypes();
  const mesh=another[0]!.model.parts[0]!.geometry;
  if(mesh.type!=="mesh") throw Error("expected mesh");
  mesh.mesh.uvs=null;
  assert.ok(auditPrototypePopulation(another).failures.some((line)=>line.includes("incomplete mesh attributes")));
});

test("collapsed UVs fail on an otherwise valid mesh", () => {
  const altered=buildHousePrototypes();
  const geometry=altered[0]!.model.parts[0]!.geometry;
  if(geometry.type!=="mesh") throw Error("expected mesh");
  geometry.mesh.uvs!.fill(0);
  assert.ok(auditPrototypePopulation(altered).failures.some((line)=>line.includes("collapsed metric UV triangle")));
});

test("surface projections and duplicate bindings fail", () => {
  const altered=buildHousePrototypes();
  const first=altered[0]!;
  Object.assign(first.bindings[0]!,{uv:"invalid"});
  first.bindings=[...first.bindings,first.bindings[0]!];
  const failures=auditPrototypePopulation(altered).failures;
  assert.ok(failures.some((line)=>line.includes("unknown UV projection")));
  assert.ok(failures.some((line)=>line.includes("duplicate surface binding")));
});

test("template refuses unmade surfaces and nonpositive dimensions", () => {
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,1,1],faces:["unknown"]}),/unbuilt surfaces/);
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,0,1],faces:["top"]}),/invalid dimensions/);
});

test("fresh random part mutations go red", () => {
  const result=runRandomMutations(2);
  assert.equal(result.red,2);
  assert.deepEqual(result.types,{shift:1,float:1,delete:0,overlap:0});
});
