import assert from "node:assert/strict";
import test from "node:test";
import { auditContactClaims, modelContactClaims } from "../model-contact-census.mjs";

void test("every current model contact sentence has its own reviewed decision", () => {
  const claims = modelContactClaims();
  assert.equal(claims.length, 79);
  assert.equal(modelContactClaims(true).length, 32);
  assert.equal(new Set(claims.map((claim) => claim.id)).size, claims.length);
  assert.ok(claims.some((claim) => claim.sentence.includes("연결 핀 두 개")));
  assert.ok(claims.some((claim) => claim.sentence.includes("둥근기와")));
  assert.ok(modelContactClaims(true).some((claim) => claim.sentence.includes("문·창 자리는 막힌")));
});

void test("contact census turns missing measurements and changed prose red", () => {
  const claim = [{ id: "fixtures#sample:1", sentence: "첫 면이 둘째 면에 닿는다." }];
  const decisions: Record<string, [string, string][]> = {
    "fixtures#sample": [["둘째 면에 닿는다", "sample planes touch"]],
  };
  assert.equal(auditContactClaims(claim, ["PASS sample planes touch 0 0"], decisions).failures.length, 0);
  assert.equal(auditContactClaims(claim, [], decisions).failures.length, 1);
  assert.equal(auditContactClaims([{ ...claim[0], sentence: "두 면 사이에 틈이 있다." }],
    ["PASS sample planes touch 0 0"], decisions).failures.length, 2);
  assert.equal(auditContactClaims([...claim, { id: "fixtures#sample:2", sentence: "셋째 면에 닿는다." }],
    ["PASS sample planes touch 0 0"], decisions).failures.length, 1);
  assert.equal(auditContactClaims([], ["PASS sample planes touch 0 0"], decisions).failures.length, 1);
});
