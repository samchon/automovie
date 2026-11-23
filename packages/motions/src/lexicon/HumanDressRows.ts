import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { dress } from "../dressing/dress";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Putting on a worn item as rows: each item of `dress` under a name of its own,
 * the prop, the hand and the manner open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanDressRows {
  /**
   * `dress` putting on a `hat`. The hand reaches the head in the free-space
   * time of its travel, strokes the hat on, holds it a moment and returns
   * (`dress`; no timing study, provisional); a hat on or off, a greeting.
   */
  export const dressHat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperDress"]["dressHat"]
  > = HumanActionRow.of("dressHat", dress, { item: "hat" });

  /**
   * `dress` putting on a `glasses`. The same phases as the hat without the turn
   * (`dress`, provisional); putting glasses on.
   */
  export const dressGlasses: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperDress"]["dressGlasses"]
  > = HumanActionRow.of("dressGlasses", dress, {
    item: "glasses",
  });
}
