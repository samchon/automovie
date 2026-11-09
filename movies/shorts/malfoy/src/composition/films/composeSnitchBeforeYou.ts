import { AutoMovieComposition } from "@automovie/engine";

import type { PitchStage } from "../scenes/snitch-before-you/PitchStage";
import { across } from "../scenes/snitch-before-you/across/across";
import { halfABroom } from "../scenes/snitch-before-you/half-a-broom/halfABroom";
import { home } from "../scenes/snitch-before-you/home/home";
import { oneHand } from "../scenes/snitch-before-you/one-hand/oneHand";
import { theArmGoesUp } from "../scenes/snitch-before-you/the-arm-goes-up/theArmGoesUp";
import { practiceTeams } from "../scenes/snitch-before-you/the-game/practiceTeams";
import { theGame } from "../scenes/snitch-before-you/the-game/theGame";
import { theSnitch } from "../scenes/snitch-before-you/the-game/theSnitch";
import { theGoalGap } from "../scenes/snitch-before-you/the-goal-gap/theGoalGap";

/**
 * The `snitch-before-you` film's composition: its seven scenes in screenplay
 * order on one stage, starting at 0, 8, 15, 24, 32, 35 and 43 s, beside the
 * twelve supporting players' track and the Snitch's track that run through
 * every scene.
 *
 * ```ts
 * composeSnitchBeforeYou(new PitchStage());
 * ```
 *
 * @param stage The pitch stage.
 * @returns The composition.
 * @evidence docs/body/screenplay/snitch-before-you.md Every scene in screenplay order, one continuous practice match.
 * @evidence contracts/development/composition.md#screenplay-realization Plays every scene in order and keeps the supporting players present throughout.
 * @evidence contracts/development/composition.md#composition-only Only orders scenes and the crowd track.
 */
export function composeSnitchBeforeYou(stage: PitchStage): AutoMovieComposition {
  return AutoMovieComposition.parallel(
    AutoMovieComposition.sequence(
      theGame(stage),
      halfABroom(stage),
      theGoalGap(stage),
      oneHand(stage),
      theArmGoesUp(stage),
      across(stage),
      home(stage),
    ),
    practiceTeams(stage),
    theSnitch(stage),
  );
}
