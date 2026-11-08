import assert from "node:assert/strict";

import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingTiming } from "../../../../src/laws/kickboxing/KickboxingTiming";

/**
 * The timing law reproduces the studied phases.
 *
 * Scenarios: a combination's first punch takes the measured single-jab
 * delivery (0.405 s, Stanley 2018); alternating hands chain at 1.05 / 3 s and
 * same-hand punches at 1.35 / 3 s (Piorkowski 2011); a punch after a kick
 * starts afresh; kicks reach impact at 0.074 + 0.25 x 1.02 s and replant
 * 0.65 s later (Gavagan and Sayers 2017); a pump jab shows half the jab and
 * returns; a kick feint shows the chamber key; an answer to a feint holds
 * while it returns; a movement takes its steps at 0.35 s each unless a
 * step-in rides a strike's seconds; an unpaired defense has no timing.
 * Expectations are the research values, not the implementation's.
 */
export function test_kickboxing_timing(): void {
  const near = (a: number, b: number): void =>
    assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
  near(KickboxingTiming.delivery("jab"), 0.405);
  near(KickboxingTiming.delivery("cross", "jab"), 1.05 / 3);
  near(KickboxingTiming.delivery("jab", "jab"), 1.35 / 3);
  near(KickboxingTiming.delivery("jab", "low-kick"), 0.405);
  near(
    KickboxingTiming.delivery("body-kick"),
    0.074 + 0.14 * 1.02 + 0.11 * 1.02,
  );
  near(KickboxingTiming.after("body-kick"), 0.65);
  near(KickboxingTiming.after("cross", "jab"), 0);
  near(KickboxingTiming.delivery("feint-jab"), 0.405 / 2);
  near(KickboxingTiming.delivery("feint-body-kick"), 0.074 + 0.14 * 1.02);
  near(KickboxingTiming.delivery("knee"), 0.074 + 0.14 * 1.02);
  near(KickboxingTiming.answerTail("parry", "feint-jab"), 0.405 / 2 + 0.35);
  near(KickboxingTiming.answerTail("check", "low-kick"), 0.65);
  const strike = KickboxingTiming.of({ kind: "strike", technique: "low-kick" });
  near(strike.contact!, KickboxingTiming.KICK_IMPACT);
  near(strike.duration, KickboxingTiming.KICK_IMPACT + 0.65);
  near(
    KickboxingTiming.of({ kind: "move", movement: "circle", steps: 4 })
      .duration,
    4 * 0.35,
  );
  near(
    KickboxingTiming.of({
      kind: "move",
      movement: "approach",
      steps: 2,
      seconds: 0.405,
    }).duration,
    0.405,
  );
  const answer = KickboxingTiming.of({
    kind: "answer",
    answer: "cover",
    against: "cross",
    lead: 0.35,
    strike: "x/0",
  });
  near(answer.contact!, 0.35);
  assert.throws(() => KickboxingTiming.of({ kind: "defend", answer: "parry" }));
  assert.throws(() =>
    KickboxingAction.read({ subject: "a", capability: "strike" }),
  );
}
