import { AutoMovieEngineComposition, AutoMovieEngineScheduleError, AutoMovieEngineSchedule } from "@automovie/engine";
import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
  IAutoMovieScheduleLaws,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A part aligned to an anchor by an occurrence index counts that occurrence of
 * an event, so an index with no event is refused rather than read as the
 * anchor's contact.
 *
 * Scenarios:
 *
 * 1. A part aligned to a 2 s kick anchored "k" with `index` 1 and no event throws
 *    an `AutoMovieEngineScheduleError` of code `index` whose value is 1 and whose
 *    `of` is "k".
 * 2. The same part aligned with the event `impact` and `index` 0 starts at the
 *    kick's impact, 1.0 s.
 */
export function test_engine_composition_resolve_schedule_index_event(): void {
  const laws: IAutoMovieScheduleLaws = {
    timing: (intent: IAutoMovieIntent): IAutoMovieIntentTiming =>
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
    AutoMovieEngineSchedule.resolve(
      AutoMovieEngineComposition.sequence(
        kick,
        AutoMovieEngineComposition.at("k", step, 0, { index: 1 }),
      ),
      laws,
    );
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    `an index with no event is refused on code index (${String(caught)})`,
    caught instanceof AutoMovieEngineScheduleError &&
      caught.code === "index" &&
      caught.value === 1 &&
      caught.of === "k",
  );

  // 2. The same alignment naming its event.
  const placed: IAutoMovieSchedule = AutoMovieEngineSchedule.resolve(
    AutoMovieEngineComposition.parallel(
      kick,
      AutoMovieEngineComposition.at("k", step, 0, { event: "impact", index: 0 }),
    ),
    laws,
  );
  const start: number | undefined = placed.entries.find(
    (e: IAutoMovieScheduleEntry): boolean => e.intent.subject === "b",
  )?.start;
  TestValidator.predicate(
    `aligned to the impact the step starts at 1.0 s (${start})`,
    start !== undefined && Math.abs(start - 1) < 1e-12,
  );
}
