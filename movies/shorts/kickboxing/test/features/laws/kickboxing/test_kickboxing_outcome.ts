import { resolveAutoMovieOutcome } from "@automovie/engine";
import assert from "node:assert/strict";

import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingDefense } from "../../../../src/laws/kickboxing/KickboxingDefense";
import { KickboxingOutcome } from "../../../../src/laws/kickboxing/KickboxingOutcome";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";

/**
 * The outcome table decides every row of the study's table and refuses
 * pairings it does not record.
 *
 * Scenarios: each row of docs/research/kickboxing/exchanges.md#outcomes
 * (attack, answer, outcome) is decided as recorded, including the Brazilian
 * kick landing over the body-kick read and feints read or ignored; a slip
 * against a low kick and a check against a jab are illegal; the touching
 * classes are exactly landed, parried, blocked and checked; the contact
 * region follows the defending limb on the attacked side.
 */
export function test_kickboxing_outcome(): void {
  const decide = (attack: KickboxingTechnique.Name, answer: KickboxingAction.Answer): string =>
    resolveAutoMovieOutcome(KickboxingOutcome.table, [
      KickboxingAction.intent("a", { kind: "strike", technique: attack }),
      KickboxingAction.intent("b", { kind: "answer", answer, against: attack, lead: 0.3, strike: "x/0" }),
    ]).outcome;
  const rows: [KickboxingTechnique.Name, KickboxingAction.Answer, string][] = [
    ["jab", "take", "landed"],
    ["cross", "parry", "parried"],
    ["jab", "cover", "blocked"],
    ["cross", "slip", "evaded"],
    ["jab", "sway", "evaded"],
    ["hook", "take", "landed"],
    ["uppercut", "cover", "blocked"],
    ["hook", "roll", "evaded"],
    ["body-cross", "take", "landed"],
    ["body-hook", "elbow-block", "blocked"],
    ["low-kick", "take", "landed"],
    ["low-kick", "check", "checked"],
    ["body-kick", "take", "landed"],
    ["switch-kick", "elbow-block", "blocked"],
    ["high-kick", "high-block", "blocked"],
    ["teep", "take", "landed"],
    ["teep", "parry", "parried"],
    ["knee", "take", "landed"],
    ["brazilian-kick", "elbow-block", "landed"],
    ["feint-jab", "parry", "read"],
    ["feint-low-kick", "check", "read"],
    ["feint-body-kick", "elbow-block", "read"],
    ["feint-jab", "take", "ignored"],
    ["low-kick", "slip", "illegal"],
    ["jab", "check", "illegal"],
    ["body-kick", "high-block", "illegal"],
  ];
  for (const [attack, answer, outcome] of rows) assert.equal(decide(attack, answer), outcome, `${attack} vs ${answer}`);
  for (const outcome of ["landed", "parried", "blocked", "checked"] as const) assert.ok(KickboxingOutcome.touches(outcome));
  for (const outcome of ["evaded", "read", "ignored", "illegal"] as const) assert.ok(!KickboxingOutcome.touches(outcome));
  assert.equal(KickboxingDefense.contact("cover", KickboxingTechnique.table.hook), "glove-right");
  assert.equal(KickboxingDefense.contact("elbow-block", KickboxingTechnique.table["switch-kick"]), "forearm-right");
  assert.equal(KickboxingDefense.contact("check", KickboxingTechnique.table["low-kick"]), "shin-left");
  assert.equal(KickboxingDefense.contact("slip", KickboxingTechnique.table.cross), null);
  assert.equal(KickboxingDefense.contact("parry", KickboxingTechnique.table["feint-jab"]), null);
  assert.equal(KickboxingDefense.contact("elbow-block", KickboxingTechnique.table["brazilian-kick"]), "jaw-neck-left");
}
