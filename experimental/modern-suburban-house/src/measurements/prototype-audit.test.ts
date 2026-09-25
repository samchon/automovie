import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildHouseObjects, buildHousePrototypes } from "../models/catalogue";
import { metricBeam, metricBox, metricCup, metricEllipsoid, metricFrustum, metricOvalCup, metricRingZ } from "../models/parts";
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
  ]) {
    assert.ok(mesh.indices?.length);
    assert.equal(mesh.uvs?.length,mesh.positions.length/3*2);
  }
  assert.throws(()=>metricBeam([0,0,0],[0,0,0],0.05,0.02));
  assert.throws(()=>metricEllipsoid([0,0,0],[1,0,1]));
  assert.throws(()=>metricRingZ([0,0,0],0.2,0.1,0.02));
  assert.throws(()=>metricCup([0,0,0],0.1,0.14,0.1,0.11));
  assert.throws(()=>metricOvalCup([0,0,0],0.1,0.008,0.1,0.008));
});

test("separate porch and wall objects keep each reviewed face once", () => {
  const parents=buildHousePrototypes();
  const objects=buildHouseObjects(parents);
  assert.equal(objects.length,64);
  assert.ok(!objects.some((p)=>p.id==="porch-mat-planter"||p.id==="wall-art-indoor-plant"));
  for(const [parentId,children] of [
    ["porch-mat-planter",["porch-mat","porch-planter"]],
    ["wall-art-indoor-plant",["wall-art","indoor-plant"]],
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

test("template refuses unmade surfaces and nonpositive dimensions", () => {
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,1,1],faces:["unknown"]}),/unbuilt surfaces/);
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,0,1],faces:["top"]}),/invalid dimensions/);
});

test("fresh random part mutations go red", () => {
  const result=runRandomMutations(2);
  assert.equal(result.red,2);
  assert.deepEqual(result.types,{shift:1,float:1,delete:0,overlap:0});
});
