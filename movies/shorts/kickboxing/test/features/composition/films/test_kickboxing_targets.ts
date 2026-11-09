import {
  measureAutoMovieSchedule,
  type IAutoMovieSchedule,
} from "@automovie/engine";
import assert from "node:assert/strict";

import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { KickboxingAction } from "../../../../src/laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { RingFootwork } from "../../../../src/laws/kickboxing/RingFootwork";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The resolved round meets the research's measurable targets.
 *
 * Scenarios, with the study's thresholds (docs/research/kickboxing/
 * exchanges.md#targets and ring-generalship.md#targets): at least 75% of
 * strikes thrown in combinations of two or more; at least 85% of exchanges
 * contain a combination; every round kick prepares or finishes a
 * combination; each fighter throws 20 to 40 strikes per minute of action;
 * each fighter opens at least a third of the exchanges; exchanges start on
 * average within one standard deviation of 3.4 s apart; at least 30% of the
 * footwork path is lateral to the fighters' line; the line turns at least
 * one full revolution; the pair works on the ropes for some but at most a
 * quarter of the bout; both stay inside the ropes.
 */
export function test_kickboxing_targets(): void {
  const { schedule, cast } = polygonFilm();
  const action = 150;
  const strikes = schedule.entries.filter(
    (e) => e.intent.capability === "strike" && e.start < action,
  );
  const strike = (e: IAutoMovieSchedule.IEntry) =>
    KickboxingAction.read(e.intent) as Extract<
      KickboxingAction.IAction,
      { kind: "strike" }
    >;
  // Strikes of one combination follow each other end to start; the engine counts the follow.
  const measured = measureAutoMovieSchedule(
    { entries: strikes, duration: action },
    { action: () => true, combinationGap: 1e-6 },
  );
  const inCombination = (e: IAutoMovieSchedule.IEntry): boolean =>
    strikes.some(
      (o) =>
        o !== e &&
        o.subject === e.subject &&
        (Math.abs(o.end - e.start) < 1e-6 || Math.abs(e.end - o.start) < 1e-6),
    );
  const share: number = strikes.filter(inCombination).length / strikes.length;
  assert.ok(share >= 0.75, `combination share ${share}`);
  assert.ok(
    measured.combinationShare > 0.5,
    `followed share ${measured.combinationShare}`,
  );
  for (const e of strikes)
    if (KickboxingTechnique.table[strike(e).technique].family === "round-kick")
      assert.ok(inCombination(e), `kick ${e.intent.anchor}`);
  // Exchanges: strikes grouped by their exchange id prefix.
  const exchanges = new Map<string, IAutoMovieSchedule.IEntry[]>();
  for (const e of strikes) {
    const id: string = e.intent.anchor!.split("/")[0]!;
    exchanges.set(id, [...(exchanges.get(id) ?? []), e]);
  }
  const groups = [...exchanges.values()];
  const combos: number = groups.filter((g) => g.length >= 2).length;
  // The study's exceptions: single counters (exchanges answering another in
  // the same beat, suffixed `c`), the range-resetting teep and the clinch knee.
  const exceptions: number = groups.filter(
    (g) =>
      g.length === 1 &&
      (["teep", "knee"].includes(strike(g[0]!).technique) ||
        COUNTER.test(g[0]!.intent.anchor!.split("/")[0]!)),
  ).length;
  assert.ok(
    combos / (groups.length - exceptions) >= 0.85,
    `exchanges with combinations ${combos}/${groups.length - exceptions}`,
  );
  for (const subject of ["a", "b"]) {
    const own: number = strikes.filter(
      (e) =>
        e.subject === subject &&
        !KickboxingTechnique.table[strike(e).technique].shows,
    ).length;
    const perMinute: number = own / (action / 60);
    assert.ok(
      perMinute >= 20 && perMinute <= 40,
      `${subject} ${perMinute} per minute`,
    );
    const opened: number = groups.filter(
      (g) => g[0]!.subject === subject,
    ).length;
    assert.ok(
      opened >= groups.length / 3,
      `${subject} opens ${opened}/${groups.length}`,
    );
  }
  // A screenplay beat, inserted ones (`s03-b02a`) included, is one exchange;
  // its counters (`c`, `c2`) belong to it.
  const beat = (e: IAutoMovieSchedule.IEntry): string =>
    e.intent.anchor!.split("/")[0]!.replace(COUNTER, "");
  const beats = [...new Set(strikes.map(beat))];
  const starts = beats
    .map((id) =>
      Math.min(...strikes.filter((e) => beat(e) === id).map((e) => e.start)),
    )
    .sort((x, y) => x - y);
  const gaps = starts.slice(1).map((s, k) => s - starts[k]!);
  const mean: number = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  assert.ok(Math.abs(mean - 3.4) <= 1.2, `mean exchange interval ${mean}`);
  // Footwork: lateral share, ring revolution, ropes and bounds, sampled every frame of the action.
  const ring: RingFootwork.IRing = {
    half: cast.ring.half,
    margin: StanceShape.margin(cast.a.body.measure),
    step: StanceShape.step(cast.a.body.measure),
  };
  let lateral = 0;
  let linear = 0;
  let turned = 0;
  let ropes = 0;
  let samples = 0;
  let previous: { a: RingFootwork.IPoint; b: RingFootwork.IPoint } | undefined;
  for (let t = 0; t <= action; t += 1 / 30) {
    const a = BoutLaws.origin(schedule, "a", t, cast).point;
    const b = BoutLaws.origin(schedule, "b", t, cast).point;
    for (const p of [a, b])
      assert.ok(
        Math.max(Math.abs(p.x), Math.abs(p.z)) <=
          ring.half - ring.margin + 1e-9,
        `outside the ropes at ${t}`,
      );
    if (RingFootwork.onRopes(a, ring) || RingFootwork.onRopes(b, ring)) ropes++;
    samples++;
    if (previous) {
      const ux = b.x - a.x;
      const uz = b.z - a.z;
      const l = Math.hypot(ux, uz) || 1;
      for (const [now, before] of [
        [a, previous.a],
        [b, previous.b],
      ] as const) {
        const dx = now.x - before.x;
        const dz = now.z - before.z;
        const along = Math.abs((dx * ux + dz * uz) / l);
        linear += along;
        lateral += Math.abs((-dx * uz + dz * ux) / l);
      }
      let d =
        Math.atan2(uz, ux) -
        Math.atan2(previous.b.z - previous.a.z, previous.b.x - previous.a.x);
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      turned += d;
    }
    previous = { a, b };
  }
  assert.ok(
    lateral / (lateral + linear) >= 0.3,
    `lateral share ${lateral / (lateral + linear)}`,
  );
  assert.ok(Math.abs(turned) >= 2 * Math.PI, `line turned ${turned}`);
  assert.ok(
    ropes > 0 && ropes / samples <= 0.25,
    `ropes share ${ropes / samples}`,
  );
}

/** The suffix of a counter exchange inside its beat. */
const COUNTER: RegExp = /c\d*$/;
