/** The box-union surface used by reviewed door apertures and roof tiles. */
import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectAutoMovieMeshTopology,
  validateMeshTopology,
} from "@automovie/engine";
import { TempleRectilinearUnion } from "../../models/rectilinear-union";

const p = (x:number,y:number,z:number)=>({ x,y,z });
const unit={ min:p(0,0,0),max:p(1,1,1) };

void test("rectilinear union preserves a single closed box", ()=>{
  const mesh=TempleRectilinearUnion.mesh("single", [unit]);
  const topology=inspectAutoMovieMeshTopology(mesh);
  assert.equal(topology.triangles, 12);
  assert.equal(topology.volume, 1);
  assert.equal(validateMeshTopology({ mesh }).success, true);
});

void test("rectilinear union removes a shared face", ()=>{
  const mesh=TempleRectilinearUnion.mesh("joined", [
    unit,
    { min:p(1, 0, 0), max:p(2, 1, 1) },
  ]);
  const topology=inspectAutoMovieMeshTopology(mesh);
  assert.equal(topology.volume, 2);
  assert.equal(topology.nonManifoldEdges, 0);
  assert.equal(validateMeshTopology({ mesh }).success, true);
});

void test("rectilinear union removes an overlapping interior", ()=>{
  const mesh=TempleRectilinearUnion.mesh("overlap", [
    unit,
    { min:p(0.5, 0.5, 0.5), max:p(1.5, 1.5, 1.5) },
  ]);
  const topology=inspectAutoMovieMeshTopology(mesh);
  assert.ok(Math.abs(topology.volume-1.875)<1e-9);
  assert.equal(validateMeshTopology({ mesh }).success, true);
});

void test("rectilinear union refuses edge-only contact", ()=>{
  assert.throws(
    ()=>
      TempleRectilinearUnion.mesh("edge", [
        unit,
        { min:p(1, 1, 0), max:p(2, 2, 1) },
      ]),
    /not a closed solid/,
  );
});

void test("rectilinear union refuses missing or flat solids", ()=>{
  assert.throws(()=> TempleRectilinearUnion.mesh("empty", []), /at least one/);
  assert.throws(
    ()=>
      TempleRectilinearUnion.mesh("flat", [{ min:p(0, 0, 0), max:p(1, 0, 1) }]),
    /positive solid extents/,
  );
});
