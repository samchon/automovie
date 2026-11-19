import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconPrecisionSportParams,
} from "@automovie/interface";

import { createPrecisionSportStroke } from "./createPrecisionSportStroke";

/**
 * Bound sporting strokes for baseball, cricket, tennis, golf and pool. A row uses the implement's
 * named contact with the ball participating in the shared prop timeline. Studies inform the
 * distinction between full swings and short smooth strokes: Welch et al. 1995 (PMID 8580946),
 * Stuelcken et al. 2005 (PMID 15807374), Walsh et al. 2024 (ISBS 42.265), Robbins et al. 2025
 * (doi:10.3390/bioengineering12010069) and Haar et al. 2020 (doi:10.1038/s41598-020-76805-9).
 * Neutral lengths, angles and timing in this first pass are provisional. Stance and approach are composed separately.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the source of motion choices, the bound interaction, and provisional controls.
 * @evidence contracts/development/design.md#principled-representation Each row supplies a form to the held stroke planner, with dedicated arc and line paths and one witnessed launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rows share the same timed contact and give cue its separate bridge target.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses existing grip, limb and prop flight machinery with the input ball's actual size and world frame.
 */
export namespace HumanPrecisionSport {
  /** A two-handed level bat swing through a pitch. */
  export const baseballHit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["baseballHit"]
  > = createPrecisionSportStroke("baseballHit", {
    point: "strike",
    down: 4,
    sweep: 75,
    draw: 0,
    turn: 18,
    loft: 8,
    impact: 0.55,
  });

  /** A two-handed cricket drive through the post-bounce ball, from an authored front-foot stance. */
  export const cricketDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["cricketDrive"]
  > = createPrecisionSportStroke("cricketDrive", {
    point: "blade",
    down: 76,
    sweep: 55,
    draw: 0,
    turn: 9,
    loft: 0,
    impact: 0.55,
  });

  /** A one-handed forehand meets the tennis ball on the racket face. */
  export const tennisForehandReturn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["tennisForehandReturn"]
  > = createPrecisionSportStroke("tennisForehandReturn", {
    point: "face",
    down: -21,
    sweep: 53,
    draw: 0,
    turn: 14,
    loft: 18,
    impact: 0.55,
    oneHand: true,
  });

  /** A two-handed full drive through the club face. */
  export const golfDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfDrive"]
  > = createPrecisionSportStroke("golfDrive", {
    point: "face",
    down: 72,
    sweep: 102,
    draw: 0,
    turn: 25,
    loft: 13,
    impact: 0.85,
  });

  /** A compact two-handed chip with a steeper launch. */
  export const golfChip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfChip"]
  > = createPrecisionSportStroke("golfChip", {
    point: "face",
    down: 78,
    sweep: 31,
    draw: 0,
    turn: 6,
    loft: 28,
    impact: 0.52,
  });

  /** A short putting stroke along the chosen green line. */
  export const golfPutt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfPutt"]
  > = createPrecisionSportStroke("golfPutt", {
    point: "face",
    down: 79,
    sweep: 0,
    draw: 0.35,
    turn: 2,
    loft: 0,
    impact: 0.48,
  });

  /** A one-handed cue stroke with the other hand set on the table. */
  export const cueStroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["cueStroke"]
  > = createPrecisionSportStroke("cueStroke", {
    point: "tip",
    down: 0,
    sweep: 0,
    draw: 0.4,
    turn: 0,
    loft: 0,
    impact: 0.48,
  });
}
