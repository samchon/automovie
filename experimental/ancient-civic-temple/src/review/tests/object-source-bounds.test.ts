import assert from "node:assert/strict";
import test from "node:test";
import { randomInt } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { IAutoMovieModel } from "@automovie/interface";
import { TempleFixtureModels } from "../../models/fixtures";
import { TemplePortableModels } from "../../models/portable";
import { TempleRitualModels } from "../../models/ritual";
import { TempleWareModels } from "../../models/wares";
import { TempleObjectInstances } from "../../instances/objects";

const objectModels = (): IAutoMovieModel[] => [
  ...TempleFixtureModels.build(), ...TemplePortableModels.build(),
  ...TempleRitualModels.build(), ...TempleWareModels.build(),
];

const root = join(__dirname, "../../../docs/models");
const interval = (cell: string, axis: string): [number, number] => {
  const spans = [...cell.matchAll(new RegExp(`${axis}=([+−-]?\\d+(?:\\.\\d+)?)~([+−-]?\\d+(?:\\.\\d+)?)m`, "g"))];
  if (spans.length === 0) throw new Error(`${axis} interval missing: ${cell}`);
  const numbers = spans.flatMap((span) => [Number(span[1]!.replace("−", "-")), Number(span[2]!.replace("−", "-"))]);
  return [Math.min(...numbers), Math.max(...numbers)];
};

interface BoundsCensus { prototypes: number; parts: number; unmeasured: number; failures: string[] }
const boundsCensus = (models: readonly IAutoMovieModel[]): BoundsCensus => {
  const byId = new Map(models.map((model) => [model.id, model]));
  const measured = new Set<string>();
  const failures: string[] = [];
  let prototypes = 0, parts = 0;
  for (const path of readdirSync(root).filter((file) => file.endsWith(".md"))) {
    const source = readFileSync(join(root, path), "utf8");
    for (const section of source.split(/(?=^## )/m).filter((value) => value.startsWith("## "))) {
      if (!section.includes("| part | X | Y | Z |")) continue;
      const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
      if (!anchor) { failures.push(`${path}: coordinate H2 lacks anchor`); continue; }
      const id = `object.${anchor}`;
      const model = byId.get(id);
      if (!model) { failures.push(`${path}#${anchor}: emitted object model absent`); continue; }
      measured.add(id);
      prototypes++;
      const rows = [...section.matchAll(/^\| `([^`]+)` \| ([^\n]+) \| ([^\n]+) \| ([^\n]+) \|$/gm)];
      if (rows.length === 0) failures.push(`${id}: coordinate table empty`);
      for (const row of rows) {
        parts++;
        const part = model.parts.find((item) => item.id === row[1]);
        const positions = part?.geometry.type === "mesh" ? part.geometry.mesh.positions : null;
        if (!positions?.length) { failures.push(`${id}/${row[1]}: mesh absent`); continue; }
        for (let axis = 0; axis < 3; axis++) {
          const actual = positions.filter((_, i) => i % 3 === axis);
          const expected = interval(row[axis + 2]!, "XYZ"[axis]!);
          for (let edge = 0; edge < 2; edge++) {
            const value = edge === 0 ? Math.min(...actual) : Math.max(...actual);
            if (Math.abs(value - expected[edge]) > 0.005)
              failures.push(`${id}/${row[1]} ${"XYZ"[axis]} ${edge}: ${value} != ${expected[edge]}`);
          }
        }
      }
    }
  }
  return { prototypes, parts, unmeasured: models.length - measured.size, failures };
};

void test("every documented object coordinate row bounds the emitted part", () => {
  const result = boundsCensus(objectModels());
  console.log(`object coordinates: ${result.prototypes} measured prototypes, ${result.parts} parts, ${result.unmeasured} without coordinate tables, ${result.failures.length} failures`);
  assert.ok(result.prototypes > 0);
  assert.deepEqual(result.failures, []);
});

void test("the same census rejects randomly selected moved parts", () => {
  const addresses = readdirSync(root).filter((file) => file.endsWith(".md")).flatMap((file) => {
    const source = readFileSync(join(root, file), "utf8");
    return source.split(/(?=^## )/m).filter((section) => section.includes("| part | X | Y | Z |"))
      .flatMap((section) => {
        const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
        return anchor ? [...section.matchAll(/^\| `([^`]+)` \| X=/gm)]
          .map((row) => ({ model: `object.${anchor}`, part: row[1]! })) : [];
      });
  });
  assert.ok(addresses.length > 0);
  const pool = [...addresses];
  const sampleSize = Math.min(10, pool.length);
  for (let trial = 0; trial < sampleSize; trial++) {
    const [chosen] = pool.splice(randomInt(pool.length), 1);
    const models = objectModels();
    const part = models.find((model) => model.id === chosen!.model)!.parts.find((item) => item.id === chosen!.part)!;
    if (part.geometry.type !== "mesh") throw new Error(`${chosen!.model}/${chosen!.part}: mesh absent`);
    part.geometry.mesh.positions[0]! += 10;
    assert.ok(boundsCensus(models).failures.some((failure) =>
      failure.startsWith(`${chosen!.model}/${chosen!.part} X`)), `${chosen!.model}/${chosen!.part} mutation stayed green`);
  }
  console.log(`object coordinate negative probes: ${sampleSize}/${sampleSize} randomly selected parts red`);
});

void test("all object parts emit finite metre UV0 and every placement resolves", () => {
  const models = objectModels();
  const ids = new Set<string>();
  let parts = 0;
  for (const model of models) {
    assert.ok(!ids.has(model.id), `duplicate model ${model.id}`);
    ids.add(model.id);
    assert.ok(model.parts.length > 0, model.id);
    for (const part of model.parts) {
      parts++;
      assert.equal(part.geometry.type, "mesh");
      if (part.geometry.type !== "mesh") continue;
      const mesh = part.geometry.mesh;
      assert.ok(mesh.positions.length > 0 && mesh.positions.length % 3 === 0);
      assert.equal(mesh.uvs?.length, mesh.positions.length / 3 * 2);
      assert.ok(mesh.positions.every(Number.isFinite));
      assert.ok(mesh.uvs?.every(Number.isFinite));
      assert.ok(mesh.indices?.every((i) => Number.isInteger(i) && i >= 0 && i < mesh.positions.length / 3));
    }
  }
  const placements = TempleObjectInstances.placements();
  const roles = new Set<string>();
  for (const p of placements) {
    const key = `${p.space}/${p.role}`;
    assert.ok(!roles.has(key), `duplicate role ${key}`);
    roles.add(key);
    assert.ok(ids.has(`object.${p.prototype}`), `unbound prototype ${key}`);
    assert.ok([p.x,p.y,p.z,p.yaw ?? 0,p.scale ?? 1].every(Number.isFinite));
    assert.ok((p.scale ?? 1) > 0);
  }
  console.log(`object source: ${models.length} prototypes, ${parts} parts, ${placements.length} placed roles, 0 unbound or invalid`);
});
