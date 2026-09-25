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
  const measuredParts = new Map<string, Set<string>>();
  const failures: string[] = [];
  let parts = 0;
  for (const path of readdirSync(root).filter((file) => file.endsWith(".md"))) {
    const source = readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");
    for (const section of source.split(/(?=^## )/m).filter((value) => value.startsWith("## "))) {
      const simple = /^\| part \| X \| Y \| Z \|$/m.test(section);
      const named = /^\| prototype \| part \| X \| Y \| Z \|$/m.test(section);
      if (!simple && !named) continue;
      const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
      if (!anchor) { failures.push(`${path}: coordinate H2 lacks anchor`); continue; }
      const rows = simple
        ? [...section.matchAll(/^\| `([^`]+)` \| ([^\n]+) \| ([^\n]+) \| ([^\n]+) \|$/gm)]
          .map((row) => [`object.${anchor}`, row[1]!, row[2]!, row[3]!, row[4]!] as const)
        : [...section.matchAll(/^\| `(object\.[^`]+)` \| `([^`]+)` \| ([^\n]+) \| ([^\n]+) \| ([^\n]+) \|$/gm)]
          .map((row) => [row[1]!, row[2]!, row[3]!, row[4]!, row[5]!] as const);
      if (rows.length === 0) failures.push(`${path}#${anchor}: coordinate table empty`);
      for (const [id, partId, x, y, z] of rows) {
        const model = byId.get(id);
        if (!model) { failures.push(`${path}#${anchor}: emitted object model ${id} absent`); continue; }
        measured.add(id);
        parts++;
        const seen = measuredParts.get(id) ?? new Set<string>();
        if (seen.has(partId)) failures.push(`${id}/${partId}: duplicate coordinate row`);
        seen.add(partId); measuredParts.set(id, seen);
        const part = model.parts.find((item) => item.id === partId);
        const positions = part?.geometry.type === "mesh" ? part.geometry.mesh.positions : null;
        if (!positions?.length) { failures.push(`${id}/${partId}: mesh absent`); continue; }
        for (let axis = 0; axis < 3; axis++) {
          const actual = positions.filter((_, i) => i % 3 === axis);
          const expected = interval([x,y,z][axis]!, "XYZ"[axis]!);
          for (let edge = 0; edge < 2; edge++) {
            const value = edge === 0 ? Math.min(...actual) : Math.max(...actual);
            if (Math.abs(value - expected[edge]) > 0.005)
              failures.push(`${id}/${partId} ${"XYZ"[axis]} ${edge}: ${value} != ${expected[edge]}`);
          }
        }
      }
    }
  }
  for (const model of models) {
    if (!measured.has(model.id)) failures.push(`${model.id}: coordinate table absent`);
    for (const part of model.parts) if (!measuredParts.get(model.id)?.has(part.id))
      failures.push(`${model.id}/${part.id}: coordinate row absent`);
  }
  return { prototypes: measured.size, parts, unmeasured: models.length - measured.size, failures };
};

const documentedAddresses = (): { model: string; part: string }[] =>
  readdirSync(root).filter((file) => file.endsWith(".md")).flatMap((file) => {
    const source = readFileSync(join(root, file), "utf8").replace(/\r\n/g, "\n");
    return source.split(/(?=^## )/m).filter((section) =>
      /^\| (?:part|prototype \| part) \| X \| Y \| Z \|$/m.test(section))
      .flatMap((section) => {
        const anchor = section.match(/^## .+ \{#([^}]+)\}/)?.[1];
        if (!anchor) return [];
        return [
          ...[...section.matchAll(/^\| `([^`]+)` \| X=/gm)]
            .map((row) => ({ model: `object.${anchor}`, part: row[1]! })),
          ...[...section.matchAll(/^\| `(object\.[^`]+)` \| `([^`]+)` \| X=/gm)]
            .map((row) => ({ model: row[1]!, part: row[2]! })),
        ];
      });
  });

const randomSample = <T>(population: readonly T[], amount: number): T[] => {
  const pool = [...population], chosen: T[] = [];
  for (let i = 0; i < Math.min(amount, pool.length); i++) chosen.push(pool.splice(randomInt(pool.length), 1)[0]!);
  return chosen;
};

void test("every documented object coordinate row bounds the emitted part", () => {
  const result = boundsCensus(objectModels());
  console.log(`object coordinates: ${result.prototypes} measured prototypes, ${result.parts} parts, ${result.unmeasured} without coordinate tables, ${result.failures.length} failures`);
  assert.equal(result.prototypes, objectModels().length);
  assert.equal(result.unmeasured, 0);
  assert.deepEqual(result.failures, []);
});

void test("the same census rejects randomly selected moved parts", () => {
  const sample = randomSample(documentedAddresses(), 10);
  assert.ok(sample.length > 0);
  for (const chosen of sample) {
    const models = objectModels();
    const part = models.find((model) => model.id === chosen.model)!.parts.find((item) => item.id === chosen.part)!;
    if (part.geometry.type !== "mesh") throw new Error(`${chosen.model}/${chosen.part}: mesh absent`);
    part.geometry.mesh.positions[0]! += 10;
    assert.ok(boundsCensus(models).failures.some((failure) =>
      failure.startsWith(`${chosen.model}/${chosen.part} X`)), `${chosen.model}/${chosen.part} mutation stayed green`);
  }
  console.log(`object coordinate move probes: ${sample.length}/${sample.length} randomly selected parts red`);
});

void test("the same census rejects randomly lifted parts", () => {
  const sample = randomSample(documentedAddresses(), 10);
  assert.ok(sample.length > 0);
  for (const chosen of sample) {
    const models = objectModels();
    const part = models.find((model) => model.id === chosen.model)!.parts.find((item) => item.id === chosen.part)!;
    if (part.geometry.type !== "mesh") throw new Error(`${chosen.model}/${chosen.part}: mesh absent`);
    for (let i = 1; i < part.geometry.mesh.positions.length; i += 3) part.geometry.mesh.positions[i]! += 10;
    assert.ok(boundsCensus(models).failures.some((failure) =>
      failure.startsWith(`${chosen.model}/${chosen.part} Y`)), `${chosen.model}/${chosen.part} lift stayed green`);
  }
  console.log(`object coordinate lift probes: ${sample.length}/${sample.length} randomly selected parts red`);
});

void test("the same census rejects randomly removed parts", () => {
  const sample = randomSample(documentedAddresses(), 10);
  assert.ok(sample.length > 0);
  for (const chosen of sample) {
    const models = objectModels();
    const model = models.find((item) => item.id === chosen.model)!;
    model.parts.splice(model.parts.findIndex((part) => part.id === chosen.part), 1);
    assert.ok(boundsCensus(models).failures.some((failure) =>
      failure.startsWith(`${chosen.model}/${chosen.part}:`)), `${chosen.model}/${chosen.part} removal stayed green`);
  }
  console.log(`object coordinate removal probes: ${sample.length}/${sample.length} randomly selected parts red`);
});

void test("the same census rejects randomly overlapped pairs", () => {
  const models = objectModels();
  const addresses = documentedAddresses();
  const centre = (part: IAutoMovieModel["parts"][number]): number[] => {
    if (part.geometry.type !== "mesh") throw new Error(`${part.id}: mesh absent`);
    const positions = part.geometry.mesh.positions;
    return [0,1,2].map((axis) => {
      const values = positions.filter((_, i) => i % 3 === axis);
      return (Math.min(...values) + Math.max(...values)) / 2;
    });
  };
  const pairs = addresses.flatMap((first) => {
    const model = models.find((item) => item.id === first.model)!;
    const one = model.parts.find((part) => part.id === first.part)!;
    return model.parts.filter((other) => other.id !== first.part &&
      centre(other).some((value, axis) => Math.abs(value - centre(one)[axis]!) > 0.02))
      .map((other) => ({ first, second: other.id }));
  });
  const sample = randomSample(pairs, 10);
  assert.ok(sample.length > 0);
  for (const { first, second } of sample) {
    const copy = objectModels();
    const model = copy.find((item) => item.id === first.model)!;
    const part = model.parts.find((item) => item.id === first.part)!;
    const target = model.parts.find((item) => item.id === second)!;
    if (part.geometry.type !== "mesh") throw new Error(`${first.model}/${first.part}: mesh absent`);
    const delta = centre(target).map((value, axis) => value - centre(part)[axis]!);
    for (let i = 0; i < part.geometry.mesh.positions.length; i++)
      part.geometry.mesh.positions[i]! += delta[i % 3]!;
    assert.ok(boundsCensus(copy).failures.some((failure) =>
      failure.startsWith(`${first.model}/${first.part} `)), `${first.model}/${first.part} overlap stayed green`);
  }
  console.log(`object coordinate overlap probes: ${sample.length}/${sample.length} randomly selected pairs red`);
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
      assert.equal(mesh.normals?.length, mesh.positions.length, `${model.id}/${part.id} normals`);
      assert.ok(mesh.positions.every(Number.isFinite));
      assert.ok(mesh.uvs?.every(Number.isFinite));
      assert.ok(mesh.normals?.every(Number.isFinite));
      for (let i = 0; i < mesh.normals!.length; i += 3)
        assert.ok(Math.abs(Math.hypot(mesh.normals![i]!, mesh.normals![i + 1]!, mesh.normals![i + 2]!) - 1) < 1e-9);
      assert.ok(mesh.indices?.every((i) => Number.isInteger(i) && i >= 0 && i < mesh.positions.length / 3));
      for (let i = 0; i < mesh.indices!.length; i += 3) {
        const a = mesh.indices![i]! * 3, b = mesh.indices![i + 1]! * 3, c = mesh.indices![i + 2]! * 3;
        const p = mesh.positions;
        const ab = [p[b]! - p[a]!, p[b + 1]! - p[a + 1]!, p[b + 2]! - p[a + 2]!];
        const ac = [p[c]! - p[a]!, p[c + 1]! - p[a + 1]!, p[c + 2]! - p[a + 2]!];
        const face = [ab[1]! * ac[2]! - ab[2]! * ac[1]!,
          ab[2]! * ac[0]! - ab[0]! * ac[2]!, ab[0]! * ac[1]! - ab[1]! * ac[0]!];
        const area = Math.hypot(...face);
        if (area > 1e-10)
          assert.ok(face.reduce((sum, value, axis) => sum + value * mesh.normals![a + axis]!, 0) > 0,
            `${model.id}/${part.id}: normal opposes triangle ${i / 3}`);
      }
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
