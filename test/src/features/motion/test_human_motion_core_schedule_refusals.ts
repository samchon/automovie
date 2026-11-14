import type { resolveAutoMovieSchedule } from "@automovie/engine";
import {
  HumanChain,
  HumanCue,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A composition that names an instant the film does not have is refused as
 * a located `HumanRefusal` that lists what the film does have, and a sync no
 * body can meet names the earliest cue it can.
 *
 * The author of a composition is a coding agent whose only feedback is the
 * refusal, so each one must say who was to act, which name is wrong and
 * which names exist, as fields. A plain error with a sentence does not.
 *
 * Scenarios, the average man as `a` and the small woman as `b`, a dialogue
 * track with two accents and a music track of 16 beats at 96 a minute:
 * 1. A nod synced to an anchor no action carries is a `participant` refusal
 *    on `of`, located on `b`'s `gesture`, listing the anchor that exists
 *    (`greeting`) and both tracks; synced to a listed anchor it plans.
 * 2. A nod synced to an event the anchored wave does not have is a
 *    `parameter` refusal on `event` listing the wave's instants, `start` and
 *    `end` among them; synced to a listed one it plans.
 * 3. A nod synced to the third accent of two is a `parameter` refusal on
 *    `index` whose feasible range is the whole numbers 0 to 1.
 * 4. Two actions under one anchor are a `parameter` refusal on `anchor`
 *    naming the id; an action anchored under a track's name likewise.
 * 5. A stand cut on an anchor nothing carries is a `participant` refusal
 *    located on `a`'s `stand`.
 * 6. A wave whose stroke is synced to the first beat, at the film's first
 *    instant, cannot prepare in time: the `sync` refusal's fix names a beat
 *    by index. Synced to that beat the wave plans, and synced to the beat
 *    before it the wave is refused again, so the index named is the
 *    earliest.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each composition through the public chain and reads the thrown refusal's class, axis, place and feasible set, then applies the stated repair; a plain error, an unlocated refusal, a list without the existing names or a named beat that is not the earliest fails.
 * @evidence contracts/development/testing.md#independent-expectations The names that must be listed are the ones the test itself anchored and tracked; the earliest beat is checked by performing it and its predecessor, not by reading the planner's lead time.
 * @evidence contracts/development/testing.md#distinguishing-cases A missing anchor on a sync and on a cut, a missing event, an index one past the last, a duplicate among actions and against a track, and the boundary between the last beat too early and the first one late enough. The cut and the sync that plan are `test_human_motion_sync_cues`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds short performances in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why a refusal carries fields and the 6 scenarios.
 */
export function test_human_motion_core_schedule_refusals(): void {
  const complaints: string[] = [];
  const cues: Record<string, readonly resolveAutoMovieSchedule.ICue[]> = {
    dialogue: HumanCue.dialogue([{ from: 1, to: 4, accents: [2.0, 3.2] }]),
    music: HumanCue.beats({ bpm: 96, count: 16 }),
  };
  const bodies: Record<string, IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const perform = (composition: { node: HumanChain["node"] }): unknown => {
    try {
      new HumanPerformance({
        seed: "refusals",
        cues,
        performers: Object.entries(bodies).map(
          ([subject, body]: [string, IHumanBody], index: number) => ({
            subject,
            body,
            at: { x: index * 1.2, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" as const },
          }),
        ),
        composition: composition.node,
      });
    } catch (error) {
      return error;
    }
    return null;
  };
  const said = (thrown: unknown): string =>
    thrown instanceof Error ? thrown.message : String(thrown);
  const listed = (thrown: unknown): readonly string[] =>
    thrown instanceof HumanRefusal && thrown.feasible?.kind === "alternatives"
      ? thrown.feasible.values
      : [];

  // The listener's nod, synced as each scenario says.
  const answer = (
    sync: Parameters<HumanChain["sync"]>[0],
  ): { node: HumanChain["node"] } =>
    HumanChain.subject("a")
      .gesture({ kind: "wave" }, "greeting")
      .with(
        HumanChain.subject("b")
          .stand({ seconds: 6 })
          .gesture({ kind: "nod" })
          .sync(sync),
      );

  // 1. An anchor nothing carries.
  const anchorless: unknown = perform(
    answer({ of: "greting", event: "strokeEnd" }),
  );
  if (
    !(
      anchorless instanceof HumanRefusal &&
      anchorless.kind === "participant" &&
      anchorless.axis === "of" &&
      anchorless.performer === "b" &&
      anchorless.act === "gesture" &&
      anchorless.instance === 1 &&
      ["greeting", "dialogue", "music"].every((name: string): boolean =>
        listed(anchorless).includes(name),
      )
    )
  )
    complaints.push(
      `a sync to an anchor nothing carries: expected a participant refusal on of, located on b.gesture#1 and listing greeting, dialogue and music, got ${said(anchorless)}`,
    );
  const repaired: unknown = perform(
    answer({ of: "greeting", event: "strokeEnd" }),
  );
  if (repaired !== null)
    complaints.push(
      `the same sync to the listed anchor: expected to plan, got ${said(repaired)}`,
    );

  // 2. An event the anchor does not have.
  const eventless: unknown = perform(
    answer({ of: "greeting", event: "strokEnd" }),
  );
  if (
    !(
      eventless instanceof HumanRefusal &&
      eventless.kind === "parameter" &&
      eventless.axis === "event" &&
      eventless.performer === "b" &&
      ["start", "strokeStart", "strokeEnd", "end"].every(
        (name: string): boolean => listed(eventless).includes(name),
      )
    )
  )
    complaints.push(
      `a sync to an event the wave lacks: expected a parameter refusal on event listing its instants, got ${said(eventless)}`,
    );
  for (const event of listed(eventless)) {
    const fixed: unknown = perform(
      answer({ of: "greeting", event, offset: 3 }),
    );
    if (fixed !== null)
      complaints.push(
        `the same sync to the listed instant ${event}: expected to plan, got ${said(fixed)}`,
      );
  }

  // 3. An occurrence past the last.
  const beyond: unknown = perform(
    answer({ of: "dialogue", event: "accent", index: 2 }),
  );
  if (
    !(
      beyond instanceof HumanRefusal &&
      beyond.kind === "parameter" &&
      beyond.axis === "index" &&
      beyond.feasible?.kind === "range" &&
      beyond.feasible.minimum === 0 &&
      beyond.feasible.maximum === 1 &&
      beyond.feasible.whole === true
    )
  )
    complaints.push(
      `a sync to the third accent of two: expected a parameter refusal on index with the whole range 0 to 1, got ${said(beyond)}`,
    );

  // 4. One id for two things.
  for (const [label, composition] of [
    [
      "two actions under one anchor",
      HumanChain.subject("a")
        .stand({ seconds: 1 }, "beat-one")
        .stand({ seconds: 1 }, "beat-one"),
    ],
    [
      "an action anchored under a track's name",
      HumanChain.subject("a").stand({ seconds: 1 }, "music"),
    ],
  ] as const) {
    const twice: unknown = perform(composition);
    if (
      !(
        twice instanceof HumanRefusal &&
        twice.kind === "parameter" &&
        twice.axis === "anchor" &&
        twice.performer === "a" &&
        twice.act === "stand" &&
        (twice.value === "beat-one" || twice.value === "music")
      )
    )
      complaints.push(
        `${label}: expected a parameter refusal on anchor located on a.stand, got ${said(twice)}`,
      );
  }

  // 5. A cut that waits for nothing.
  const waiting: unknown = perform(
    HumanChain.subject("a")
      .stand({ seconds: 5 })
      .until({ of: "nobody", event: "end" })
      .gesture({ kind: "nod" }),
  );
  if (
    !(
      waiting instanceof HumanRefusal &&
      waiting.kind === "participant" &&
      waiting.axis === "of" &&
      waiting.performer === "a" &&
      waiting.act === "stand" &&
      listed(waiting).includes("music")
    )
  )
    complaints.push(
      `a cut on an anchor nothing carries: expected a participant refusal located on a.stand listing the tracks, got ${said(waiting)}`,
    );

  // 6. The earliest beat a wave's stroke can meet.
  const onBeat = (index: number): unknown =>
    perform(
      HumanChain.subject("a")
        .gesture({ kind: "wave" })
        .sync({ of: "music", event: "beat", index, align: "strokeStart" }),
    );
  const early: unknown = onBeat(0);
  const named: RegExpExecArray | null =
    early instanceof HumanRefusal
      ? /beat index (\d+) of music/.exec(early.fix)
      : null;
  if (!(early instanceof HumanRefusal && early.axis === "sync") || !named)
    complaints.push(
      `a stroke synced to the film's first instant: expected a sync refusal whose fix names a beat of music by index, got ${said(early)}`,
    );
  else {
    const index: number = Number(named[1]);
    const met: unknown = onBeat(index);
    if (met !== null)
      complaints.push(
        `the wave synced to the beat the refusal names (${index}): expected to plan, got ${said(met)}`,
      );
    if (index < 1 || onBeat(index - 1) === null)
      complaints.push(
        `the refusal names beat ${index} as the earliest, yet beat ${index - 1} plans or is the first`,
      );
  }

  TestValidator.equals(
    "what the film does not have is refused with what it has",
    complaints,
    [],
  );
}
