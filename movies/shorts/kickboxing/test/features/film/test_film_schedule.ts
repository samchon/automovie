import assert from "node:assert/strict";

import { FilmPlan } from "../../../src/film/FilmPlan";

/**
 * Exercise the delivered half-open frame schedule and exact finishing/count clock.
 *
 * Scenarios:
 * 1. All 5400 output identities resolve once to their independently expected i/30 second.
 * 2. Invalid, fractional and out-of-range identities refuse rather than add an endpoint frame.
 * 3. Exactly one actual finishing request occupies second 150 and ten count events span ten full seconds.
 * 4. Every counter names its immediate opposing predecessor and retains a supported punch-family carry.
 * 5. Camera seek order and caller mutation cannot change the delivered view.
 *
 * @evidence contracts/testing.md#observable-behavior Calls frameSeconds and camera directly, checks endpoint/invalid input behavior, and verifies the consumed action/event clock relationships. The test catches frame-count drift, early tenth count, orphan counter identity and history-dependent camera output; it does not certify actual motion or pixels.
 * @evidence contracts/testing.md#independent-cases The commission fixes 180 seconds, 30fps, KO150 and a ten-second count after157, giving 5400 half-open samples and spoken times158..167 independently. Positive/fractional/boundary/nonfinite cases distinguish schedule admission. Counter actor and family checks protect the current compositor's actual owned-limb domain; geometry and real contacts belong to actual-host tests and Viewer inspection.
 */
export function test_film_schedule(): void {
  assert.equal(FilmPlan.duration, 180);
  assert.equal(FilmPlan.fps, 30);
  assert.equal(FilmPlan.frames, 5400);
  for (let index: number = 0; index < 5400; index++)
    assert.equal(FilmPlan.frameSeconds(index), index / 30);
  assert.equal(FilmPlan.frameSeconds(0), 0);
  assert.equal(FilmPlan.frameSeconds(5399), 180 - 1 / 30);
  for (const index of [-1, 5400, 0.5, NaN, Infinity])
    assert.throws((): number => FilmPlan.frameSeconds(index));
  const finishes: readonly Readonly<FilmPlan.Exchange>[] =
    FilmPlan.exchanges.filter(
      (exchange: Readonly<FilmPlan.Exchange>): boolean =>
        exchange.impactSeconds !== undefined,
    );
  assert.equal(finishes.length, 1);
  assert.equal(finishes[0]!.impactSeconds, 150);
  assert.equal(finishes[0]!.end, 150);
  assert.equal(finishes[0]!.technique, "high-kick");
  assert.equal(finishes[0]!.target, "head");
  assert.equal(finishes[0]!.side, "left");
  assert.equal(FilmPlan.exchanges.at(-2)!.technique, "hook");
  assert.equal(FilmPlan.exchanges.at(-2)!.actorId, finishes[0]!.actorId);
  assert.equal(FilmPlan.exchanges.at(-2)!.side, finishes[0]!.side);
  const count: readonly Readonly<FilmPlan.Event>[] = FilmPlan.events.filter(
    (event: Readonly<FilmPlan.Event>): boolean => event.kind === "count",
  );
  assert.deepEqual(
    count.map(
      (event: Readonly<FilmPlan.Event>): number | undefined => event.count,
    ),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(
    count.map((event: Readonly<FilmPlan.Event>): number => event.seconds),
    [158, 159, 160, 161, 162, 163, 164, 165, 166, 167],
  );
  assert.equal(count.at(-1)!.seconds - FilmPlan.countStart, 10);
  assert.ok(FilmPlan.decisionSeconds > count.at(-1)!.seconds);
  for (let index: number = 0; index < FilmPlan.exchanges.length; index++) {
    const exchange: Readonly<FilmPlan.Exchange> = FilmPlan.exchanges[index]!;
    assert.ok(exchange.end > exchange.start);
    assert.ok(exchange.start >= 1.55 && exchange.end <= 150);
    if (!exchange.counterOf) continue;
    const preceding: Readonly<FilmPlan.Exchange> =
      FilmPlan.exchanges[index - 1]!;
    assert.equal(exchange.counterOf, preceding.id);
    assert.notEqual(exchange.actorId, preceding.actorId);
    assert.ok(!preceding.technique.endsWith("kick"));
    assert.equal(exchange.defense, "slip");
    assert.equal(
      exchange.side,
      preceding.technique === "one-two"
        ? preceding.side
        : preceding.side === "left"
          ? "right"
          : "left",
    );
  }
  const first: FilmPlan.Camera = FilmPlan.camera(149.9);
  const expected: FilmPlan.Camera = structuredClone(first);
  FilmPlan.camera(0);
  FilmPlan.camera(180);
  assert.deepEqual(FilmPlan.camera(149.9), expected);
  first.position[0] = 999;
  first.target[1] = -999;
  assert.deepEqual(FilmPlan.camera(149.9), expected);
  for (const seconds of [-0.001, 180.001, NaN, Infinity])
    assert.throws((): FilmPlan.Camera => FilmPlan.camera(seconds));
}
