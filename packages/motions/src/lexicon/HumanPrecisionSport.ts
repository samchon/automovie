import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconPrecisionSportParams,
} from "@automovie/interface";

import { createPrecisionSportStroke } from "./createPrecisionSportStroke";

/**
 * Bound sporting strokes for baseball, cricket, tennis, golf, pool and volleyball. A row uses the implement's
 * named contact, or the bare palm for volleyball, with the ball participating in the shared prop timeline. Studies inform the
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

  /** A one-handed table tennis forehand drive through the bat's face (provisional angles). */
  export const tableTennisForehand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["tableTennisForehand"]
  > = createPrecisionSportStroke("tableTennisForehand", {
    point: "face",
    down: -10,
    sweep: 60,
    draw: 0,
    turn: 20,
    loft: 10,
    impact: 0.3,
    oneHand: true,
  });

  /** A one-handed squash drive along the side wall through the racket face (provisional angles). */
  export const squashDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["squashDrive"]
  > = createPrecisionSportStroke("squashDrive", {
    point: "face",
    down: 10,
    sweep: 70,
    draw: 0,
    turn: 20,
    loft: 8,
    impact: 0.45,
    oneHand: true,
  });

  /** A one-handed padel forehand through the solid racket's face (provisional angles). */
  export const padelForehand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["padelForehand"]
  > = createPrecisionSportStroke("padelForehand", {
    point: "face",
    down: -15,
    sweep: 55,
    draw: 0,
    turn: 15,
    loft: 12,
    impact: 0.5,
    oneHand: true,
  });

  /** A one-handed overhead badminton clear lifting the shuttle deep (provisional angles). */
  export const badmintonClear: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["badmintonClear"]
  > = createPrecisionSportStroke("badmintonClear", {
    point: "face",
    down: -70,
    sweep: 80,
    draw: 0,
    turn: 20,
    loft: 40,
    impact: 0.45,
    oneHand: true,
  });

  /** A two-handed field hockey hit along the ground through the stick's blade (provisional angles). */
  export const fieldHockeyHit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["fieldHockeyHit"]
  > = createPrecisionSportStroke("fieldHockeyHit", {
    point: "blade",
    down: 70,
    sweep: 60,
    draw: 0,
    turn: 15,
    loft: 0,
    impact: 0.45,
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

  /** A one-handed overhead serve struck from the palm, the arm high and the ball sent rising over the net. */
  export const volleyballServe: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballServe"]
  > = createPrecisionSportStroke("volleyballServe", {
    point: "palm",
    down: -70,
    sweep: 70,
    draw: 0,
    turn: 15,
    loft: 20,
    impact: 0.5,
    oneHand: true,
    bare: true,
  });

  /** An overhead set pushed steeply up from the palm. */
  export const volleyballSet: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballSet"]
  > = createPrecisionSportStroke("volleyballSet", {
    point: "palm",
    down: -80,
    sweep: 25,
    draw: 0,
    turn: 0,
    loft: 65,
    impact: 0.4,
    oneHand: true,
    bare: true,
  });

  /** An overhead attack driven down from the palm. */
  export const volleyballSpike: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballSpike"]
  > = createPrecisionSportStroke("volleyballSpike", {
    point: "palm",
    down: -55,
    sweep: 90,
    draw: 0,
    turn: 20,
    loft: -12,
    impact: 0.5,
    oneHand: true,
    bare: true,
  });

  /** A low dig that lifts the ball from the hand below the waist. */
  export const volleyballDig: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballDig"]
  > = createPrecisionSportStroke("volleyballDig", {
    point: "palm",
    down: 35,
    sweep: 25,
    draw: 0,
    turn: 0,
    loft: 60,
    impact: 0.4,
    oneHand: true,
    bare: true,
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
