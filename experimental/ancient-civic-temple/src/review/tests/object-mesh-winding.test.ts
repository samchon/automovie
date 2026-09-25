import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../../geometry/object-mesh";
import { TempleFixtureModels } from "../../models/fixtures";
import { TemplePortableModels } from "../../models/portable";
import { TempleRitualModels } from "../../models/ritual";
import { TempleWareModels } from "../../models/wares";

const signedVolume = (model: IAutoMovieModel): number => {
  let volume = 0;
  for (const part of model.parts) {
    if (part.geometry.type !== "mesh") continue;
    const p = part.geometry.mesh.positions;
    const indices = part.geometry.mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i]! * 3, b = indices[i + 1]! * 3, c = indices[i + 2]! * 3;
      volume += (p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!)
        + p[a + 1]! * (p[b + 2]! * p[c]! - p[b]! * p[c + 2]!)
        + p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!)) / 6;
    }
  }
  return volume;
};

void test("all bounded object prototypes have outward facing indexed triangles", () => {
  const models = [...TempleFixtureModels.build(), ...TemplePortableModels.build(),
    ...TempleRitualModels.build(), ...TempleWareModels.build()];
  let parts = 0;
  for (const model of models) for (const part of model.parts) {
    assert.ok(signedVolume({ ...model, parts: [part] }) > 1e-10, `${model.id}/${part.id} faces inward`);
    ++parts;
  }
  assert.ok(models.length > 0 && parts > 0);
  console.log(`object winding census: ${models.length} prototypes, ${parts} parts, 0 inward`);
});

void test("box, revolved shell and rod winding each faces outward", () => {
  const prototypes = [
    new ObjectMesh().box("part", 0, 0, 0, 1, 1, 1),
    new ObjectMesh().frustum("part", 0, 0, 0, 1, 0.5, 0.3),
    new ObjectMesh().vessel("part", 0, 0, [[0, 0.3], [0.5, 0.4]], [[0.5, 0.35], [0.1, 0.2]]),
    new ObjectMesh().rod("part", { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 0.1),
  ];
  for (const [i, prototype] of prototypes.entries())
    assert.ok(signedVolume(prototype.model(`primitive.${i}`, "part")) > 0, `primitive ${i} faces inward`);
});
