import { AutoMovieScheduleError } from "@automovie/engine";
import type { IAutoMovieScheduleError } from "@automovie/interface";
import { HumanRefusal, HumanScheduleRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanScheduleRefusal` turns the resolver's error into the refusal that
 * locates and repairs it, and passes through the errors no change to the
 * composition repairs.
 *
 * Scenarios:
 *
 * 1. A missing anchor is a `participant` refusal on `of`, located at the
 *    performer, act and the instance the caller counts for them, offering the
 *    anchors and tracks there are.
 * 2. Without a subject or capability nothing is located and the counter is not
 *    asked.
 * 3. An empty hit track is a `hit` refusal with no alternatives; a hit track
 *    with instants, or another track, is an `event` refusal offering them.
 * 4. An occurrence past a name's instants is an `index` refusal whose whole range
 *    ends one below their count.
 * 5. A taken anchor is an `anchor` refusal; a share outside the action is a
 *    `cut` refusal on `until` over [0, 1].
 * 6. A timing or law error is returned itself.
 */
export function test_motions_perform_schedule_refusal(): void {
  const asked: string[] = [];
  const counter = (subject: string, capability: string): number => {
    asked.push(`${subject}/${capability}`);
    return 4;
  };
  const error = (props: IAutoMovieScheduleError.IProps): AutoMovieScheduleError =>
    new AutoMovieScheduleError("schedule", props);

  // 1. An anchor.
  const anchor: Error = HumanScheduleRefusal(
    error({
      code: "anchor",
      subject: "a",
      capability: "wave",
      value: "door",
      alternatives: ["gate"],
    }),
    counter,
  );
  TestValidator.predicate(
    "a missing anchor",
    anchor instanceof HumanRefusal &&
      anchor.kind === "participant" &&
      anchor.axis === "of" &&
      anchor.value === "door" &&
      anchor.performer === "a" &&
      anchor.act === "wave" &&
      anchor.instance === 4 &&
      anchor.feasible?.kind === "alternatives" &&
      anchor.feasible.values.join() === "gate" &&
      asked.join() === "a/wave",
  );

  // 2. Unlocated.
  const unlocated: Error = HumanScheduleRefusal(
    error({ code: "anchor", capability: "wave", value: "door" }),
    counter,
  );
  TestValidator.predicate(
    "no subject, no location",
    unlocated instanceof HumanRefusal &&
      unlocated.performer !== "a" &&
      asked.length === 1,
  );

  // 3. Events.
  const empty: Error = HumanScheduleRefusal(
    error({ code: "event", of: "hit:b", value: "hit" }),
    counter,
  );
  const tracked: Error = HumanScheduleRefusal(
    error({ code: "event", of: "hit:b", value: "x", alternatives: ["hit"] }),
    counter,
  );
  const cue: Error = HumanScheduleRefusal(
    error({ code: "event", of: "drums", value: "", alternatives: ["beat"] }),
    counter,
  );
  TestValidator.predicate(
    "hit and cue events",
    empty instanceof HumanRefusal &&
      empty.axis === "hit" &&
      empty.kind === "participant" &&
      empty.value === "hit:b" &&
      empty.feasible === null &&
      tracked instanceof HumanRefusal &&
      tracked.axis === "event" &&
      tracked.kind === "parameter" &&
      tracked.feasible?.kind === "alternatives" &&
      cue instanceof HumanRefusal &&
      cue.axis === "event" &&
      cue.feasible?.kind === "alternatives" &&
      cue.feasible.values.join() === "beat",
  );

  // 4. An index.
  const index: Error = HumanScheduleRefusal(
    error({
      code: "index",
      of: "drums",
      value: 5,
      alternatives: ["beat", "beat", "beat"],
    }),
    counter,
  );
  TestValidator.predicate(
    "an occurrence past the name's instants",
    index instanceof HumanRefusal &&
      index.axis === "index" &&
      index.value === 5 &&
      index.feasible?.kind === "range" &&
      index.feasible.minimum === 0 &&
      index.feasible.maximum === 2 &&
      index.feasible.whole === true,
  );

  // 5. A duplicate and a share.
  const duplicate: Error = HumanScheduleRefusal(
    error({ code: "duplicate", value: "door", alternatives: ["door"] }),
    counter,
  );
  const share: Error = HumanScheduleRefusal(
    error({ code: "share", value: 1.25 }),
    counter,
  );
  TestValidator.predicate(
    "a taken anchor and a share outside the action",
    duplicate instanceof HumanRefusal &&
      duplicate.kind === "parameter" &&
      duplicate.axis === "anchor" &&
      duplicate.value === "door" &&
      share instanceof HumanRefusal &&
      share.kind === "cut" &&
      share.axis === "until" &&
      share.value === 1.25 &&
      share.feasible?.kind === "range" &&
      share.feasible.minimum === 0 &&
      share.feasible.maximum === 1,
  );

  // 6. Unrepairable.
  const timing: AutoMovieScheduleError = error({ code: "timing", value: 0 });
  const law: AutoMovieScheduleError = error({ code: "law", value: "x" });
  TestValidator.predicate(
    "timing and law errors pass through",
    HumanScheduleRefusal(timing, counter) === timing &&
      HumanScheduleRefusal(law, counter) === law,
  );
}
