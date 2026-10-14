import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { bindTempleMaterials, templeModelFinish, templeSpaceFinish } from "../../materials/bindings";
import { createTempleEnvironment } from "../../spaces/environment";

/**
 * Pin refusal of undeclared surfaces and inherited object/part keys while current emitted faces remain bound.
 *
 * Scenarios:
 * 1. Unknown IDs, including known finish suffixes and inherited object-property names, refuse.
 * 2. Authored dado, timber, stone, paving, roof and site examples keep their assigned keys.
 * 3. Inherited object and part names refuse while the authored chest metal/wood split remains valid.
 * 4. Every actual environment part receives a resident material through the production binder.
 *
 * Executes both public classifiers and the actual environment binder; unknown-owner/face acceptance, inherited object/part acceptance, wrong authored keys and missing resident materials fail observable assertions.
 *
 * Example keys and unknown-ID refusal come from authored space/model binding contracts, including the chest's timber body and metal hasp. Complete emitted-part binding checks resident material existence; its derived key comparison supplies consistency rather than an independent palette oracle.
 *
 * Known dado/timber/stone/paving/plaster/roof/site cases remain valid beside unknown owners, unknown faces, misleading suffixes and inherited-property names. Mesh topology and texture appearance belong to other geometry/viewer checks.
 *
 * One node:test case is discovered by the existing production test glob and runs typed portable source without a browser, GPU, service installation or authored asset acquisition.
 */
void test("materials refuse undeclared faces and inherited object keys while binding current surfaces", (): void => {
  for (const id of [
    "surface.unknown",
    "surface.unknown.floor",
    "surface.unknown.dado",
    "surface.unknown.reveal",
    "surface.unknown.upper",
    "surface.unknown.ceiling",
    "surface.sanctuary.unknown",
    "toString",
    "__proto__",
  ])
    assert.throws((): ReturnType<typeof templeSpaceFinish> => templeSpaceFinish(id),
      { message: `${id}: no space finish` });

  for (const [id, finish] of [
    ["surface.sanctuary.dado", "dado"],
    ["surface.roof-east.soffit", "dark-wood"],
    ["surface.service-yard.wall", "limestone"],
    ["surface.administration.floor", "paving-small"],
    ["surface.courtyard.floor", "paving"],
    ["surface.facade-west.sanctuary-flank", "plaster"],
    ["surface.roof-porch.upper", "roof-terracotta"],
    ["surface.site-distant.ground", "soil"],
  ] as const)
    assert.equal(templeSpaceFinish(id), finish);

  for (const id of ["constructor", "toString", "__proto__"])
    assert.throws((): ReturnType<typeof templeModelFinish> => templeModelFinish(id, "name"),
      { message: `${id}/name: no model finish` });
  for (const part of ["constructor", "toString", "__proto__"])
    assert.throws((): ReturnType<typeof templeModelFinish> => templeModelFinish("fixture.chest", part),
      { message: `fixture.chest/${part}: no object part finish` });
  assert.equal(templeModelFinish("fixture.chest", "body"), "dark-wood");
  assert.equal(templeModelFinish("fixture.chest", "hasp"), "dark-metal");

  const environment: IAutoMovieBuiltEnvironment = createTempleEnvironment().environment;
  const bound: IAutoMovieBuiltEnvironment = bindTempleMaterials(environment);
  const surfaces: Set<string> = new Set<string>();
  for (const model of bound.models)
    for (const part of model.parts) {
      assert.ok(model.materials.some((material: typeof model.materials[number]): boolean =>
        material.id === part.material), `${model.id}/${part.id}: resident material`);
      if (part.id.startsWith("surface.")) {
        surfaces.add(part.id);
        assert.equal(part.material, `temple.${templeSpaceFinish(part.id)}`);
      }
    }
  assert.ok(surfaces.size > 0, "current producer emits spatial surfaces");
});
