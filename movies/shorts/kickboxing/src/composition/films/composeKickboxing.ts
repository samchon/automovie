import { AutoMovieComposition } from "@automovie/engine";

import type { RingStage } from "../scenes/kickboxing/RingStage";
import { aFinishesWithTheLeg } from "../scenes/kickboxing/a-finishes-with-the-leg/aFinishesWithTheLeg";
import { aSetsTheTrap } from "../scenes/kickboxing/a-sets-the-trap/aSetsTheTrap";
import { aWeathersIt } from "../scenes/kickboxing/a-weathers-it/aWeathersIt";
import { bLongestCombination } from "../scenes/kickboxing/b-longest-combination/bLongestCombination";
import { bPlaysTheLongGame } from "../scenes/kickboxing/b-plays-the-long-game/bPlaysTheLongGame";
import { downAndTheCount } from "../scenes/kickboxing/down-and-the-count/downAndTheCount";
import { feintsFindTheOpenings } from "../scenes/kickboxing/feints-find-the-openings/feintsFindTheOpenings";
import { knockoutAndCelebration } from "../scenes/kickboxing/knockout-and-celebration/knockoutAndCelebration";
import { pressureChangesHands } from "../scenes/kickboxing/pressure-changes-hands/pressureChangesHands";
import { readingEachOther } from "../scenes/kickboxing/reading-each-other/readingEachOther";
import { theBodyKickLands } from "../scenes/kickboxing/the-body-kick-lands/theBodyKickLands";
import { theBrazilianKick } from "../scenes/kickboxing/the-brazilian-kick/theBrazilianKick";

/**
 * The kickboxing film's composition: its twelve scenes in screenplay order on
 * one cast, ten fifteen-second fighting phases to the finish, the count and
 * celebration aligned to their anchors, and the camera's widening into the
 * finish view at 143 s from the round's opening anchor.
 *
 * ```ts
 * composeKickboxing(stage.cast, 180);
 * ```
 *
 * @param cast The ring stage's cast.
 * @param duration The film's running time, seconds.
 * @returns The composition.
 * @evidence docs/body/screenplay/kickboxing.md Every scene in screenplay order, one continuous take.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b03 The camera begins widening at 143 s and holds to the end.
 */
export function composeKickboxing(
  cast: RingStage["cast"],
  duration: number,
): AutoMovieComposition {
  return AutoMovieComposition.parallel(
    AutoMovieComposition.sequence(
      readingEachOther(cast),
      aFinishesWithTheLeg(cast),
      bPlaysTheLongGame(cast),
      pressureChangesHands(cast),
      theBodyKickLands(cast),
      feintsFindTheOpenings(cast),
      bLongestCombination(cast),
      aWeathersIt(cast),
      aSetsTheTrap(cast),
      theBrazilianKick(cast),
      downAndTheCount(cast),
      knockoutAndCelebration(cast),
    ),
    AutoMovieComposition.at(
      "bell-open",
      cast.camera.holdFinish(duration - FINISH_VIEW),
      FINISH_VIEW,
    ),
  );
}

/** The screenplay's anchor for the camera's widening into the finish view, seconds. */
const FINISH_VIEW: number = 143;
