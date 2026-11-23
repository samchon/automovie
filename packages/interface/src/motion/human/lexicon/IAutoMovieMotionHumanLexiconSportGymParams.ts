import type { IAutoMovieMotionHumanCrawl } from "../floor/IAutoMovieMotionHumanCrawl";
import type { IAutoMovieMotionHumanWorkout } from "../next/IAutoMovieMotionHumanWorkout";

/**
 * Open parameters of the sportGym lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconSportGymParams {
  /** A bear crawl: on the hands and the feet, the knees held off the floor. */
  bearCrawl: Omit<IAutoMovieMotionHumanCrawl.IParams, "kind">;

  /**
   * Inchworms: folded, the hands walked out to a plank, the feet walked in to
   * the hands, and up.
   */
  inchworm: Omit<IAutoMovieMotionHumanCrawl.IParams, "kind">;

  /** Bent-over rows, without the bar. */
  bentOverRow: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Curls, without the weight. */
  curl: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Overhead triceps extensions, without the weight. */
  tricepsExtension: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Lateral raises, without the weights. */
  lateralRaise: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Front raises, without the weights. */
  frontRaise: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Shrugs, without the weights. */
  shrug: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Calf raises. */
  calfRaise: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Front squats, without the bar. */
  frontSquat: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Goblet squats, without the bell. */
  gobletSquat: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Split squats. */
  splitSquat: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A wall sit, the wall not shown. */
  wallSit: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Romanian deadlifts, without the bar. */
  romanianDeadlift: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Good mornings, without the bar. */
  goodMorning: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A power clean as its positions, without the bar. */
  powerClean: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** A snatch as its positions, without the bar. */
  snatch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Pike push-ups. */
  pikePushUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Supermans. */
  superman: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Bird dogs. */
  birdDog: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Lying leg raises. */
  lyingLegRaise: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Bicycle crunches. */
  bicycleCrunch: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Russian twists. */
  russianTwist: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Dead bugs. */
  deadBug: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /**
   * Step-ups onto the box the composition names (`on`); an imagined one when
   * none is named.
   */
  stepUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /**
   * Hip thrusts, the upper back on the bench's edge the composition names
   * (`on`), the performer standing with the back to it.
   */
  hipThrust: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Incline push-ups, the hands on the bench the composition names (`on`). */
  inclinePushUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Decline push-ups, the toes on the bench the composition names (`on`). */
  declinePushUp: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;

  /** Dips, the bars not shown. */
  dip: Omit<IAutoMovieMotionHumanWorkout.IParams, "kind">;
}
