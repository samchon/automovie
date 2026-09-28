/**
 * src/geometry/model-parts.ts `surfaceModel`: 면 목록을 표면 ID별 part로 묶는다.
 * fixture: 여러 표면의 닫힌 상자(part 순서·재료 null·항등 변환), 한 표면이 여러 조각인 경우,
 * 빈 입력(거부), 오목 면(engine 거부에 model/표면 주소를 붙임), 결정성.
 * part 하나는 열린 면 집합일 수 있고 닫힘은 model 전체의 결산(mesh-ledger)이 잰다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { identityTransform, surfaceModel } from "../../geometry/model-parts";
import { accountModel } from "../mesh-ledger";
import { assertClosed, boxFaces, v } from "./fixtures";

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
  assert.throws(() => surfaceModel("model.empty", "e", []), /model.empty: 면이 없는/);
  const concave = [v(0, 0, 0), v(2, 0, 0), v(2, 0, 1), v(1, 0, 1), v(1, 0, 2), v(0, 0, 2)];
  assert.throws(() => surfaceModel("model.bad", "b", [{ surface: "surface.bad.floor", corners: concave }]), /model.bad\/surface.bad.floor/);
});

void test("identity transform and determinism", () => {
  assert.deepEqual(identityTransform(), { translation: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } });
  const faces = boxFaces({ west: 0, east: 1, bottom: 0, top: 1, north: 0, south: 1 });
  assert.deepEqual(surfaceModel("m", "m", faces), surfaceModel("m", "m", faces));
});
