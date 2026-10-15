/**
 * src/geometry/model-parts.ts surfaceModel groups faces into parts by surface ID.
 * Fixtures: a closed box with several surfaces (part order, null materials and
 * identity transforms), one surface in several pieces, empty input (refused),
 * a concave face (model/surface address added to the engine refusal), and determinism.
 * One part may be an open face set; mesh-ledger measures closure over the complete model.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { surfaceModel } from "../../geometry/surfaceModel";
import { identityTransform } from "../../geometry/identityTransform";
import { accountModel } from "../accountModel";
import { assertClosed } from "./assertClosed";
import { boxFaces } from "./boxFaces";
import { v } from "./v";

void test("parts are grouped per surface in sorted order, unbound, and the whole model is closed", () => {
  const faces = boxFaces({ west: 0, east: 1, bottom: 0, top: 1, north: 0, south: 1 })
    .map((face, i) => ({ ...face, surface: i < 2 ? "surface.test.b" : "surface.test.a" }));
  const model = surfaceModel("model.test", "test", faces);
  assert.deepEqual(model.parts.map((p) => p.id), ["surface.test.a", "surface.test.b"]);
  assert.ok(model.parts.every((p) => p.material === null && p.transform === null && p.geometry.type === "mesh"));
  const account = accountModel(model);
  assert.equal(account.parts, 2);
  assertClosed(account, 1);
});

void test("refusals carry the model and surface address", () => {
  assert.throws(() => surfaceModel("model.empty", "e", []), /model.empty: model without faces/);
  const concave = [v(0, 0, 0), v(2, 0, 0), v(2, 0, 1), v(1, 0, 1), v(1, 0, 2), v(0, 0, 2)];
  assert.throws(() => surfaceModel("model.bad", "b", [{ surface: "surface.bad.floor", corners: concave }]), /model.bad\/surface.bad.floor/);
});

void test("identity transform and determinism", () => {
  assert.deepEqual(identityTransform(), { translation: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } });
  const faces = boxFaces({ west: 0, east: 1, bottom: 0, top: 1, north: 0, south: 1 });
  assert.deepEqual(surfaceModel("m", "m", faces), surfaceModel("m", "m", faces));
});
