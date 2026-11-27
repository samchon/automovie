import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconPrecisionSportParams,
} from "@automovie/interface";

import { PRECISION_STROKE_FORMS } from "./PRECISION_STROKE_FORMS";
import { createPrecisionSportStroke } from "./createPrecisionSportStroke";

/*
 * Bound sporting strokes for baseball, cricket, tennis, golf, pool and
 * volleyball. A row uses the implement's named contact, or the bare palm for
 * volleyball, with the ball participating in the shared prop timeline. Studies
 * inform the distinction between full swings and short smooth strokes: Welch et
 * al. 1995 (PMID 8580946), Stuelcken et al. 2005 (PMID 15807374), Walsh et al.
 * 2024 (ISBS 42.265), Robbins et al. 2025 (doi:10.3390/bioengineering12010069)
 * and Haar et al. 2020 (doi:10.1038/s41598-020-76805-9). Neutral lengths,
 * angles and timing in this first pass are provisional. Stance and approach are
 * composed separately.
 */
export namespace HumanPrecisionSport {
  /*
   * A two-handed level bat swing through a pitch.
   */
  export const baseballHit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["baseballHit"]
  > = createPrecisionSportStroke(
    "baseballHit",
    PRECISION_STROKE_FORMS.baseballHit,
  );

  /*
   * A two-handed cricket drive through the post-bounce ball, from an authored
   * front-foot stance.
   */
  export const cricketDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["cricketDrive"]
  > = createPrecisionSportStroke(
    "cricketDrive",
    PRECISION_STROKE_FORMS.cricketDrive,
  );

  /*
   * A one-handed forehand meets the tennis ball on the racket face.
   */
  export const tennisForehandReturn: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["tennisForehandReturn"]
  > = createPrecisionSportStroke(
    "tennisForehandReturn",
    PRECISION_STROKE_FORMS.tennisForehandReturn,
  );

  /*
   * A one-handed table tennis forehand drive through the bat's face
   * (provisional angles).
   */
  export const tableTennisForehand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["tableTennisForehand"]
  > = createPrecisionSportStroke(
    "tableTennisForehand",
    PRECISION_STROKE_FORMS.tableTennisForehand,
  );

  /*
   * A one-handed squash drive along the side wall through the racket face
   * (provisional angles).
   */
  export const squashDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["squashDrive"]
  > = createPrecisionSportStroke(
    "squashDrive",
    PRECISION_STROKE_FORMS.squashDrive,
  );

  /*
   * A one-handed padel forehand through the solid racket's face (provisional
   * angles).
   */
  export const padelForehand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["padelForehand"]
  > = createPrecisionSportStroke(
    "padelForehand",
    PRECISION_STROKE_FORMS.padelForehand,
  );

  /*
   * A one-handed overhead badminton clear lifting the shuttle deep (provisional
   * angles).
   */
  export const badmintonClear: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["badmintonClear"]
  > = createPrecisionSportStroke(
    "badmintonClear",
    PRECISION_STROKE_FORMS.badmintonClear,
  );

  /*
   * A two-handed field hockey hit along the ground through the stick's blade
   * (provisional angles).
   */
  export const fieldHockeyHit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["fieldHockeyHit"]
  > = createPrecisionSportStroke(
    "fieldHockeyHit",
    PRECISION_STROKE_FORMS.fieldHockeyHit,
  );

  /*
   * A two-handed full drive through the club face.
   */
  export const golfDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfDrive"]
  > = createPrecisionSportStroke("golfDrive", PRECISION_STROKE_FORMS.golfDrive);

  /*
   * A compact two-handed chip with a steeper launch.
   */
  export const golfChip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfChip"]
  > = createPrecisionSportStroke("golfChip", PRECISION_STROKE_FORMS.golfChip);

  /*
   * A short putting stroke along the chosen green line.
   */
  export const golfPutt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfPutt"]
  > = createPrecisionSportStroke("golfPutt", PRECISION_STROKE_FORMS.golfPutt);

  /*
   * A one-handed overhead serve struck from the palm, the arm high and the ball
   * sent rising over the net.
   */
  export const volleyballServe: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballServe"]
  > = createPrecisionSportStroke(
    "volleyballServe",
    PRECISION_STROKE_FORMS.volleyballServe,
  );

  /*
   * An overhead set pushed steeply up from the palm.
   */
  export const volleyballSet: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballSet"]
  > = createPrecisionSportStroke(
    "volleyballSet",
    PRECISION_STROKE_FORMS.volleyballSet,
  );

  /*
   * An overhead attack driven down from the palm.
   */
  export const volleyballSpike: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballSpike"]
  > = createPrecisionSportStroke(
    "volleyballSpike",
    PRECISION_STROKE_FORMS.volleyballSpike,
  );

  /*
   * A low dig that lifts the ball from the hand below the waist.
   */
  export const volleyballDig: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["volleyballDig"]
  > = createPrecisionSportStroke(
    "volleyballDig",
    PRECISION_STROKE_FORMS.volleyballDig,
  );

  /*
   * A one-handed cue stroke with the other hand set on the table.
   */
  export const cueStroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["cueStroke"]
  > = createPrecisionSportStroke("cueStroke", PRECISION_STROKE_FORMS.cueStroke);
}
