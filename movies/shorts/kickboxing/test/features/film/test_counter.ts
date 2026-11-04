import assert from "node:assert/strict";
import * as THREE from "three";

import { FilmCounter } from "../../../src/film/FilmCounter";
import { FilmExchange } from "../../../src/film/FilmExchange";
import type { FilmPlan } from "../../../src/film/FilmPlan";
import { LabActor } from "../../../src/motion-lab/LabActor";
import type { LabRecovery } from "../../../src/motion-lab/LabRecovery";

/**
 * A counter selects the original withdrawal clock without restarting either arm.
 * Scenarios: 1. Single-arm onset and unchanged input. 2. Two independent original lifetimes and a nonzero visible-entry prefix. 3. Invalid, duplicate and inconsistent ownership or phase clocks.
 * @evidence contracts/testing.md#observable-behavior Calls the actual pure counter-onset operation with explicit original phase records. The assertions catch clock reset, treating settling as retraction, selecting the earlier combination arm and accepting duplicate limb ownership. No actor, global or foreign method is replaced.
 * @evidence contracts/testing.md#independent-cases The authored fraction is .35 of withdrawal; the test's .2-second release and .4-second retraction therefore yield .34 seconds independently. A later .5-second cross release with .2-second withdrawal yields .57, while the earlier jab's deadline stays .9. Adding a 1.25-second visible entry moves that same onset to 1.82 without changing either withdrawal duration. This pure test does not establish actual body, contact, motion or audiovisual acceptance.
 */
export function test_counter_original_clock(): void {
  const single: Pick<
    LabRecovery,
    "actorId" | "actions" | "releasedSeconds" | "endSeconds"
  > = {
    actorId: "a",
    actions: [
      {
        actionId: "original-jab",
        side: "left",
        deliveryStartSeconds: 0.08,
        releasedSeconds: 0.2,
        retractionSeconds: 0.4,
        endSeconds: 0.9,
      },
    ],
    releasedSeconds: 0.2,
    endSeconds: 0.9,
  };
  const original: string = JSON.stringify(single);
  assert.ok(Math.abs(FilmCounter.onset(single) - 0.34) < 1e-12);
  assert.equal(JSON.stringify(single), original);

  const pair: typeof single = {
    ...single,
    actions: [
      ...single.actions,
      {
        actionId: "original-cross",
        side: "right",
        deliveryStartSeconds: 0.35,
        releasedSeconds: 0.5,
        retractionSeconds: 0.2,
        endSeconds: 0.85,
      },
    ],
    releasedSeconds: 0.5,
  };
  assert.ok(Math.abs(FilmCounter.onset(pair) - 0.57) < 1e-12);
  assert.equal(pair.actions[0]!.endSeconds, 0.9);
  assert.equal(pair.actions[1]!.endSeconds, 0.85);
  assert.ok(
    FilmCounter.onset(pair) > pair.releasedSeconds &&
      FilmCounter.onset(pair) < pair.endSeconds,
  );
  const reversed: typeof single = {
    ...pair,
    actions: [...pair.actions].reverse(),
  };
  assert.equal(FilmCounter.onset(reversed), FilmCounter.onset(pair));
  const prefix: number = 1.25;
  const entered: typeof single = {
    actorId: pair.actorId,
    actions: pair.actions.map(
      (
        action: LabRecovery["actions"][number],
      ): LabRecovery["actions"][number] => ({
        ...action,
        deliveryStartSeconds: action.deliveryStartSeconds + prefix,
        releasedSeconds: action.releasedSeconds + prefix,
        endSeconds: action.endSeconds + prefix,
      }),
    ),
    releasedSeconds: pair.releasedSeconds + prefix,
    endSeconds: pair.endSeconds + prefix,
  };
  assert.ok(Math.abs(FilmCounter.onset(entered) - 1.82) < 1e-12);
  assert.ok(
    Math.abs(FilmCounter.onset(entered) - prefix - FilmCounter.onset(pair)) <
      1e-12,
  );
  assert.equal(entered.actions[0]!.retractionSeconds, 0.4);
  assert.equal(entered.actions[1]!.retractionSeconds, 0.2);
  assert.ok(Math.abs(FilmCounter.onset(single, 0.4) - 0.4) < 1e-12);
  assert.equal(FilmCounter.onset(single, 0.1), FilmCounter.onset(single));
  for (const deadline of [0.6, 0.8, NaN, Infinity, -0.1])
    assert.throws((): number => FilmCounter.onset(single, deadline));

  assert.throws((): number => FilmCounter.onset({ ...single, actions: [] }));
  assert.throws((): number => FilmCounter.onset({ ...single, actorId: " " }));
  assert.throws((): number =>
    FilmCounter.onset({ ...single, releasedSeconds: 0.1 }),
  );
  assert.throws((): number => FilmCounter.onset({ ...single, endSeconds: 1 }));
  assert.throws((): number =>
    FilmCounter.onset({
      ...pair,
      actions: [pair.actions[0]!, { ...pair.actions[1]!, side: "left" }],
    }),
  );
  assert.throws((): number =>
    FilmCounter.onset({
      ...pair,
      actions: [
        pair.actions[0]!,
        { ...pair.actions[1]!, actionId: "original-jab" },
      ],
    }),
  );
  for (const invalid of [NaN, Infinity, -0.1, 0])
    assert.throws((): number =>
      FilmCounter.onset({
        ...single,
        actions: [{ ...single.actions[0]!, retractionSeconds: invalid }],
      }),
    );
  assert.throws((): number =>
    FilmCounter.onset({
      ...single,
      actions: [{ ...single.actions[0]!, deliveryStartSeconds: 0.3 }],
    }),
  );
  assert.throws((): number =>
    FilmCounter.onset({
      ...single,
      actions: [{ ...single.actions[0]!, endSeconds: 0.59 }],
      endSeconds: 0.59,
    }),
  );
  const contact: NonNullable<LabRecovery["actions"][number]["contact"]> = {
    event: {
      actionId: "original-jab",
      actorId: "a",
      targetId: "b",
      time: 0.15,
      relation: "guard",
      point: [0, 1.5, 0],
      normal: [1, 0, 0],
    },
    sample: {
      pose: {},
      rootOffset: [0, 0, 0],
      support: { left: 0.5, right: 0.5 },
      effectors: [],
      phase: "contact",
      elapsed: 0.15,
      progress: 0,
    },
  };
  const observed: typeof single = {
    ...single,
    actions: [{ ...single.actions[0]!, contact }],
  };
  assert.equal(FilmCounter.onset(observed), FilmCounter.onset(single));
  for (const event of [
    { ...contact.event, actionId: "foreign-action" },
    { ...contact.event, actorId: "b" },
    { ...contact.event, targetId: "a" },
    { ...contact.event, time: 0.21 },
    { ...contact.event, time: NaN },
  ])
    assert.throws((): number =>
      FilmCounter.onset({
        ...observed,
        actions: [{ ...observed.actions[0]!, contact: { ...contact, event } }],
      }),
    );
}

/**
 * The actual counter begins before the outgoing arm has completed its withdrawal.
 * Scenarios: 1. Actual unchanged entry and overlapping original lifetimes. 2. Independent complete physical admission and arbitrary seek order. 3. Contact identity, detached receipts and invalid seeks.
 * @evidence contracts/testing.md#observable-behavior Constructs FilmExchange and FilmCounter with the real borrowed original Human polygon actors. Actual WORLD hands and roots at the ownership boundary remain within the established .25mm hard-goal tolerance. Both performers must pass native support and complete-foot floor admission at each sample. Reordered seeks and different intermediate sampling schedules reproduce the same actual poses and WORLD transforms. This test does not establish continuously watched motion, complete articulated CCD, force or sound quality.
 * @evidence contracts/testing.md#independent-cases The opposing right cross takes over the actual preceding right-hand parry, while the original attacker slips and continues his left-arm withdrawal. Counter onset must precede the independently retained original action deadline, and each contact must retain its originating action/participant. .25mm hard support and 1µm floor limits are unchanged host contracts, not fitted expectations. The pure companion owns malformed clock and duplicate-side metadata; the shared receiving consumer owns actual same-side conflict refusal.
 */
export function test_counter_actual_pair_and_seek(): void {
  const actors: Record<"a" | "b", LabActor> = {
    a: new LabActor("a", "a", -0.55, 0),
    b: new LabActor("b", "b", 0.55, Math.PI),
  };
  let previous: FilmExchange | undefined;
  let counter: FilmCounter | undefined;
  try {
    const first: FilmPlan.Exchange = {
      id: "counter-test-first",
      beat: 1,
      start: 0,
      end: 1.5,
      actorId: "a",
      technique: "jab",
      side: "left",
      target: "guard",
      defense: "parry",
      seed: 3040,
    };
    const next: FilmPlan.Exchange = {
      id: "counter-test-response",
      beat: 1,
      start: 1.5,
      end: 3,
      actorId: "b",
      technique: "cross",
      side: "right",
      target: "head",
      defense: "slip",
      seed: 3053,
      counterOf: first.id,
    };
    previous = new FilmExchange(first, actors, { continuingCounter: true });
    const outgoing: LabRecovery = previous.consumer().recoveryPort();
    counter = new FilmCounter(previous, next, actors);
    assert.ok(counter.start < next.start);
    assert.ok(counter.start > previous.filmTime(outgoing.releasedSeconds));
    assert.ok(counter.start < previous.filmTime(outgoing.endSeconds));

    previous.evaluate(counter.start);
    const entry: Record<
      "a" | "b",
      { root: THREE.Vector3; left: THREE.Vector3; right: THREE.Vector3 }
    > = { a: landmarks(actors.a), b: landmarks(actors.b) };
    counter.evaluate(counter.start);
    for (const id of ["a", "b"] as const) {
      const actual: ReturnType<typeof landmarks> = landmarks(actors[id]);
      for (const point of ["root", "left", "right"] as const)
        assert.ok(
          actual[point].distanceTo(entry[id][point]) <= 0.00025,
          `${id} ${point} changed at counter handoff`,
        );
    }
    const at: (seconds: number) => string = (seconds: number): string => {
      counter!.evaluate(seconds);
      for (const actor of Object.values(actors)) {
        assert.equal(actor.support?.status, "admitted");
        assert.ok(actor.support!.supportError <= 0.00025);
        assert.ok(actor.support!.floorMinimum >= -0.000001);
      }
      return JSON.stringify(
        Object.values(actors).map((actor: LabActor): object => ({
          pose: actor.pose,
          root: actor.person.object.position.toArray(),
          left: actor
            .glove("left")
            .getWorldPosition(new THREE.Vector3())
            .toArray(),
          right: actor
            .glove("right")
            .getWorldPosition(new THREE.Vector3())
            .toArray(),
        })),
      );
    };
    const target: number = counter.start + 0.18;
    const forward: string = at(target);
    at(counter.end);
    at(counter.start);
    at(counter.start + 0.09);
    assert.equal(at(target), forward);
    for (let tick: number = 0; tick < 6; tick++) at(counter.start + tick / 60);
    assert.equal(at(target), forward);
    for (let tick: number = 0; tick < 5; tick++) at(counter.start + tick / 30);
    assert.equal(at(target), forward);

    const contacts: FilmExchange.Contact[] = counter.contacts();
    for (const contact of contacts) {
      assert.equal(contact.actionId, next.id);
      assert.equal(contact.actorId, "b");
      assert.equal(contact.targetId, "a");
    }
    const retained: string = JSON.stringify(counter.contacts());
    if (contacts[0]) contacts[0].point[0] += 100;
    assert.equal(JSON.stringify(counter.contacts()), retained);
    const events: FilmPlan.Event[] = counter.audioEvents();
    const attempts: FilmPlan.Event[] = events.filter(
      (event: FilmPlan.Event): boolean => event.kind === "attempt",
    );
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0]!.actionId, next.id);
    assert.ok(
      attempts[0]!.seconds >= counter.start &&
        attempts[0]!.seconds < previous.filmTime(outgoing.endSeconds),
    );
    for (const event of events)
      assert.ok(event.seconds >= counter.start && event.seconds <= counter.end);
    const originalEvents: string = JSON.stringify(counter.audioEvents());
    attempts[0]!.seconds = 100;
    assert.equal(JSON.stringify(counter.audioEvents()), originalEvents);
    const beforeFailure: string = at(target);
    for (const invalid of [
      counter.start - 0.01,
      counter.end + 0.01,
      NaN,
      Infinity,
    ])
      assert.throws((): void => counter!.evaluate(invalid));
    assert.equal(at(target), beforeFailure);
  } finally {
    counter?.dispose();
    previous?.dispose();
    for (const actor of Object.values(actors)) actor.dispose();
  }
}

/** Copy actual WORLD endpoints of the same original bone-bound gloves. */
function landmarks(actor: LabActor): {
  root: THREE.Vector3;
  left: THREE.Vector3;
  right: THREE.Vector3;
} {
  return {
    root: actor.person.object.position.clone(),
    left: actor.glove("left").getWorldPosition(new THREE.Vector3()),
    right: actor.glove("right").getWorldPosition(new THREE.Vector3()),
  };
}
