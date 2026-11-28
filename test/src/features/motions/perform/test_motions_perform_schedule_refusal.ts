import { AutoMovieEngineScheduleError } from "@automovie/engine";
import type { IAutoMovieScheduleError } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  HumanScheduleRefusal
} from "../../../../../packages/motions/src/perform/internal/HumanScheduleRefusal";
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
 * 2. A missing subject prevents location and leaves the counter uncalled.
 * 3. An empty hit track is a `hit` refusal with no alternatives; a hit track
 *    with instants, or another track, is an `event` refusal offering them.
 * 4. An occurrence past a name's instants is an `index` refusal whose whole range
 *    ends one below their count.
 * 5. A taken anchor is an `anchor` refusal; a share outside the action is a
 *    `cut` refusal on `until` over [0, 1].
 * 6. A timing or law error is returned itself.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actionable missing reference, event, index, duplicate and share cases, and errors returned by identity.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `HumanScheduleRefusal` directly with typed scheduler errors and a recording instance callback. It reads the refusal class, axis and feasible alternatives or bounds, and checks that timing and law errors survive unchanged.
 * @evidence contracts/development/testing.md#independent-expectations Three occurrences admit whole indices 0 through 2, so index 5 offers that range. Share 1.25 is beyond [0, 1]. The authored anchor alternative gate and drum alternative beat remain literal, and the instance callback supplies 4 for a/wave.
 */
export function test_motions_perform_schedule_refusal(): void {
  const asked: string[] = [];
  const counter = (subject: string, capability: string): number => {
    asked.push(`${subject}/${capability}`);
    return 4;
  };
  const error = (props: IAutoMovieScheduleError.IProps): AutoMovieEngineScheduleError =>
    new AutoMovieEngineScheduleError("schedule", props);

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
    anchor instanceof AutoMovieMotionHumanRefusal &&
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
    unlocated instanceof AutoMovieMotionHumanRefusal &&
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
    empty instanceof AutoMovieMotionHumanRefusal &&
      empty.axis === "hit" &&
      empty.kind === "participant" &&
      empty.value === "hit:b" &&
      empty.feasible === null &&
      tracked instanceof AutoMovieMotionHumanRefusal &&
      tracked.axis === "event" &&
      tracked.kind === "parameter" &&
      tracked.feasible?.kind === "alternatives" &&
      cue instanceof AutoMovieMotionHumanRefusal &&
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
    index instanceof AutoMovieMotionHumanRefusal &&
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
    duplicate instanceof AutoMovieMotionHumanRefusal &&
      duplicate.kind === "parameter" &&
      duplicate.axis === "anchor" &&
      duplicate.value === "door" &&
      share instanceof AutoMovieMotionHumanRefusal &&
      share.kind === "cut" &&
      share.axis === "until" &&
      share.value === 1.25 &&
      share.feasible?.kind === "range" &&
      share.feasible.minimum === 0 &&
      share.feasible.maximum === 1,
  );

  // 6. Unrepairable.
  const timing: AutoMovieEngineScheduleError = error({ code: "timing", value: 0 });
  const law: AutoMovieEngineScheduleError = error({ code: "law", value: "x" });
  TestValidator.predicate(
    "timing and law errors pass through",
    HumanScheduleRefusal(timing, counter) === timing &&
      HumanScheduleRefusal(law, counter) === law,
  );
}
