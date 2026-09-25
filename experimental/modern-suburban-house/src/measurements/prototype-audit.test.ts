import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildHousePrototypes } from "../models/catalogue";
import { metricBeam, metricBox, metricCup, metricEllipsoid, metricFrustum, metricRingZ } from "../models/parts";
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
  ]) {
    assert.ok(mesh.indices?.length);
    assert.equal(mesh.uvs?.length,mesh.positions.length/3*2);
  }
  assert.throws(()=>metricBeam([0,0,0],[0,0,0],0.05,0.02));
  assert.throws(()=>metricEllipsoid([0,0,0],[1,0,1]));
  assert.throws(()=>metricRingZ([0,0,0],0.2,0.1,0.02));
  assert.throws(()=>metricCup([0,0,0],0.1,0.14,0.1,0.11));
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

test("template refuses unmade surfaces and nonpositive dimensions", () => {
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,1,1],faces:["unknown"]}),/unbuilt surfaces/);
  assert.throws(()=>buildPrototype({id:"sample",design:"sample.md",owner:"sample.ts",kind:"table",size:[1,0,1],faces:["top"]}),/invalid dimensions/);
});

test("fresh random part shifts, floating, deletion and overlap go red", () => {
  const result=runRandomMutations(4);
  assert.equal(result.red,4);
  assert.deepEqual(result.types,{shift:1,float:1,delete:1,overlap:1});
});
