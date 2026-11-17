import { resolveAutoMovieContactEvents } from "@automovie/engine";
import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A weapon and a body that state how fast their points move are scanned by
 * conservative advancement: a clear gap rules out a contact for the gap over
 * the two bounds together, so the scan reads no grid step inside that time,
 * and the contact it finds is the one every step read finds.
 *
 * The geometry is plain and solved by hand. A sphere of radius 0.05 m flies
 * along x from x = -1 m at 2 m/s over a span of 2 s at a step of 1/120 s.
 * A wall fills x >= 0 and stands still, so the sphere touches it at
 * (1 - 0.05) / 2 = 0.475 s. A second wall recedes at 1 m/s from x = 0, so the
 * gap closes at 1 m/s and the sphere touches it at 0.95 s. A third sphere
 * stops at x = -0.2 m and meets nothing. The wall's distance is counted.
 *
 * Scenarios:
 * 1. With both bounds stated (2 m/s and 0, or 2 and 1), the event is the one
 *    found without them, to the same second exactly, at 0.475 s and at
 *    0.95 s to 1e-6 s.
 * 2. With the bounds, the still wall is measured fewer than a third as often
 *    as without: the gap of 0.95 m at 2 m/s certifies 0.475 s at once, where
 *    every step read costs 57 measurements before the crossing search.
 * 3. A bound on the weapon alone, or on the body alone, changes neither the
 *    event nor the count: the gap's rate is unknown without both.
 * 4. The sphere that stops short meets nothing with the bounds as without.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver with and without stated bounds and reads its events and the body's measurement count; an advancement that moves a contact, misses one or reads every step fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact seconds are solved by hand from straight paths, and the count's bound from the gap over the closing rate; neither is read from the resolver.
 * @evidence contracts/development/testing.md#distinguishing-cases A still body and a moving one, both bounds, one bound alone on either side, none, a hit and a miss.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, the expected seconds, the count's bound and the 4 scenarios.
 */
export function test_motion_contact_events_advancement(): void {
  const run = (props: {
    reach: number;
    recede: number;
    weapon?: number;
    body?: number;
  }): { events: IAutoMovieResolveContactEvents.IEvent[]; calls: number } => {
    let calls: number = 0;
    const events: IAutoMovieResolveContactEvents.IEvent[] =
      resolveAutoMovieContactEvents({
        weapons: [
          {
            id: "w",
            owner: "S",
            radius: 0.05,
            ...(props.weapon === undefined ? {} : { speed: props.weapon }),
            position: (t: number): IAutoMovieVector3 => ({
              x: Math.min(props.reach, -1 + 2 * t),
              y: 0,
              z: 0,
            }),
          },
        ],
        bodies: [
          {
            id: "wall",
            ...(props.body === undefined ? {} : { speed: props.body }),
            distance: (p: IAutoMovieVector3, t: number): number => {
              calls++;
              return props.recede * t - p.x;
            },
          },
        ],
        from: 0,
        to: 2,
        step: 1 / 120,
      });
    return { events, calls };
  };

  // 1 and 2. The same contact, from fewer measurements.
  for (const [label, recede, seconds] of [
    ["a still wall", 0, 0.475],
    ["a wall receding at 1 m/s", 1, 0.95],
  ] as const) {
    const plain = run({ reach: 5, recede });
    const bounded = run({ reach: 5, recede, weapon: 2, body: recede });
    TestValidator.predicate(
      `${label}: the contact at ${seconds} s is the same with the bounds (${bounded.events[0]?.seconds}) as without (${plain.events[0]?.seconds})`,
      plain.events.length === 1 &&
        bounded.events.length === 1 &&
        Math.abs(plain.events[0]!.seconds - seconds) < 1e-6 &&
        bounded.events[0]!.seconds === plain.events[0]!.seconds &&
        bounded.events[0]!.against === "wall",
    );
    if (recede === 0)
      TestValidator.predicate(
        `${label}: measured ${bounded.calls} times with the bounds, under a third of ${plain.calls} without`,
        bounded.calls * 3 < plain.calls,
      );
  }

  // 3. One bound alone certifies nothing.
  const plain = run({ reach: 5, recede: 0 });
  for (const [label, one] of [
    ["the weapon's bound alone", run({ reach: 5, recede: 0, weapon: 2 })],
    ["the body's bound alone", run({ reach: 5, recede: 0, body: 0 })],
  ] as const)
    TestValidator.predicate(
      `${label} leaves the event and the ${plain.calls} measurements as they are (${one.calls})`,
      one.calls === plain.calls &&
        one.events.length === 1 &&
        one.events[0]!.seconds === plain.events[0]!.seconds,
    );

  // 4. A miss stays a miss.
  TestValidator.predicate(
    "a sphere that stops 0.2 m short meets nothing, with the bounds as without",
    run({ reach: -0.2, recede: 0 }).events.length === 0 &&
      run({ reach: -0.2, recede: 0, weapon: 2, body: 0 }).events.length === 0,
  );
}
