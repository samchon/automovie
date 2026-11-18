import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Sport rows with a fixed support, hold, direction or distinct swimming stroke accept a standing entry.
 *
 * Scenarios:
 * 1. The three builds stage each fixed yoga hold and the two-step defensive slide.
 * 2. Each stages the additional breaststroke, backstroke and floating postures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixture, builds and independently staged variants.
 * @evidence contracts/development/testing.md#behavioral-verification Registers each row and checks its realized segment name and positive duration after a stand.
 * @evidence contracts/development/testing.md#independent-expectations The authored row is expected to accept a standing entry at its specified support and hold.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps the fixed support and hold combinations, including the child's pose and toe touch, on each build. The direct law sweep stages the exercise, stretch, dance, tread and crawl kinds.
 * @evidence contracts/development/testing.md#execution-ownership Each retained performance has its own scene and is released after inspection.
 */
export function test_human_motion_lexicon_rows_sport_remaining(): void {
  TestValidator.equals(
    "fixed sport entries and additional swimming strokes plan on the staged builds",
    LexiconRowNet.rows("sport", [
      "defensiveSlide",
      "chairPose",
      "childsPose",
      "hipFlexorStretch",
      "corpsePose",
      "toeTouch",
      "breaststroke",
      "backstroke",
      "floating",
    ]),
    [],
  );
}
