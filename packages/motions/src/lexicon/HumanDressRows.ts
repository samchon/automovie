import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { dress } from "../dressing/internal/dress";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";

/**
 * Putting on a worn item as rows: each item of `dress` under a name of its own,
 * the prop, the hand and the manner open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanDressRows {
  /**
   * `dress` putting on a `hat`. The hand reaches the head in the free-space
   * time of its travel, strokes the hat on, holds it a moment and returns
   * (`dress`; no timing study, provisional); a hat on or off, a greeting.
   */
  export const dressHat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperDress"]["dressHat"]
  > = AutoMovieMotionHumanActionRow.of("dressHat", dress, { item: "hat" });

  /**
   * `dress` putting on a `glasses`. The same phases as the hat without the turn
   * (`dress`, provisional); putting glasses on.
   */
  export const dressGlasses: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperDress"]["dressGlasses"]
  > = AutoMovieMotionHumanActionRow.of("dressGlasses", dress, {
    item: "glasses",
  });
}
