import { AutoMovieComposition } from "@automovie/engine";

import type { CourtStage } from "../scenes/look-at-me-duel/CourtStage";
import { outFromUnder } from "../scenes/look-at-me-duel/out-from-under/outFromUnder";
import { theFirstGrip } from "../scenes/look-at-me-duel/the-first-grip/theFirstGrip";
import { thisTime } from "../scenes/look-at-me-duel/this-time/thisTime";
import { wandUp } from "../scenes/look-at-me-duel/wand-up/wandUp";

/**
 * The `look-at-me-duel` film's composition: its four scenes in screenplay
 * order on one cast, each starting at its anchor (0, 15, 27 and 36 s) and
 * the last holding to 60 s, one continuous action with no title, subtitle,
 * music or grade beyond the court's daylight.
 *
 * ```ts
 * composeLookAtMeDuel(stage.cast);
 * ```
 *
 * @param cast The court stage's cast.
 * @returns The composition.
 * @evidence docs/body/screenplay/look-at-me-duel.md Every scene in screenplay order, 60 seconds of one continuous action.
 * @evidence contracts/development/composition.md#screenplay-realization Plays every scene in order and fills the running time; the film is silent and carries no titles.
 * @evidence contracts/development/composition.md#composition-only Only orders the scenes.
 * @evidence contracts/development/composition.md#living-scene The scenes own every presence.
 * @evidence contracts/development/common.md#meaningful-documentation States the order and the anchors.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's sequence places each scene after the previous one ends at its anchor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One sequence.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four scenes, built once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is computed twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns immutable intents; nothing retained.
 */
export function composeLookAtMeDuel(cast: CourtStage.ICast): AutoMovieComposition {
  return AutoMovieComposition.sequence(wandUp(cast), theFirstGrip(cast), outFromUnder(cast), thisTime(cast));
}
