import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";

import { composeKickboxing } from "../../../../src/composition/films/composeKickboxing";
import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../../../src/laws/kickboxing/KickboxingTiming";
import { KickboxingVariation } from "../../../../src/laws/kickboxing/KickboxingVariation";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * Seeded variation changes how intents are realized, never what happens or
 * when.
 *
 * Scenarios: across the film seed and two other seeds every entry keeps its
 * subject, intent, start, contact, end and outcome, so every screenplay
 * anchor (the finish at 150, the count, the knockout, the bell) and every
 * outcome class is invariant; the drawn lateness, coverage, contact offset,
 * recoil and step-in angle differ between seeds and stay inside their law
 * domains; B's habitual elbow drop to a rising right knee is complete by the
 * chamber key; B lingers one recoil spread on his checked low kick and A does
 * not; resolving one seed twice gives the same schedule.
 */
export function test_bout_variation(): void {
  const { cast, schedule, seed } = polygonFilm();
  const compose = composeKickboxing(cast, 180);
  const others: IAutoMovieSchedule[] = ["seed-one", "seed-two"].map((s) =>
    BoutLaws.resolve(cast, compose, s),
  );
  const near = (p: number | undefined, q: number | undefined): boolean =>
    p === q || (p !== undefined && q !== undefined && Math.abs(p - q) < 1e-9);
  let varied = 0;
  for (const other of others) {
    assert.equal(other.entries.length, schedule.entries.length);
    schedule.entries.forEach((e, k) => {
      const o = other.entries[k]!;
      assert.equal(o.subject, e.subject);
      assert.equal(o.intent.anchor, e.intent.anchor);
      assert.ok(near(o.start, e.start), `start of ${k}`);
      assert.ok(near(o.end, e.end), `end of ${k}`);
      assert.ok(near(o.contact, e.contact), `contact of ${k}`);
      assert.equal(o.outcome, e.outcome, `outcome of ${e.intent.anchor ?? k}`);
      if (JSON.stringify(o.state) !== JSON.stringify(e.state)) varied++;
    });
  }
  assert.ok(varied > 0, "seeds vary the drawn parameters");
  for (const s of [schedule, ...others])
    for (const e of s.entries) {
      const state = e.state as BoutLaws.IState | undefined;
      const action =
        e.intent.capability === "strike" || e.intent.capability === "answer"
          ? KickboxingAction.read(e.intent)
          : null;
      const fighter = e.subject === cast.a.id ? cast.a : cast.b;
      if (action?.kind === "strike") {
        const spec = KickboxingTechnique.table[action.technique];
        const bound = KickboxingVariation.point(spec, fighter.body.measure);
        assert.ok(Math.abs(state!.strike!.point) <= bound);
        assert.ok(
          state!.strike!.recoil <= KickboxingTiming.KICK_RECOIL &&
            state!.strike!.recoil >=
              KickboxingTiming.KICK_RECOIL - KickboxingVariation.RECOIL_SPREAD,
        );
      }
      if (action?.kind === "answer") {
        const drawn = state!.answer!;
        const ready = BoutLaws.ready(action);
        assert.ok(drawn.lateness >= 0 && drawn.lateness < ready);
        assert.ok(drawn.lateness <= KickboxingVariation.lateness(ready));
        assert.ok(
          drawn.coverage >=
            KickboxingVariation.coverage(fighter.body.measure) - 1e-12 &&
            drawn.coverage <= 1,
        );
        if (action.ready === "chamber")
          assert.ok(ready <= KickboxingTiming.KICK_CHAMBER + 1e-12);
      }
    }
  // B's tell to the Brazilian kick's rising knee completes by the chamber.
  const finish = schedule.entries.find((e) => {
    const action =
      e.intent.capability === "answer" ? KickboxingAction.read(e.intent) : null;
    return action?.kind === "answer" && action.strike === "s10-b04/3";
  })!;
  const tell = KickboxingAction.read(finish.intent);
  assert.ok(tell.kind === "answer" && tell.answer === "elbow-block");
  assert.ok(tell.kind === "answer" && tell.ready === "chamber");
  assert.equal(
    cast.b.lingers("low-kick", "checked"),
    KickboxingVariation.RECOIL_SPREAD,
  );
  assert.equal(cast.b.lingers("low-kick", "landed"), 0);
  assert.equal(cast.a.lingers("low-kick", "checked"), 0);
  assert.equal(
    JSON.stringify(BoutLaws.resolve(cast, compose, "seed-one")),
    JSON.stringify(others[0]),
  );
  assert.ok(seed.length > 0);
}
