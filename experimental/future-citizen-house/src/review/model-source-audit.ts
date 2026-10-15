/**
 * Build every catalog state from the five Models001..005 filename candidates.
 * The loader consumes each module's first exported value as the catalog/build owner.
 * It compares source meshes with the retained coordinate records: identity, AABBs,
 * aligned finite attributes, triangle indices/winding, two-incidence rounded-position
 * edges, repeated-build serialization and envelopes. Composition extends the envelope
 * by a child's declared bounds; it does not inspect an assembled child mesh here.
 * --fixture must reject the explicit mutated meshes below. Neither record agreement
 * nor these finite mutations prove the full design, contacts, UV slope or GPU result.
 * Filesystem/module/material/build/assertion failures stop this synchronous process;
 * catalog loading shares module data and no renderer or native session is acquired.
 */
import fs from "node:fs";

import path from "node:path";

import { modelMaterialFor } from "../materials/modelMaterialFor";

/** Each discovered module is expected to expose the same authored catalog/build API. */
type ModelOwner = Pick<typeof import("../models/Models001").Models001, "catalog" | "build">;
const root: string = path.resolve(__dirname, "../..");
const sourceFiles: string[] = fs.readdirSync(path.join(root, "src/models"))
  .filter((name: string): boolean => /^Models00[1-5]\.ts$/.test(name)).sort((a: string, b: string): number => a.localeCompare(b));
const allPrototypes: import("../common/model-geometry/representation").ModelPrototype[] = sourceFiles.flatMap((name: string): readonly import("../common/model-geometry/representation").ModelPrototype[] => {
  const Klass: ModelOwner = Object.values(require(path.join(root, "src/models", name)) as Record<string, ModelOwner>)[0];
  return Klass.catalog();
});

function inspect(part: import("@automovie/interface").IAutoMovieModelPart, record: import("../common/model-geometry/representation").ModelPartRecord, label: string): { vertices: number; triangles: number } {
  if (!record || part.id !== record.id) throw new Error(`${label}: part identity mismatch`);
  if (part.geometry.type !== "mesh") throw new Error(`${label}: no explicit UV-capable mesh`);
  const mesh: import("@automovie/interface").IAutoMovieMesh = part.geometry.mesh;
  if (!mesh.positions.length || mesh.positions.length % 3 ||
    mesh.normals?.length !== mesh.positions.length ||
    mesh.uvs?.length !== mesh.positions.length / 3 * 2 ||
    !mesh.indices?.length || mesh.indices.length % 3) throw new Error(`${label}: missing or unaligned mesh attributes`);
  if (![...mesh.positions, ...mesh.normals, ...mesh.uvs].every(Number.isFinite)) throw new Error(`${label}: nonfinite vertex attribute`);
    const axes: Array<["x"|"y"|"z", 0|1|2]> = [["x", 0], ["y", 1], ["z", 2]];
  for (const [axis, index] of axes) {
    const values: number[] = mesh.positions.filter((_: number, i: number): boolean => i % 3 === index);
    if (Math.abs(Math.min(...values) - record[axis][0]) > 0.000001 ||
      Math.abs(Math.max(...values) - record[axis][1]) > 0.000001) throw new Error(`${label}: ${axis} AABB differs from @part`);
  }
  const indices: number[] = mesh.indices;
  if (!indices) throw new Error(`${label}: missing indices`);
    const weldedEdges: Map<string, number> = new Map();
    const vertexKey: (index: number) => string = (index: number): string => mesh.positions.slice(index*3, index*3+3)
    .map((value: number): number => Math.round(value*1e8)).join(",");
  for (let i: number = 0; i < indices.length; i += 3) {
        const point: (k: number) => number[] = (k: number): number[] => {
      const index: number = indices[i + k];
      if (!Number.isInteger(index) || index < 0 || index >= mesh.positions.length / 3) throw new Error(`${label}: invalid index`);
      return mesh.positions.slice(index * 3, index * 3 + 3);
    };
    const a: number[] = point(0), b: number[] = point(1), c: number[] = point(2);
    const ab: number[] = b.map((v: number,j: number): number => v-a[j]), ac: number[] = c.map((v: number,j: number): number => v-a[j]);
    const cross: number[] = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
    if (Math.hypot(...cross) < 1e-15) throw new Error(`${label}: degenerate triangle ${i/3}`);
    const normal: number[] = mesh.normals.slice(indices[i]*3, indices[i]*3+3);
    if (cross.reduce((sum: number,value: number,j: number): number => sum + value*normal[j], 0) < -1e-15) throw new Error(`${label}: reversed triangle ${i/3}`);
    const triangle: string[] = indices.slice(i,i+3).map(vertexKey);
    for (let j: number=0;j<3;j++) {
      const edge: string = [triangle[j],triangle[(j+1)%3]].sort((a: string,b: string): number => a.localeCompare(b)).join("/");
      weldedEdges.set(edge,(weldedEdges.get(edge)??0)+1);
    }
  }
  const open: number[] = [...weldedEdges.values()].filter((count: number): boolean => count!==2);
  if(open.length)throw new Error(`${label}: ${open.length} boundary or nonmanifold edges`);
  return { vertices: mesh.positions.length / 3, triangles: indices.length / 3 };
}

const totals: { prototypes: number; states: number; parts: number; vertices: number; triangles: number } = { prototypes: 0, states: 0, parts: 0, vertices: 0, triangles: 0 };
for (const name of sourceFiles) {
  const Klass: ModelOwner = Object.values(require(path.join(root, "src/models", name)) as Record<string, ModelOwner>)[0];
    const catalog: readonly import("../common/model-geometry/representation").ModelPrototype[] = Klass.catalog();
  for (const prototype of catalog) {
    totals.prototypes++;
    for (const state of prototype.states) {
            const model: import("@automovie/interface").IAutoMovieModel = Klass.build(prototype.anchor, state.state, modelMaterialFor);
      const repeated: import("@automovie/interface").IAutoMovieModel = Klass.build(prototype.anchor, state.state, modelMaterialFor);
      const label: string = `${prototype.anchor}/${state.state}`;
      if (model.parts.length !== state.parts.length) throw new Error(`${label}: part count mismatch`);
      if (JSON.stringify(model) !== JSON.stringify(repeated)) throw new Error(`${label}: nondeterministic model build`);
      if (prototype.anchor === "cabinet-and-shelf" && model.id !== `cabinet/${state.state}`)
        throw new Error(`${label}: cabinet ID lacks reviewed shape/mm/state tokens`);
      if (prototype.anchor === "murphy-bed" && model.id !== "murphy-bed")
        throw new Error(`${label}: murphy states lost common prototype identity`);
      if (prototype.anchor === "work-desk" && ["folded", "open"].includes(state.state) && model.id !== "work-desk/flex")
        throw new Error(`${label}: flex desk states lost common prototype identity`);
      totals.states++;
      for (let i: number = 0; i < model.parts.length; i++) {
        const result: { vertices: number; triangles: number } = inspect(model.parts[i], state.parts[i], `${label}/${model.parts[i].id}`);
        totals.parts++; totals.vertices += result.vertices; totals.triangles += result.triangles;
      }
      for (const [axis, index] of ([ ["x",0], ["y",1], ["z",2] ] as Array<["x"|"y"|"z", 0|1|2]>)) {
        const extents: number[][] = model.parts.map((part: import("@automovie/interface").IAutoMovieModelPart): number[] => {
          if(part.geometry.type!=="mesh")throw new Error(`${label}: non-mesh part`);
          return part.geometry.mesh.positions.filter((_: number,i: number): boolean => i%3===index);
        });
        let minimum: number = Math.min(...extents.map((values: number[]): number => Math.min(...values)));
        let maximum: number = Math.max(...extents.map((values: number[]): number => Math.max(...values)));
        const composition: import("../common/model-geometry/representation").ModelStateRecord["compose"] = state.compose;
        if (composition) {
          const child: import("../common/model-geometry/representation").ModelStateRecord | undefined = allPrototypes.find((item: import("../common/model-geometry/representation").ModelPrototype): boolean => item.anchor===composition.anchor)?.states.find((item: import("../common/model-geometry/representation").ModelStateRecord): boolean => item.state===composition.state);
          if (!child) throw new Error(`${label}: composed child state absent`);
          minimum=Math.min(minimum,child.envelope[axis][0]+composition.offset[index]);
          maximum=Math.max(maximum,child.envelope[axis][1]+composition.offset[index]);
        }
        if(Math.abs(minimum-state.envelope[axis][0])>0.000001 || Math.abs(maximum-state.envelope[axis][1])>0.000001)
          throw new Error(`${label}: ${axis} envelope differs from reviewed @envelope`);
      }
    }
  }
}
if (!totals.prototypes || !totals.states || !totals.parts) throw new Error("empty model source population");
if (process.argv.includes("--fixture")) {
  const Klass: ModelOwner = Object.values(require(path.join(root, "src/models", sourceFiles[0])) as Record<string, ModelOwner>)[0];
  const prototype: import("../common/model-geometry/representation").ModelPrototype = Klass.catalog()[0], state: import("../common/model-geometry/representation").ModelStateRecord = prototype.states[0];
  const model: import("@automovie/interface").IAutoMovieModel = Klass.build(prototype.anchor, state.state, modelMaterialFor);
  const part: import("@automovie/interface").IAutoMovieModelPart = model.parts[0], record: import("../common/model-geometry/representation").ModelPartRecord = state.parts[0];
  if (part.geometry.type !== "mesh") throw new Error("source mutation requires an explicit mesh");
    const original: import("@automovie/interface").IAutoMovieMesh = part.geometry.mesh;
  const caught: string[] = [];
  part.geometry.mesh = { ...original, uvs: null };
  try { inspect(part, record, "missing UV"); } catch { caught.push("missing UV"); }
  part.geometry.mesh = { ...original, positions: original.positions.map((n: number,i: number): number => i%3===0?n+1:n) };
  try { inspect(part, record, "wrong AABB"); } catch { caught.push("wrong AABB"); }
  part.geometry.mesh = { ...original, indices: original.indices?.slice(0,-3)??null };
  try { inspect(part, record, "open mesh"); } catch { caught.push("open mesh"); }
  model.parts.pop();
  if (model.parts.length !== state.parts.length) caught.push("missing part");
  if (caught.length !== 4) throw new Error(`source mutation escaped: ${caught}`);
  console.log({ totals, mutations: caught });
} else console.log(totals);
