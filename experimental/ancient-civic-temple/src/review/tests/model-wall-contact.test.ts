import assert from "node:assert/strict";
import test from "node:test";
import { implicitWallContactRows } from "../model-wall-contact.mjs";

void test("implicit back-face wall contact resolves to the named part's Z datum", () => {
  const basis = "로컬 원점은 바닥면의 뒷변 중심이고 앞은 로컬 +Z다. `recess`는 Z=0.02~0.16m의 석판이다. 칸 뒷면은 `recess`다. 뒷면은 북쪽 벽과 닿는다.";
  assert.deepEqual(implicitWallContactRows("niche", basis), [{ id: "niche", part: "recess", back: 0.02, pass: false }]);
  assert.equal(implicitWallContactRows("niche", basis.replace("Z=0.02~", "Z=0~"))[0]?.pass, true);
  assert.deepEqual(implicitWallContactRows("niche", basis.replace("뒷면은 북쪽 벽과 닿는다", "받침 뒷면(Z=0)은 북쪽 벽과 닿는다")), []);
  assert.deepEqual(implicitWallContactRows("niche", basis.replace("앞은 로컬 +Z", "앞은 로컬 +X")), []);
  assert.deepEqual(implicitWallContactRows("niche", basis.replace("칸 뒷면은 `recess`다. ", "")), []);
});
