
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanTiming } from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { walkFoot } from "../../actions/internal/walkFoot";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";

/*
 * The measured bounds and the model's own constants of a stagger's recovery
 * (`stagger`): the reaction, the weight shift and the steps' times and lengths
 * at the threshold of balance recovery, the most steps, the limit's resolution,
 * the swing's clearance and lift, the arms' reaction and the settling's
 * tolerances.
 */
export namespace staggerBounds {
  /*
   * The reaction before the first step's weight shift, at the threshold of
   * balance recovery (Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401: 82
   * ms, younger adults released from a forward lean).
   */
  export const REACTION: IAutoMovieMotionHumanTiming.Span = {
    seconds: 0.082,
    source: "Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401",
  };

  /*
   * The weight shift onto the stance foot before a recovery step lifts off
   * (Cyr, Moglo and Smeesters 2005: 138 ms).
   */
  export const TRANSFER: IAutoMovieMotionHumanTiming.Span = {
    seconds: 0.138,
    source: "Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401",
  };

  /*
   * A recovery step's swing time by its direction from the heading, seconds:
   * the single steps at the threshold of balance recovery forward, sideways
   * (the mean of the dominant and non-dominant sides, 184 and 167 ms) and
   * backward (Telonio, Cyr, Moglo and Smeesters 2005, ISB XXth Congress 430).
   */
  export const STEP_TIME: Readonly<Record<STEPTIMEEntryItem, number>> = {
    forward: 0.238,
    side: 0.1755,
    backward: 0.193,
  };

  /*
   * A forward recovery step's landing after the push, the time a capture step
   * takes to bear (`perturb` reads it as the step's time): the reaction, the
   * weight shift and the forward swing at the threshold of balance recovery
   * (`REACTION`, `TRANSFER`, `STEP_TIME.forward`), 458 ms.
   */
  export const LANDING: IAutoMovieMotionHumanTiming.Span = {
    seconds:
      AutoMovieMotionHumanTiming.seconds(REACTION) +
      AutoMovieMotionHumanTiming.seconds(TRANSFER) +
      STEP_TIME.forward,
    source:
      "Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401; Telonio, Cyr, Moglo and Smeesters 2005, ISB XXth Congress 430",
  };

  /*
   * A sideways push's first step with the leg it unloads, against a forward or
   * backward step's: the time to foot-off from the push 20% shorter and the
   * swing 70% longer, on average (Maki, McIlroy and Perry 1996, J Biomech
   * 29:343, read as its abstract,
   * https://manuscript.isc.ac/Inventory/10/450275.htm; 96% of the stepping
   * responses to lateral destabilisation swung the unloaded leg, which lifts
   * much sooner but swings a longer and more complex path). The ratios, not the
   * abstract's absolute 90 ms and 110 ms, are applied to this model's own
   * forward and backward times (the reaction and the weight shift, `REACTION`
   * and `TRANSFER`, and the mean of the forward and backward swing,
   * `STEP_TIME`): those times come from another cohort and paradigm (Cyr's and
   * Telonio's lean-and-release) than Maki's platform, and the ratio carries the
   * lateral push's effect between them where a fixed difference would not.
   * Their step-length effect, 20% longer, is not applied: the measured longest
   * steps (`STEP_LENGTH`) bound a step already, and an average step's
   * lengthening says nothing of the longest.
   */
  export const LATERAL: Readonly<Record<LATERALEntryItem, number>> = {
    footOff: 0.8,
    swing: 1.7,
  };
  /*
   * The longest recovery step by its direction from the heading, in statures:
   * the same steps' lengths, 1.032, 0.664 (0.694 and 0.634) and 0.724 m, over
   * the subjects' mean stature of 1.74 m (Telonio, Cyr, Moglo and Smeesters
   * 2005).
   */
  export const STEP_LENGTH: Readonly<Record<STEPLENGTHEntryItem, number>> = {
    forward: 1.032 / 1.74,
    side: 0.664 / 1.74,
    backward: 0.724 / 1.74,
  };

  /*
   * The trunk's righting after the last step at a neutral manner (provisional).
   */
  export const RIGHTING: IAutoMovieMotionHumanTiming.Span = {
    pause: "beat",
    scale: 1.125,
  };

  /*
   * The trunk's tilt, degrees, at which the shift it makes of the centre of
   * mass is read per sine (`bending`): a tilt inside the range a recovery
   * uses.
   */
  export const REFERENCE: number = 10;

  /*
   * The pendulum's length in hip heights: Hof's leg length (Hof, Gazendam and
   * Sinke 2005).
   */
  export const PENDULUM: number = AutoMovieEngineKinematics.AUTO_MOVIE_CENTER_OF_MASS_PENDULUM;

  /*
   * The most recovery steps taken (Debelle, Maganaris and O'Brien 2021, young
   * adults after a backward slip).
   */
  export const STEPS: number = 4;

  /*
   * The resolution the fastest caught push is bisected to, m/s, before it is
   * floored to a whole centimetre per second.
   */
  export const RESOLUTION: number = 0.005;

  /*
   * The band below the fastest caught push over which every speed of the
   * `RESOLUTION` grid is verified caught, m/s: a local solve at the edge of
   * what the legs hold can flicker, and the limit a refusal names is one every
   * slower push on this grid is caught at.
   */
  export const VERIFIED: number = 0.02;

  /*
   * The least toe clearance of walking, metres (`walkFoot.CLEARANCE`): a
   * swinging foot rises this far before it travels.
   */
  export const CLEARANCE: number = walkFoot.CLEARANCE;

  /*
   * A swing's lift at mid-swing, hip heights: a walking foot's
   * (`walk.walking`).
   */
  export const LIFT: number = walk.walking(0).lift;

  /*
   * Each arm's abduction as a balance reaction, degrees (Weerdesteyn, Laing and
   * Robinovitch 2008).
   */
  export const ABDUCTION: number = 9.4;

  /*
   * The arms' reaction onset after the push.
   */
  export const ONSET: IAutoMovieMotionHumanTiming.Span = {
    seconds: 0.154,
    source: "Weerdesteyn, Laing and Robinovitch 2008, Exp Brain Res 186:571",
  };

  /*
   * How near the centre of mass comes to rest over the middle of its base,
   * metres.
   */
  export const SETTLED: number = 0.001;

  /*
   * The divergent component's feedback gain over the righting (provisional):
   * its error from its course decays at this many times the pendulum's own rate
   * (Englsberger, Ott and Albu-Schaffer 2015).
   */
  export const TRACKING: number = 1;

  /*
   * The share of the way back toward the stance foot a shortened landing is
   * bisected to (`staggerStep`), the model's resolution (provisional): 1/64,
   * about a centimetre of the longest measured step.
   */
  export const ADAPTED: number = 1 / 64;

  /*
   * The settling's integration step, seconds.
   */
  export const STEP: number = 0.001;

  /*
   * The pendulum's eigenfrequency `sqrt(g / l)` for a body
   * (`AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency`, standard gravity), `l` its
   * pendulum's length (`AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum`).
   * Parameter body: The body.
   * Returns: Radians per second.
   */
  export function omega(
    body: IAutoMovieMotionHumanActionContext["body"],
  ): number {
    return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
    );
  }
}

/*
 * The alternatives of `STEPLENGTHEntryItem`'s site.
 */
type STEPLENGTHEntryItem = "forward" | "side" | "backward";

/*
 * The alternatives of `LATERALEntryItem`'s site.
 */
type LATERALEntryItem = "footOff" | "swing";

/*
 * The alternatives of `STEPTIMEEntryItem`'s site.
 */
type STEPTIMEEntryItem = "forward" | "side" | "backward";
