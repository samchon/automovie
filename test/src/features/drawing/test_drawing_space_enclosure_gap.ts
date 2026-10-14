import type { IAutoMovieDrawingGap } from "@automovie/interface";
import { deriveAutoMovieDrawingSchedule } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { drawingEnvironment } from "../internal/drawingFixtures";
import { namedFacts } from "../internal/predicates";

/**
 * A room schedule says out loud that it states nothing about what encloses a
 * room.
 *
 * A room row carries contents and graph relations without deriving its enclosure.
 * This test checks that the schedule declares that unavailable interpretation
 * explicitly, and confines the declaration to the space subject.
 *
 * Scenarios:
 *
 * 1. A room schedule declares the enclosure gap, as `unsupported` rather than
 *    `not-run`: this is an undelivered derivation rather than missing author input.
 * 2. An opening and a connector owe no enclosure gap. They are not enclosed by
 *    boundaries, they *are* the separation or the passage, and widening the gap
 *    to every subject would file a gap nothing could ever close.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls deriveAutoMovieDrawingSchedule for space/opening/connector subjects and checks space-enclosure presence/status versus absence for the other two subjects. This catches a missing gap, incorrect not-run status or applying the space policy to every schedule.
 * @evidence contracts/testing.md#independent-expectations The expected unsupported status and subject-specific presence are explicit reporting policy, not calculated from schedule output. The authored atelier fixture supplies admitted subject populations; no inferred ceiling kind or rendered enclosure supplies the answer.
 * @evidence contracts/testing.md#distinguishing-cases Space must expose the gap while opening and connector must not. This test observes the selected gap only and does not check its reason/remedy text, uniqueness, other gap entries or actual boundary derivation.
 * @evidence contracts/testing.md#execution-ownership Uses the existing local drawing fixture and synchronous schedule derivation with no artifact publication, renderer, process, clock, global replacement or additional test host. Its observations do not reproduce historical production failures or certify enclosure completeness.
 */
export function test_drawing_space_enclosure_gap(): void {
  const gapOf: (subject: "space" | "opening" | "connector") => IAutoMovieDrawingGap | null = (subject: "space" | "opening" | "connector") : IAutoMovieDrawingGap | null =>
    deriveAutoMovieDrawingSchedule({
      environment: drawingEnvironment(),
      subject,
    }).gaps.find((gap: IAutoMovieDrawingGap) : boolean => gap.subject === "space-enclosure") ?? null;

  const enclosure: IAutoMovieDrawingGap | null = gapOf("space");

  TestValidator.equals(
    "a room schedule declares what it says about the boundaries around a room",
    namedFacts([
      ["a room owes the gap", () : boolean => enclosure !== null],
      // This declaration distinguishes missing product derivation from author input.
      ["as unsupported", () : boolean => enclosure?.status === "unsupported"],
      ["an opening owes none", () : boolean => gapOf("opening") === null],
      ["a connector owes none", () : boolean => gapOf("connector") === null],
    ]),
    {
      "a room owes the gap": true,
      "as unsupported": true,
      "an opening owes none": true,
      "a connector owes none": true,
    },
  );
}
