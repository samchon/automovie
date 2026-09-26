import assert from "node:assert/strict";
import test from "node:test";
import { auditContactClaims, modelContactClaims, nonContactDecisionRows } from "../model-contact-census.mjs";

void test("every current model contact sentence has its own reviewed decision", () => {
  const claims = modelContactClaims();
  assert.ok(claims.length >= 90);
  assert.equal(modelContactClaims(true).length, 38);
  assert.equal(new Set(claims.map((claim) => claim.id)).size, claims.length);
  assert.ok(claims.some((claim) => claim.sentence.includes("연결 핀 두 개")));
  assert.ok(claims.some((claim) => claim.sentence.includes("둥근기와")));
  assert.ok(modelContactClaims(true).some((claim) => claim.sentence.includes("문·창 자리는 막힌")));
});

void test("reviewed non-contact reasons cannot silently absorb a measured joint", () => {
  assert.deepEqual(nonContactDecisionRows(), [
    "scale#reference-scale:1|non-contact: repetition design requirement",
    "scale#reference-scale:2|non-contact: phase and datum design requirement",
    "scale#reference-scale:3|non-contact: UV seam construction",
    "scale#model-review-board:1|non-contact: review-board responsibility",
    "columns#colonnade-column:2|non-contact: instruction to consume the exact formula",
    "columns#colonnade-column:6|non-contact: stated failure condition, not a positive joint",
    "entablature#colonnade-beam:8|non-contact: future visual review question",
    "entablature#colonnade-beam:9|non-contact: failure conditions for the measured joint",
    "entablature#rafter:5|non-contact: plumb-cut occupancy datum",
    "entablature#porch-entablature:1|non-contact: reference observation",
    "entablature#porch-entablature:7|non-contact: future visual review question",
    "openings#door-frame:2|non-contact: stated failure conditions",
    "openings#double-door-leaf:8|non-contact: door opening pose is an instances observation",
    "cladding#ridge-tile:2|non-contact: topology instruction about omitting duplicate caps",
    "cladding#ridge-tile:5|non-contact: stated failure conditions",
    "wares#carry-jar:1|non-contact: reference observation",
    "wares#basket:1|non-contact: tessellation and closed-floor construction",
    "landscape#cypress:1|non-contact: review-distance silhouette criterion",
    "scale#reference-scale:supplemental:1|non-contact: UV projection rule rather than an assembly claim",
    "scale#reference-scale:supplemental:2|non-contact: UV projection for the support part rather than an assembly claim",
    "scale#articulation-map:supplemental:1|non-contact: temporal behavior and ownership boundary",
    "scale#model-review-board:supplemental:1|non-contact: review-board light setting",
    "entablature#rafter:supplemental:2|non-contact: stated failure conditions",
    "entablature#sanctuary-truss:supplemental:4|non-contact: future visual review question",
    "entablature#sanctuary-truss:supplemental:5|non-contact: stated failure conditions",
    "entablature#ceiling-joist:supplemental:1|non-contact: stated failure conditions",
    "openings#double-door-leaf:supplemental:1|non-contact: stated failure conditions",
    "cladding#roof-tile:supplemental:1|non-contact: stated failure conditions",
    "cladding#ridge-tile:supplemental:1|non-contact: construction rule rejecting a copied stop distance",
    "fixtures#niche:supplemental:1|non-contact: stated failure conditions",
    "fixtures#desk:supplemental:1|non-contact: reference observation",
    "fixtures#desk:supplemental:3|non-contact: future visual review question",
    "fixtures#scroll-shelf:supplemental:1|non-contact: disjoint-panel construction interval",
    "fixtures#chest:supplemental:1|non-contact: reference and static-state decision",
    "wares#storage-jar:supplemental:1|non-contact: ordered exterior profile construction",
    "wares#carry-jar:supplemental:1|non-contact: ordered exterior profile construction",
    "wares#small-vessel:supplemental:1|non-contact: ordered exterior profile construction",
    "landscape#neighbor-house:supplemental:3|non-contact: stated failure conditions",
  ]);
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
