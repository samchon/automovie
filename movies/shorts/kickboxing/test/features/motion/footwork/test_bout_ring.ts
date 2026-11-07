import assert from "node:assert/strict";

import { BoutChoreography } from "../../../../src/motion/choreography/BoutChoreography";
import { Blocking } from "../../../../src/motion/defense/Blocking";
import { BoutRing } from "../../../../src/motion/footwork/BoutRing";
import { FilmVector as V } from "../../../../src/motion/rig/FilmVector";
import { BoutScript } from "../../../../src/shots/kickboxing/ring-bout/BoutScript";

/**
 * Ring generalship laws move the pair relative to the opponent and the ropes.
 *
 * Scenarios:
 * 1. Circling turns the pair about the opponent toward the mover's left and keeps their distance.
 * 2. Pressure walks the receiver back on a diagonal; on the ropes he circles off and both stay inside.
 * 3. A pivot turns the pair by exactly a quarter circle and stops.
 * 4. Retaking the centre walks the pair toward the ring's middle.
 * 5. Nothing moves while a strike is in flight.
 */
export function test_bout_ring_laws(): void {
  const initial: BoutRing.IState = { centre: [0, 0], axis: 0 };
  const range: number = 1.8;
  const run = (beat: BoutChoreography.Ring, actor: BoutChoreography.Fighter, seconds: number, start: BoutRing.IState = initial, busy: readonly (readonly [number, number])[] = []): BoutRing.IState[] =>
    BoutRing.simulate({ spans: [{ name: beat, start: 0, end: seconds, ring: { beat, actor } }], busy, origin: 0, end: seconds, range, initial: start });

  // 1. Circling: B steps to his left (toward −Z when facing −X) about A.
  const circled: BoutRing.IState = run("circle", "b", 1).at(-1)!;
  const a1: V.Value = BoutRing.place(circled, range, "a");
  const b1: V.Value = BoutRing.place(circled, range, "b");
  assert.ok(Math.abs(V.distance(a1, b1) - range) < 1e-6, "circling keeps the distance");
  assert.ok(V.distance(a1, BoutRing.place(initial, range, "a")) < 1e-9, "the opponent turns in place");
  assert.ok(b1[2] < -0.3, "B circled toward his own left");

  // 2. Pressure: A walks B back on a diagonal and B never leaves the ring.
  const pressed: BoutRing.IState[] = run("press", "a", 20);
  const early: BoutRing.IState = pressed[60]!;
  assert.ok(early.centre[0] > 0.2, "the pair moves toward B's back");
  assert.ok(Math.abs(early.axis) > 0.05, "B retreats on a diagonal, not straight back");
  for (const state of pressed)
    for (const fighter of ["a", "b"] as const)
      assert.ok(BoutRing.room(BoutRing.place(state, range, fighter)) >= BoutRing.MARGIN - 1e-9, "inside the ropes");
  const late: V.Value = BoutRing.place(pressed.at(-1)!, range, "b");
  assert.ok(BoutRing.room(late) < BoutRing.ROPES + BoutRing.STRIDE, "B reached the rope zone");

  // 3. Pivot: a quarter circle around the opponent, then nothing more.
  const pivoted: BoutRing.IState = run("pivot", "a", 6).at(-1)!;
  assert.ok(Math.abs(Math.abs(pivoted.axis) - BoutRing.PIVOT) < 1e-6, "quarter turn");

  // 4. Centre: from near the ropes back toward the middle.
  const off: BoutRing.IState = { centre: [1.2, 0.8], axis: 0 };
  const centred: BoutRing.IState = run("center", "a", 2, off).at(-1)!;
  assert.ok(Math.hypot(...centred.centre) < Math.hypot(...off.centre) - 0.5, "walked toward the centre");

  // 5. Held ground during a strike.
  const held: BoutRing.IState[] = run("circle", "b", 1, initial, [[0, 2]]);
  const still: BoutRing.IState = held.at(-1)!;
  assert.ok(Math.abs(still.axis) === 0 && still.centre[0] === 0 && still.centre[1] === 0, "held ground");
}

/**
 * The composed bout meets the ring-craft targets in `docs/research/ring-craft.md`.
 *
 * Scenarios:
 * 1. At least 30% of the fighters' footwork path is lateral to their line, and the line turns through a full revolution.
 * 2. The pair works on the ropes for part of the bout but no more than a quarter of it, and never leaves the ring.
 * 3. At least 75% of strikes are thrown in combinations, at least 85% of exchanges contain one, and exchanges are separated by resets averaging 3.4 ± 1.2 s.
 */
export function test_bout_ring_targets(): void {
  const step: number = BoutRing.STEP;
  let lateral: number = 0;
  let path: number = 0;
  let turned: number = 0;
  let ropes: number = 0;
  let previous: Blocking.Pair | undefined;
  // Sampled at four simulation steps: footwork steps last longer than that.
  for (let t: number = BoutScript.TOUCHED; t < BoutScript.KNOCKOUT; t += 4 * step) {
    const pair: Blocking.Pair = Blocking.pair(t);
    const points: V.Value[] = [pair.a.origin, pair.b.origin].map((origin: readonly [number, number]): V.Value => [origin[0], 0, origin[1]]);
    for (const point of points) assert.ok(BoutRing.room(point) > 0, `inside the ropes at ${t}`);
    if (Math.min(...points.map(BoutRing.room)) < BoutRing.ROPES) ropes += 4 * step;
    if (previous) {
      const line: V.Value = [Math.cos(pair.axis), 0, -Math.sin(pair.axis)];
      for (const [index, origin] of [previous.a.origin, previous.b.origin].entries()) {
        const move: V.Value = V.sub(points[index]!, [origin[0], 0, origin[1]]);
        const along: number = V.dot(move, line);
        path += V.length(move);
        lateral += Math.sqrt(Math.max(0, V.dot(move, move) - along * along));
      }
      turned += Math.abs(Math.atan2(Math.sin(pair.axis - previous.axis), Math.cos(pair.axis - previous.axis)));
    }
    previous = pair;
  }
  assert.ok(lateral / path >= 0.3, `lateral share ${(lateral / path).toFixed(3)}`);
  assert.ok(turned >= 2 * Math.PI, `line turned ${turned.toFixed(2)} rad`);
  assert.ok(ropes > 0 && ropes <= 0.25 * (BoutScript.KNOCKOUT - BoutScript.TOUCHED), `on the ropes ${ropes.toFixed(1)} s`);

  // Combinations and exchange rhythm.
  const exchanges: BoutChoreography.IExchange[] = BoutScript.groups.flatMap((group: BoutChoreography.IGroup): BoutChoreography.IExchange[] => [...group.exchanges]);
  const strikes = (phrase: BoutChoreography.IPhrase): number => phrase.moves.filter((move: BoutChoreography.Move): boolean => move !== "settle").length;
  const phrases: BoutChoreography.IPhrase[] = exchanges.flatMap((exchange: BoutChoreography.IExchange): BoutChoreography.IPhrase[] => [...exchange.phrases]);
  const thrown: number = phrases.reduce((sum: number, phrase: BoutChoreography.IPhrase): number => sum + strikes(phrase), 0);
  const combined: number = phrases.filter((phrase: BoutChoreography.IPhrase): boolean => strikes(phrase) >= 2).reduce((sum: number, phrase: BoutChoreography.IPhrase): number => sum + strikes(phrase), 0);
  assert.ok(combined / thrown >= 0.75, `strikes in combinations ${(combined / thrown).toFixed(3)}`);
  const withCombination: number = exchanges.filter((exchange: BoutChoreography.IExchange): boolean => exchange.phrases.some((phrase: BoutChoreography.IPhrase): boolean => strikes(phrase) >= 2)).length;
  assert.ok(withCombination / exchanges.length >= 0.85, `exchanges with a combination ${(withCombination / exchanges.length).toFixed(3)}`);
  const spans: BoutRing.ISpan[] = BoutRing.spans(BoutScript.actions, BoutScript.groups, BoutScript.TOUCHED);
  const resets: number[] = spans.slice(1).map((span: BoutRing.ISpan, index: number): number => {
    const first: number = Math.min(
      ...BoutScript.actions
        .filter((action: BoutScript.Action): boolean => action.exchange === span.name)
        .map((action: BoutScript.Action): number => action.at - BoutScript.specs[action.technique].windup),
    );
    return first - spans[index]!.end;
  });
  const mean: number = resets.reduce((sum: number, value: number): number => sum + value, 0) / resets.length;
  assert.ok(mean >= 3.4 - 1.2 && mean <= 3.4 + 1.2, `mean reset ${mean.toFixed(2)} s`);
}
