import assert from "node:assert/strict";

import { KickboxingRange } from "../../../../src/laws/kickboxing/KickboxingRange";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * Techniques meet the receiver region the surfaces table names, on the side
 * facing the throwing limb, and ranges are measured on the bodies.
 *
 * Scenarios: a left hook meets the right jaw, a right low kick the left
 * thigh, a left switch kick the right ribs, the Brazilian kick the junction
 * of jaw and neck behind the left ear with the instep descending; feints
 * perform their shown technique; every leg attack arcs except the teep to
 * the stomach (GLORY A.4); no elbow, throw or sweep exists; a combination's
 * range is its shortest strike's and kicks reach farther than punches.
 */
export function test_kickboxing_technique(): void {
  const t = KickboxingTechnique.table;
  assert.equal(KickboxingTechnique.region(t.hook), "jaw-right");
  assert.equal(KickboxingTechnique.region(t["low-kick"]), "thigh-left");
  assert.equal(KickboxingTechnique.region(t["switch-kick"]), "ribs-right");
  assert.equal(KickboxingTechnique.region(t["brazilian-kick"]), "jaw-neck-left");
  assert.equal(t["brazilian-kick"].surface, "instep");
  assert.equal(t["brazilian-kick"].line, "descending");
  assert.equal(t["brazilian-kick"].disguise, "body-kick");
  assert.equal(KickboxingTechnique.performed(t["feint-body-kick"]).name, "body-kick");
  for (const spec of Object.values(t))
    if (spec.limb === "leg" && spec.level === "leg") assert.equal(spec.line, "arc", spec.name);
  assert.equal(t.teep.region, "stomach");
  for (const banned of ["elbow", "throw", "sweep"]) assert.ok(!Object.keys(t).some((n) => n.includes(banned)));
  for (const spec of Object.values(t)) if (spec.family === "round-kick") assert.equal(spec.guard, "forward", spec.name);
  const { a, b } = polygonCast();
  const jab: number = KickboxingRange.of(a.body.measure, b.body.measure, "jab");
  const kick: number = KickboxingRange.of(a.body.measure, b.body.measure, "body-kick");
  assert.ok(kick > jab);
  assert.equal(KickboxingRange.combination(a.body.measure, b.body.measure, ["jab", "body-kick"]), Math.min(jab, kick));
  assert.equal(KickboxingRange.of(a.body.measure, b.body.measure, "feint-jab"), jab);
  assert.throws(() => KickboxingRange.combination(a.body.measure, b.body.measure, []));
}
