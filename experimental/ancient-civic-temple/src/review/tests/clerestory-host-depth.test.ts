/** The northern 0.60 m wall must not select the 0.30 m frame by floating equality. */
import assert from "node:assert/strict";
import test from "node:test";
import { createTempleBuildingScene } from "../../instances/building";
import { templeClerestories } from "../../spaces/openings";

const building = createTempleBuildingScene();
const hosts = templeClerestories();

void test("all eight clerestory linings span their actual host depth", () => {
  for (const host of hosts) {
    const element = building.elements.find((e) => e.id === `element.building.frame.${host.id}`);
    assert.ok(element, host.id);
    const expected = host.id.includes("-north-") ? 0.6 : 0.3;
    assert.equal(element.model, `frame.window.${expected}`, host.id);
    const model = building.models.find((m) => m.id === element.model);
    const lining = model?.parts.find((p) => p.id === "lining");
    assert.ok(lining?.geometry.type === "mesh");
    const positions = lining.geometry.mesh.positions;
    const depths = positions.filter((_, i) => i % 3 === 2);
    assert.ok(Math.abs(Math.max(...depths) - Math.min(...depths) - (host.wallHigh - host.wallLow)) < 1e-8, host.id);
  }
});
