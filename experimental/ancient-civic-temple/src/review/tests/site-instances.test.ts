/** Verifies exterior membership, independently stated site limits and flat house support. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { addTempleSiteInstances } from "../../instances/site";
import { createTempleEnvironment } from "../../spaces/environment";
import { templeModelFinish } from "../../materials/bindings";

const prior = createTempleEnvironment().environment;

void test("setting contains three houses, two narrow trees, two broad trees and six tufts", () => {
  const scene = addTempleSiteInstances(prior);
  const added = scene.elements.slice(prior.elements.length);
  assert.equal(added.length, 13);
  assert.equal(added.filter((member) => member.model?.startsWith("landscape.neighbor-house")).length, 3);
  assert.equal(added.filter((member) => member.model === "landscape.cypress").length, 2);
  assert.equal(added.filter((member) => member.model === "landscape.broad-tree").length, 2);
  assert.equal(added.filter((member) => member.model === "landscape.grass-tuft").length, 6);
  for (const member of added) {
    assert.equal(member.parent, "site.root");
    assert.equal(member.space, "temple-site");
    assert.deepEqual(member.transform.scale, { x: 1, y: 1, z: 1 });
    const { x, y, z } = member.transform.translation;
    assert.ok(Math.abs(x) < 35.5 && Math.abs(z) < 35.25);
    const ground = z <= -2.45 ? 0 : z >= 10.25 ? -0.24 : -0.24 * (z + 2.45) / 12.7;
    assert.ok(Math.abs(y - ground) < 1e-10);
    if (member.model?.startsWith("landscape.neighbor-house")) {
      // A rotated gable has 8.6 m extent along world Z; the shed has 7.6 m.
      const halfZ = member.model.endsWith("gable") ? 4.3 : 3.8;
      assert.ok(z + halfZ < -2.45);
      assert.equal(y, 0);
    }
  }
});

void test("landscape parts keep wall, roof, plinth, wood and foliage bindings distinct", () => {
  assert.equal(
    templeModelFinish("landscape.neighbor-house.gable", "roof"),
    "roof-terracotta",
  );
  assert.equal(
    templeModelFinish("landscape.neighbor-house.shed", "plinth"),
    "limestone",
  );
  assert.equal(
    templeModelFinish("landscape.neighbor-house.gable", "wall"),
    "plaster",
  );
  assert.equal(
    templeModelFinish("landscape.neighbor-house.gable", "recess"),
    "plaster",
  );
  assert.equal(templeModelFinish("landscape.cypress", "crown"), "foliage");
  assert.equal(templeModelFinish("landscape.broad-tree", "branch"), "dark-wood");
  assert.equal(templeModelFinish("landscape.grass-tuft", "blade"), "foliage");
});
