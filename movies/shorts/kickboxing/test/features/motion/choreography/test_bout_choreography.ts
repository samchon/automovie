import assert from "node:assert/strict";

import { BoutAnswer } from "../../../../src/motion/choreography/BoutAnswer";
import { BoutChoreography } from "../../../../src/motion/choreography/BoutChoreography";
import { BoutOutcome } from "../../../../src/motion/choreography/BoutOutcome";
import { BoutTechnique } from "../../../../src/motion/choreography/BoutTechnique";
import { BoutVariation } from "../../../../src/motion/choreography/BoutVariation";
import { BoutScript } from "../../../../src/shots/kickboxing/ring-bout/BoutScript";

/**
 * The composed bout is legal fighting whose outcomes follow from the composed
 * intents, whatever the seed, and the authoring API refuses compositions that
 * cannot produce what the screenplay requires.
 *
 * Scenarios:
 * 1. Rows are in film order with unique ids inside the touch-to-knockout interval, and both fighters attack in every fifteen-second group.
 * 2. For each fighter a limb carries one window at a time, a leg window overlaps no other own window, and no strike launches while his previous strike is still travelling.
 * 3. Every outcome equals the rule's decision from the row's own intent and drawn parameters; feints and evasions never touch, and the presented answer follows the outcome.
 * 4. Performing again with the film seed reproduces identical rows; other seeds change continuous parameters only, never ids, contact seconds of anchors or outcome classes.
 * 5. Every drawn variation lies in [0, 1) and is a pure function of seed and key.
 * 6. The finish is A's right Brazilian kick at exactly 150 s, landing clean because B reads the disguised body kick and commits his block to it; it strikes with the instep on a descending line at the jaw–neck feature.
 * 7. Every round kick carries the forward guard rule, a clinch knee the clinch rule.
 * 8. An overfull group and an intent that cannot produce its required outcome are refused.
 */
export function test_bout_choreography(): void {
  const actions: readonly BoutScript.Action[] = BoutScript.actions;

  // 1. Order, identity, bounds and groups.
  actions.forEach((row: BoutScript.Action, index: number): void => {
    if (index > 0) assert.ok(actions[index - 1]!.at < row.at, `${row.id} order`);
  });
  assert.equal(new Set(actions.map((row: BoutScript.Action): string => row.id)).size, actions.length);
  assert.ok(actions[0]!.at > BoutScript.TOUCHED);
  assert.equal(BoutScript.finish, actions.at(-1));
  for (let start: number = 0; start < BoutScript.KNOCKOUT; start += 15)
    for (const actor of ["a", "b"] as const)
      assert.ok(
        actions.some((row: BoutScript.Action): boolean => row.actor === actor && row.at >= start && row.at < start + 15),
        `${actor} attacks in ${start}–${start + 15}`,
      );

  // 2. Limb legality per fighter.
  for (const actor of ["a", "b"] as const) {
    const own: readonly BoutScript.Action[] = actions.filter((row: BoutScript.Action): boolean => row.actor === actor);
    own.forEach((first: BoutScript.Action, index: number): void => {
      for (const second of own.slice(index + 1)) {
        const [s1, e1]: readonly [number, number] = window(first);
        const [s2, e2]: readonly [number, number] = window(second);
        if (s2 >= e1 - 1e-9 || s1 >= e2 - 1e-9) continue;
        const a: BoutTechnique.ISpec = BoutTechnique.get(first.technique);
        const b: BoutTechnique.ISpec = BoutTechnique.get(second.technique);
        assert.ok(
          !(a.side === b.side && a.limb === b.limb) && a.limb !== "leg" && b.limb !== "leg",
          `${first.id} overlaps ${second.id}`,
        );
        assert.ok(s2 >= first.at + BoutTechnique.HOLD - 1e-9, `${second.id} launches before ${first.id} lands`);
      }
    });
  }

  // 3. Rule-first outcomes and their presentation.
  for (const row of actions) {
    const technique: BoutTechnique.ISpec = BoutTechnique.get(row.technique);
    assert.equal(
      row.outcome,
      BoutOutcome.decide(row.technique, row.answer, row.parameters.progress, row.parameters.begin < row.at + technique.recovery),
      `${row.id} outcome`,
    );
    if (!technique.contact) assert.ok(!BoutOutcome.touches(row.outcome), `${row.id} feint touches`);
    if (BoutAnswer.get(row.answer.family).evasion && row.outcome === "missed")
      assert.ok(!BoutOutcome.touches(row.outcome), `${row.id} evasion touches`);
    assert.equal(row.defense, BoutOutcome.presentation(row.answer, row.outcome), `${row.id} presentation`);
  }

  // 4. Determinism and outcome invariance under the seed.
  assert.deepEqual(BoutScript.perform({ seed: BoutScript.SEED, extents: BoutScript.extents }), actions);
  for (const seed of ["alternate-1", "alternate-2", "alternate-3"]) {
    const varied: readonly BoutScript.Action[] = BoutScript.perform({ seed, extents: BoutScript.extents });
    assert.equal(varied.length, actions.length, seed);
    varied.forEach((row: BoutScript.Action, index: number): void => {
      assert.equal(row.technique, actions[index]!.technique, `${seed} ${index}`);
      assert.equal(row.outcome, actions[index]!.outcome, `${seed} ${row.id}`);
    });
    assert.equal(varied.at(-1)!.at, BoutScript.KNOCKOUT, seed);
  }

  // 5. Variation draws.
  for (const key of ["a", "b/0/1/begin", "x".repeat(64)]) {
    const value: number = BoutVariation.draw("seed", key);
    assert.ok(value >= 0 && value < 1, key);
    assert.equal(value, BoutVariation.draw("seed", key), key);
    assert.equal(BoutVariation.draw("seed", key, 0), 0.5, key);
  }

  // 6. The finish.
  const finish: BoutScript.Action = BoutScript.finish;
  const brazilian: BoutTechnique.ISpec = BoutTechnique.get(finish.technique);
  assert.equal(finish.technique, "brazilian-kick");
  assert.equal(finish.actor, "a");
  assert.equal(finish.at, BoutScript.KNOCKOUT);
  assert.equal(finish.outcome, "clean");
  assert.equal(finish.answer.reads, brazilian.disguise);
  assert.deepEqual(
    [brazilian.side, brazilian.surface, brazilian.line, brazilian.feature, brazilian.disguise],
    ["right", "instep", "descending", "jaw-neck", "body-kick"],
  );

  // 7. Guard rules.
  for (const spec of Object.values(BoutTechnique.registry)) {
    if (spec.family === "round-kick") assert.equal(spec.guard, "forward", spec.name);
    if (spec.family === "knee") assert.equal(spec.guard, "clinch", spec.name);
  }

  // 8. Refusals.
  const { combo, exchange, group } = BoutChoreography;
  const { parry, block } = BoutAnswer.intents;
  const long: BoutChoreography.IExchange = exchange(
    "long",
    combo("a", ["jab", parry(), "deflected"], ["cross", parry(), "deflected"], ["low-kick", block(), "clean"]),
  );
  assert.throws(
    (): unknown =>
      BoutChoreography.perform([group(0, 3, long, { ...long, name: "long-2" }, { ...long, name: "long-3" })], {
        seed: BoutScript.SEED,
        extents: BoutScript.extents,
      }),
    /below/,
  );
  assert.throws(
    (): unknown =>
      BoutChoreography.perform(
        [group(0, 15, exchange("misread", combo("a", ["jab", block("committed", "body-kick"), "blocked"])))],
        { seed: BoutScript.SEED, extents: BoutScript.extents },
      ),
    /cannot produce/,
  );
}

/** One row's own launch-to-return window, with its drawn recovery. */
function window(row: BoutScript.Action): readonly [number, number] {
  const spec: BoutTechnique.ISpec = BoutTechnique.get(row.technique);
  return [row.at - spec.windup, row.at + BoutTechnique.HOLD + row.parameters.recovery];
}
