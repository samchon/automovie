// Exhaustively build every reviewed model state and inspect its source mesh.
// build-model-catalog.cts --check separately compares records to the docs.
import fs from "node:fs";

import path from "node:path";

import { modelMaterialFor } from "../materials/model-bindings";

/** Every catalog exports the same reviewed model-owner static API. */
type ModelOwner = Pick<typeof import("../models/001-seating-and-work").Models001, "catalog" | "build">;
const root = path.resolve(__dirname, "../..");
const sourceFiles = fs.readdirSync(path.join(root, "src/models"))
  .filter(name => /^00[1-5]-.*\.ts$/.test(name)).sort((a, b) => a.localeCompare(b));
const expectedFiles = fs.readdirSync(path.join(root, "docs/models"))
  .filter(name => /^00[1-5]-.*\.md$/.test(name)).length;
if (sourceFiles.length !== expectedFiles) throw Error(`model source file coverage ${sourceFiles.length}/${expectedFiles}`);
const allPrototypes: import("../models/representation").ModelPrototype[] = sourceFiles.flatMap(name => {
  const Klass = Object.values(require(path.join(root, "src/models", name)) as Record<string, ModelOwner>)[0];
  return Klass.catalog();
});

function inspect(part: import("@automovie/interface").IAutoMovieModelPart, record: import("../models/representation").ModelPartRecord, label: string) {
  if (!record || part.id !== record.id) throw Error(`${label}: part identity mismatch`);
  if (part.geometry.type !== "mesh") throw Error(`${label}: no explicit UV-capable mesh`);
  const mesh = part.geometry.mesh;
  if (!mesh.positions.length || mesh.positions.length % 3 ||
    mesh.normals?.length !== mesh.positions.length ||
    mesh.uvs?.length !== mesh.positions.length / 3 * 2 ||
    !mesh.indices?.length || mesh.indices.length % 3) throw Error(`${label}: missing or unaligned mesh attributes`);
  if (![...mesh.positions, ...mesh.normals, ...mesh.uvs].every(Number.isFinite)) throw Error(`${label}: nonfinite vertex attribute`);
    const axes: Array<["x"|"y"|"z", 0|1|2]> = [["x", 0], ["y", 1], ["z", 2]];
  for (const [axis, index] of axes) {
    const values = mesh.positions.filter((_, i) => i % 3 === index);
    if (Math.abs(Math.min(...values) - record[axis][0]) > 0.000001 ||
      Math.abs(Math.max(...values) - record[axis][1]) > 0.000001) throw Error(`${label}: ${axis} AABB differs from @part`);
  }
  const indices = mesh.indices;
  if (!indices) throw Error(`${label}: missing indices`);
    const weldedEdges: Map<string, number> = new Map();
    const vertexKey = (index: number) => mesh.positions.slice(index*3, index*3+3)
    .map(value => Math.round(value*1e8)).join(",");
  for (let i = 0; i < indices.length; i += 3) {
        const point = (k: number) => {
      const index = indices[i + k];
      if (!Number.isInteger(index) || index < 0 || index >= mesh.positions.length / 3) throw Error(`${label}: invalid index`);
      return mesh.positions.slice(index * 3, index * 3 + 3);
    };
    const a = point(0), b = point(1), c = point(2);
    const ab = b.map((v,j) => v-a[j]), ac = c.map((v,j) => v-a[j]);
    const cross = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
    if (Math.hypot(...cross) < 1e-15) throw Error(`${label}: degenerate triangle ${i/3}`);
    const normal = mesh.normals.slice(indices[i]*3, indices[i]*3+3);
    if (cross.reduce((sum,value,j) => sum + value*normal[j], 0) < -1e-15) throw Error(`${label}: reversed triangle ${i/3}`);
    const triangle = indices.slice(i,i+3).map(vertexKey);
    for (let j=0;j<3;j++) {
      const edge=[triangle[j],triangle[(j+1)%3]].sort((a,b)=>a.localeCompare(b)).join("/");
      weldedEdges.set(edge,(weldedEdges.get(edge)??0)+1);
    }
  }
  const open=[...weldedEdges.values()].filter(count=>count!==2);
  if(open.length)throw Error(`${label}: ${open.length} boundary or nonmanifold edges`);
  return { vertices: mesh.positions.length / 3, triangles: indices.length / 3 };
}

const totals = { prototypes: 0, states: 0, parts: 0, vertices: 0, triangles: 0 };
for (const name of sourceFiles) {
  const Klass = Object.values(require(path.join(root, "src/models", name)) as Record<string, ModelOwner>)[0];
    const catalog: readonly import("../models/representation").ModelPrototype[] = Klass.catalog();
  for (const prototype of catalog) {
    totals.prototypes++;
    for (const state of prototype.states) {
            const model: import("@automovie/interface").IAutoMovieModel = Klass.build(prototype.anchor, state.state, modelMaterialFor);
      const repeated = Klass.build(prototype.anchor, state.state, modelMaterialFor);
      const label = `${prototype.anchor}/${state.state}`;
      if (model.parts.length !== state.parts.length) throw Error(`${label}: part count mismatch`);
      if (JSON.stringify(model) !== JSON.stringify(repeated)) throw Error(`${label}: nondeterministic model build`);
      if (prototype.anchor === "cabinet-and-shelf" && model.id !== `cabinet/${state.state}`)
        throw Error(`${label}: cabinet ID lacks reviewed shape/mm/state tokens`);
      if (prototype.anchor === "murphy-bed" && model.id !== "murphy-bed")
        throw Error(`${label}: murphy states lost common prototype identity`);
      if (prototype.anchor === "work-desk" && ["folded", "open"].includes(state.state) && model.id !== "work-desk/flex")
        throw Error(`${label}: flex desk states lost common prototype identity`);
      totals.states++;
      for (let i = 0; i < model.parts.length; i++) {
        const result = inspect(model.parts[i], state.parts[i], `${label}/${model.parts[i].id}`);
        totals.parts++; totals.vertices += result.vertices; totals.triangles += result.triangles;
      }
      for (const [axis, index] of ([ ["x",0], ["y",1], ["z",2] ] as Array<["x"|"y"|"z", 0|1|2]>)) {
        const extents = model.parts.map(part => {
          if(part.geometry.type!=="mesh")throw Error(`${label}: non-mesh part`);
          return part.geometry.mesh.positions.filter((_,i) => i%3===index);
        });
        let minimum=Math.min(...extents.map(values=>Math.min(...values)));
        let maximum=Math.max(...extents.map(values=>Math.max(...values)));
        const composition=state.compose;
        if (composition) {
          const child=allPrototypes.find(item=>item.anchor===composition.anchor)?.states.find(item=>item.state===composition.state);
          if (!child) throw Error(`${label}: composed child state absent`);
          minimum=Math.min(minimum,child.envelope[axis][0]+composition.offset[index]);
          maximum=Math.max(maximum,child.envelope[axis][1]+composition.offset[index]);
        }
        if(Math.abs(minimum-state.envelope[axis][0])>0.000001 || Math.abs(maximum-state.envelope[axis][1])>0.000001)
          throw Error(`${label}: ${axis} envelope differs from reviewed @envelope`);
      }
    }
  }
}
if (!totals.prototypes || !totals.states || !totals.parts) throw Error("empty model source population");
if (process.argv.includes("--fixture")) {
  const Klass = Object.values(require(path.join(root, "src/models", sourceFiles[0])) as Record<string, ModelOwner>)[0];
  const prototype = Klass.catalog()[0], state = prototype.states[0];
  const model = Klass.build(prototype.anchor, state.state, modelMaterialFor);
  const part = model.parts[0], record = state.parts[0];
  if (part.geometry.type !== "mesh") throw Error("source mutation requires an explicit mesh");
    const original: import("@automovie/interface").IAutoMovieMesh = part.geometry.mesh;
  const caught = [];
  part.geometry.mesh = { ...original, uvs: null };
  try { inspect(part, record, "missing UV"); } catch { caught.push("missing UV"); }
  part.geometry.mesh = { ...original, positions: original.positions.map((n,i) => i%3===0?n+1:n) };
  try { inspect(part, record, "wrong AABB"); } catch { caught.push("wrong AABB"); }
  part.geometry.mesh = { ...original, indices: original.indices?.slice(0,-3)??null };
  try { inspect(part, record, "open mesh"); } catch { caught.push("open mesh"); }
  model.parts.pop();
  if (model.parts.length !== state.parts.length) caught.push("missing part");
  if (caught.length !== 4) throw Error(`source mutation escaped: ${caught}`);
  console.log({ totals, mutations: caught });
} else console.log(totals);
