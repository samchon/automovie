import {
  AutoMovieComposition,
  AutoMovieScheduleError,
  type IAutoMovieIntent,
  type IAutoMovieSchedule,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A part aligned to an anchor by an occurrence index counts that occurrence
 * of an event, so an index with no event is refused rather than read as the
 * anchor's contact.
 *
 * Scenarios:
 * 1. A part aligned to a 2 s kick anchored "k" with `index` 1 and no event
 *    throws an `AutoMovieScheduleError` of code `index` whose value is 1 and
 *    whose `of` is "k".
 * 2. The same part aligned with the event `impact` and `index` 0 starts at
 *    the kick's impact, 1.0 s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real compositions through the public resolver and reads the thrown error's fields and the placed start; an index silently ignored, a wrong code or a misplaced part fails.
 * @evidence contracts/development/testing.md#independent-expectations The start is the declared share times the declared duration; the code is the error's documented `index` check.
 * @evidence contracts/development/testing.md#distinguishing-cases An index with no event against the same alignment naming its event.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 2 scenarios.
 */
export function test_composition_schedule_index_event(): void {
  const laws: resolveAutoMovieSchedule.ILaws = {
    timing: (intent: IAutoMovieIntent): resolveAutoMovieSchedule.ITiming =>
      intent.capability === "kick"
        ? { duration: 2, contact: 1, events: [{ name: "impact", share: 0.5 }] }
        : { duration: 1 },
  };
  const kick: IAutoMovieIntent & { anchor: string } = {
    subject: "a",
    capability: "kick",
    anchor: "k",
  };
  const step: IAutoMovieIntent = { subject: "b", capability: "step" };

  // 1. An index with no event.
  let caught: unknown = undefined;
  try {
    resolveAutoMovieSchedule(
      AutoMovieComposition.sequence(
        kick,
        AutoMovieComposition.at("k", step, 0, { index: 1 }),
      ),
      laws,
    );
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    `an index with no event is refused on code index (${String(caught)})`,
    caught instanceof AutoMovieScheduleError &&
      caught.code === "index" &&
      caught.value === 1 &&
      caught.of === "k",
  );

  // 2. The same alignment naming its event.
  const placed: IAutoMovieSchedule = resolveAutoMovieSchedule(
    AutoMovieComposition.parallel(
      kick,
      AutoMovieComposition.at("k", step, 0, { event: "impact", index: 0 }),
    ),
    laws,
  );
  const start: number | undefined = placed.entries.find(
    (e: IAutoMovieSchedule.IEntry): boolean => e.intent.subject === "b",
  )?.start;
  TestValidator.predicate(
    `aligned to the impact the step starts at 1.0 s (${start})`,
    start !== undefined && Math.abs(start - 1) < 1e-12,
  );
}
