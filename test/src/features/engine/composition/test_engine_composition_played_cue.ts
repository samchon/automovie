import {
  AutoMovieEngineComposition,
  AutoMovieEngineSchedule,
  AutoMovieEngineScheduleError,
} from "@automovie/engine";
import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieSchedule,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Action anchors cue their played events on the film clock.
 *
 * A two-second action declares two contacts one second apart. Its exact
 * first-contact cut still cues the responder, but an earlier cut cannot. A
 * distinct film-time track retains the originally planned second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes a complete action, a cut exactly at contact, an earlier cut, and a film-time track for the same planned second.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver with typed action and cue-track inputs, and reads its placed entries or typed refusal.
 * @evidence contracts/development/testing.md#independent-expectations The fixture declares a two-second action and contact shares 0.25 and 0.75, so the expected event seconds are 0.5 and 1.5 by multiplication. Moving the cut before 0.5 removes both.
 */
export function test_engine_composition_played_cue(): void {
  const source: IAutoMovieIntent = {
    subject: "actor",
    capability: "sit",
    anchor: "seat",
  };
  const response: IAutoMovieIntent = {
    subject: "partner",
    capability: "respond",
  };
  const resolve = (
    anchor: string,
    index: number,
    until?: IAutoMovieIntent["until"],
  ): IAutoMovieSchedule =>
    AutoMovieEngineSchedule.resolve(
      AutoMovieEngineComposition.sequence(
        { ...source, ...(until === undefined ? {} : { until }) },
        AutoMovieEngineComposition.at(anchor, response, 0, {
          event: "contact",
          index,
        }),
      ),
      {
        timing: (intent: IAutoMovieIntent): IAutoMovieIntentTiming =>
          intent.capability === "sit"
            ? {
                duration: 2,
                events: [
                  { name: "contact", share: 0.25 },
                  { name: "contact", share: 0.75 },
                ],
              }
            : { duration: 1 },
        cues: { "intended-seat": [{ name: "contact", seconds: 0.5 }] },
      },
    );

  const full: IAutoMovieSchedule = resolve("seat", 1);
  TestValidator.equals("second played contact", full.entries[1]!.start, 1.5);
  const exact: IAutoMovieSchedule = resolve("seat", 0, {
    type: "event",
    event: "contact",
  });
  TestValidator.equals(
    "contact at the exact cut",
    exact.entries[1]!.start,
    0.5,
  );
  TestValidator.equals(
    "stored timing stays planned",
    exact.entries[0]!.events,
    [
      { name: "contact", seconds: 0.5 },
      { name: "contact", seconds: 1.5 },
    ],
  );

  let absent: boolean = false;
  try {
    resolve("seat", 0, { type: "share", share: 0.125 });
  } catch (error: unknown) {
    absent =
      error instanceof AutoMovieEngineScheduleError &&
      error.code === "event" &&
      error.of === "seat" &&
      !error.alternatives.includes("contact");
  }
  TestValidator.predicate("cut abandons the planned contact", absent);

  TestValidator.error("abandoned later occurrence has no index", () =>
    resolve("seat", 1, { type: "event", event: "contact" }),
  );
  const authored: IAutoMovieSchedule = resolve("intended-seat", 0, {
    type: "share",
    share: 0.125,
  });
  TestValidator.equals(
    "authored cue track is still usable",
    authored.entries[1]!.start,
    0.5,
  );
}
