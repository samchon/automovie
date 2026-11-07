import assert from "node:assert/strict";

import { BoutTechnique } from "../../../../src/motion/choreography/BoutTechnique";
import { BoutDefense } from "../../../../src/motion/defense/BoutDefense";
import { BoutScript } from "../../../../src/shots/kickboxing/ring-bout/BoutScript";

/**
 * Receivers perform the answer they chose, timed from its drawn start, and
 * the computed outcome decides how long they keep it.
 *
 * Scenarios:
 * 1. Every performed answer's phases are ordered, start no earlier than the attacker's launch or the family's lead before contact unless he committed, and are fully set at contact whenever the outcome says the answer worked.
 * 2. An ignored feint or no answer performs nothing.
 * 3. A bitten feint keeps the answer until the feint has returned.
 * 4. The finish shows B's habit: his left arm is fully lowered to his ribs for the body kick he reads when A's instep lands.
 */
export function test_bout_defense(): void {
  for (const action of BoutScript.actions) {
    const technique: BoutTechnique.ISpec = BoutTechnique.get(action.technique);
    const [start, set, held, end] = BoutDefense.phases(action);
    assert.ok(start <= set && set <= held && held <= end, `${action.id} phase order`);
    if (action.answer.timing !== "committed")
      assert.ok(start >= action.at - Math.max(technique.windup, set - start) - 1e-9, `${action.id} visible start`);
    if (["blocked", "deflected", "checked", "missed"].includes(action.outcome))
      assert.equal(BoutDefense.amount(action, action.at), 1, `${action.id} set at contact`);
    if (action.outcome === "ignored" || action.answer.family === "none")
      assert.equal(BoutDefense.amount(action, action.at), 0, `${action.id} performs nothing`);
    if (action.outcome === "bit")
      assert.ok(held >= action.at + technique.recovery, `${action.id} holds the bitten answer`);
  }

  const finish: BoutScript.Action = BoutScript.finish;
  assert.equal(finish.answer.family, "block");
  assert.equal(BoutTechnique.get(finish.answer.reads!).target, "body");
  assert.equal(BoutDefense.struck(finish), "left");
  assert.equal(BoutDefense.amount(finish, finish.at), 1);
}
