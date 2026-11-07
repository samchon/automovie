import { resolveAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";

import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { RingPhase } from "../../../../src/interactions/kickboxing/RingPhase";
import { boutTiming } from "../../../../src/interactions/kickboxing/boutTiming";
import { exchange } from "../../../../src/interactions/kickboxing/exchange";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingRange } from "../../../../src/laws/kickboxing/KickboxingRange";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * Exchanges align each answer's contact to its strike's contact, decide the
 * outcome from the table first, step to range, and phases fill their window.
 *
 * Scenarios: every answer of a four-strike exchange shares its strike's
 * contact second and carries its anchor; outcomes are parried, blocked,
 * evaded, checked; the step-in rides the first strike and ends at the
 * combination's range, ending at the first strike's contact; a mismatched count or a
 * foreign answer refuses; a phase lasts exactly its window, and with a last
 * anchor its contact lands exactly at the window's end; an overfull phase
 * refuses.
 */
export function test_exchange(): void {
  const cast = polygonCast();
  const { a, b } = cast;
  const schedule = BoutLaws.resolve(cast, exchange(cast, "x", a.jab().cross().hook().lowKick(), b.parry().cover().roll().check()));
  const strikes = schedule.entries.filter((e) => e.intent.capability === "strike");
  const answers = schedule.entries.filter((e) => e.intent.capability === "answer");
  assert.equal(answers.length, 4);
  for (const answer of answers) {
    const action = KickboxingAction.read(answer.intent);
    assert.ok(action.kind === "answer");
    const strike = strikes.find((s) => s.intent.anchor === action.strike)!;
    assert.ok(Math.abs(answer.contact! - strike.contact!) < 1e-12);
    assert.ok(Math.abs(answer.start - strike.start) < 1e-12);
  }
  assert.deepEqual(answers.map((e) => e.outcome), ["parried", "blocked", "evaded", "checked"]);
  const range = KickboxingRange.combination(a.body.measure, b.body.measure, ["jab", "cross", "hook", "low-kick"]);
  const end = BoutLaws.origin(schedule, "a", schedule.duration, cast).point;
  const other = BoutLaws.origin(schedule, "b", schedule.duration, cast).point;
  assert.ok(Math.abs(Math.hypot(end.x - other.x, end.z - other.z) - range) < 1e-9);
  const counter = resolveAutoMovieSchedule(exchange(cast, "y", b.jab(), a.slip()), { timing: boutTiming });
  const step = counter.entries.find((e) => e.intent.capability === "move")!;
  assert.ok(Math.abs(step.end - counter.entries.find((e) => e.intent.capability === "strike")!.contact!) < 1e-12);
  assert.throws(() => exchange(cast, "z", a.jab().cross(), b.parry()));
  assert.throws(() => exchange(cast, "z", a.jab(), a.parry()));
  const phase = RingPhase.fill(15, [RingPhase.reset([a, "circle"]), exchange(cast, "p", a.jab().cross(), b.parry().slip())]);
  assert.ok(Math.abs(resolveAutoMovieSchedule(phase, { timing: boutTiming }).duration - 15) < 1e-9);
  const last = RingPhase.fill(15, [RingPhase.reset([a, "circle"]), exchange(cast, "q", a.jab().bodyKick(), b.cover().elbowBlock())], "q/1");
  const finish = resolveAutoMovieSchedule(last, { timing: boutTiming }).entries.find((e) => e.intent.anchor === "q/1")!;
  assert.ok(Math.abs(finish.contact! - 15) < 1e-9);
  assert.throws(() => RingPhase.fill(2, [RingPhase.reset([a, "circle"]), exchange(cast, "r", a.jab().cross(), b.parry().slip())]));
}
