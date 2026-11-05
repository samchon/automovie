import assert from "node:assert/strict";

import { BoutScript } from "../../../src/bout/BoutScript";
import { Rhythm } from "../../../src/bout/Rhythm";

/**
 * The live rhythm keeps fighters busy between exchanges, stays out of the scripted ones and is deterministic.
 *
 * @evidence contracts/testing.md#observable-behavior Calls Rhythm.idle, habit and stance over the whole bout.
 * @evidence contracts/testing.md#independent-cases From the screenplay: at every scripted contact second both fighters are engaged (idle 0), so the rhythm cannot move a planned range; between exchanges each fighter performs both feints and unprompted defensive habits within any 10 s of free time; the same second always yields the same habit (seek equals playback).
 */
export function test_rhythm(): void {
  for (const action of BoutScript.actions)
    for (const id of ["a", "b"] as const)
      assert.equal(Rhythm.idle(id, action.at), 0, `${id} idle at ${action.id}`);

  const kinds: Set<Rhythm.Habit> = new Set();
  for (let t: number = 2; t < 140; t += 0.05) {
    const habit = Rhythm.habit("a", t);
    if (habit.k > 0.5 && Rhythm.idle("a", t) > 0.5) kinds.add(habit.kind);
    assert.deepEqual(Rhythm.habit("a", t), habit);
    assert.deepEqual(Rhythm.stance("b", t), Rhythm.stance("b", t));
  }
  for (const kind of [
    "jab-feint",
    "level-feint",
    "slip",
    "weave",
    "shell",
  ] as const)
    assert.ok(kinds.has(kind), `never performed ${kind}`);
  assert.ok(
    Rhythm.stance("a", BoutScript.finish.at).every(
      (v: number): boolean => Math.abs(v) < 1e-12,
    ),
  );
}
