import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { workout } from "../exercise/workout";
import { crawl } from "../floor/crawl";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";

/**
 * The gym's remaining movements under the names a programme uses, each a row of
 * the workout law with its kind fixed (`WorkoutGym`, `WorkoutBodyweight`,
 * `WorkoutEquipment`). A row leaves open the count (`reps`), a held pose's
 * `hold`, whether the body stays on its support (`stay`), the support (`on`),
 * the load (`load`), a bar's place and the manner. The bear crawl and the
 * inchworm are rows of the crawl law, which leaves open the count of cycles.
 *
 * What a row shows and what its first pass leaves out is stated on its kind or
 * its law: without `load` nothing is held, and without `on` no equipment
 * bears.
 */
export namespace HumanSportGym {
  /**
   * A bear crawl: on the hands and the feet, the knees held off the floor.
   * Default 3 cycles of 1.2 s at a 0.93 m hip (`crawl.CYCLE`, provisional), 3.6
   * s of crawling.
   */
  export const bearCrawl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["bearCrawl"]
  > = AutoMovieMotionHumanActionRow.of("bearCrawl", crawl, {
    kind: "bear",
  });

  /**
   * Inchworms: folded, the hands walked out to a plank, the feet walked in to
   * the hands, and up. Default 3 cycles of 1.2 s at a 0.93 m hip
   * (`crawl.CYCLE`, provisional), 3.6 s of crawling.
   */
  export const inchworm: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["inchworm"]
  > = AutoMovieMotionHumanActionRow.of("inchworm", crawl, {
    kind: "inchworm",
  });

  /**
   * Bent-over rows, without the bar. Default 5 repetitions of 2.1 s after a 0.8
   * s entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const bentOverRow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["bentOverRow"]
  > = AutoMovieMotionHumanActionRow.of("bentOverRow", workout, {
    kind: "bentOverRow",
  });

  /**
   * Curls, without the weight. Default 5 repetitions of 2.1 s after a 0.8 s
   * entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const curl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["curl"]
  > = AutoMovieMotionHumanActionRow.of("curl", workout, {
    kind: "curl",
  });

  /**
   * Overhead triceps extensions, without the weight. Default 5 repetitions of
   * 2.1 s after a 0.8 s entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const tricepsExtension: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["tricepsExtension"]
  > = AutoMovieMotionHumanActionRow.of("tricepsExtension", workout, {
    kind: "tricepsExtension",
  });

  /**
   * Lateral raises, without the weights. Default 5 repetitions of 2.1 s after a
   * 0.8 s entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const lateralRaise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["lateralRaise"]
  > = AutoMovieMotionHumanActionRow.of("lateralRaise", workout, {
    kind: "lateralRaise",
  });

  /**
   * Front raises, without the weights. Default 5 repetitions of 2.1 s after a
   * 0.8 s entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const frontRaise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["frontRaise"]
  > = AutoMovieMotionHumanActionRow.of("frontRaise", workout, {
    kind: "frontRaise",
  });

  /**
   * Shrugs, without the weights. Default 8 repetitions of 1.4 s after a 0.8 s
   * entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const shrug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["shrug"]
  > = AutoMovieMotionHumanActionRow.of("shrug", workout, {
    kind: "shrug",
  });

  /**
   * Calf raises. Default 8 repetitions of 1.7 s after a 0 s entry; provisional
   * ({@link WorkoutGym.KINDS}).
   */
  export const calfRaise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["calfRaise"]
  > = AutoMovieMotionHumanActionRow.of("calfRaise", workout, {
    kind: "calfRaise",
  });

  /**
   * Front squats, without the bar. Default 5 repetitions of 3 s after a 0.8 s
   * entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const frontSquat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["frontSquat"]
  > = AutoMovieMotionHumanActionRow.of("frontSquat", workout, {
    kind: "frontSquat",
  });

  /**
   * Goblet squats, without the bell. Default 5 repetitions of 3 s after a 0.8 s
   * entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const gobletSquat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["gobletSquat"]
  > = AutoMovieMotionHumanActionRow.of("gobletSquat", workout, {
    kind: "gobletSquat",
  });

  /**
   * Split squats. Default 5 repetitions of 2.5 s after a 1.2 s entry;
   * provisional ({@link WorkoutGym.KINDS}).
   */
  export const splitSquat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["splitSquat"]
  > = AutoMovieMotionHumanActionRow.of("splitSquat", workout, {
    kind: "splitSquat",
  });

  /**
   * A wall sit that bears on a finite wall named by `on`. Held 30 s after a 1.5
   * s entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const wallSit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["wallSit"]
  > = AutoMovieMotionHumanActionRow.of("wallSit", workout, {
    kind: "wallSit",
  });

  /**
   * Romanian deadlifts, without the bar. Default 5 repetitions of 3 s after a
   * 0.8 s entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const romanianDeadlift: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["romanianDeadlift"]
  > = AutoMovieMotionHumanActionRow.of("romanianDeadlift", workout, {
    kind: "romanianDeadlift",
  });

  /**
   * Good mornings, without the bar. Default 5 repetitions of 3 s after a 0.8 s
   * entry; provisional ({@link WorkoutGym.KINDS}).
   */
  export const goodMorning: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["goodMorning"]
  > = AutoMovieMotionHumanActionRow.of("goodMorning", workout, {
    kind: "goodMorning",
  });

  /**
   * A power clean as its positions, without the bar. One lift of 3.55 s after a
   * 1 s entry: set 1.3 s, pull 0.45 s, catch 0.5 s, rack 1.3 s; provisional
   * ({@link WorkoutGym.KINDS}).
   */
  export const powerClean: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["powerClean"]
  > = AutoMovieMotionHumanActionRow.of("powerClean", workout, {
    kind: "powerClean",
  });

  /**
   * A snatch as its positions, without the bar. One lift of 3.9 s after a 1 s
   * entry: set 1.3 s, pull 0.45 s, catch 0.65 s, overhead 1.5 s; provisional
   * ({@link WorkoutGym.KINDS}).
   */
  export const snatch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["snatch"]
  > = AutoMovieMotionHumanActionRow.of("snatch", workout, {
    kind: "snatch",
  });

  /**
   * Pike push-ups. Default 5 repetitions of 2.2 s after a 2 s entry;
   * provisional ({@link WorkoutBodyweight.KINDS}).
   */
  export const pikePushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["pikePushUp"]
  > = AutoMovieMotionHumanActionRow.of("pikePushUp", workout, {
    kind: "pikePushUp",
  });

  /**
   * Supermans. Default 5 repetitions of 3 s after a 2.4 s entry; provisional
   * ({@link WorkoutBodyweight.KINDS}).
   */
  export const superman: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["superman"]
  > = AutoMovieMotionHumanActionRow.of("superman", workout, {
    kind: "superman",
  });

  /**
   * Bird dogs. Default 6 repetitions of 3 s after a 2.4 s entry; provisional
   * ({@link WorkoutBodyweight.KINDS}).
   */
  export const birdDog: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["birdDog"]
  > = AutoMovieMotionHumanActionRow.of("birdDog", workout, {
    kind: "birdDog",
  });

  /**
   * Lying leg raises. Default 6 repetitions of 2.7 s after a 2.4 s entry;
   * provisional ({@link WorkoutBodyweight.KINDS}).
   */
  export const lyingLegRaise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["lyingLegRaise"]
  > = AutoMovieMotionHumanActionRow.of("lyingLegRaise", workout, {
    kind: "lyingLegRaise",
  });

  /**
   * Bicycle crunches. Default 8 repetitions of 1 s after a 2.4 s entry;
   * provisional ({@link WorkoutBodyweight.KINDS}).
   */
  export const bicycleCrunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["bicycleCrunch"]
  > = AutoMovieMotionHumanActionRow.of("bicycleCrunch", workout, {
    kind: "bicycleCrunch",
  });

  /**
   * Russian twists. Default 8 repetitions of 1 s after a 2.4 s entry;
   * provisional ({@link WorkoutBodyweight.KINDS}).
   */
  export const russianTwist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["russianTwist"]
  > = AutoMovieMotionHumanActionRow.of("russianTwist", workout, {
    kind: "russianTwist",
  });

  /**
   * Dead bugs. Default 6 repetitions of 2.7 s after a 2.4 s entry; provisional
   * ({@link WorkoutBodyweight.KINDS}).
   */
  export const deadBug: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["deadBug"]
  > = AutoMovieMotionHumanActionRow.of("deadBug", workout, {
    kind: "deadBug",
  });

  /**
   * Step-ups onto the box the composition names (`on`); an imagined one when
   * none is named. Default 5 repetitions of 2.3 s after a 1 s entry;
   * provisional ({@link WorkoutEquipment.KINDS}).
   */
  export const stepUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["stepUp"]
  > = AutoMovieMotionHumanActionRow.of("stepUp", workout, {
    kind: "stepUp",
  });

  /**
   * Hip thrusts, the upper back on the bench's edge the composition names
   * (`on`), the performer standing with the back to it. Default 5 repetitions
   * of 2.5 s after a 2.4 s entry; provisional ({@link WorkoutEquipment.KINDS}).
   */
  export const hipThrust: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["hipThrust"]
  > = AutoMovieMotionHumanActionRow.of("hipThrust", workout, {
    kind: "hipThrust",
  });

  /**
   * Incline push-ups, the hands on the bench the composition names (`on`).
   * Default 5 repetitions of 2 s after a 1.5 s entry; provisional
   * ({@link WorkoutEquipment.KINDS}).
   */
  export const inclinePushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["inclinePushUp"]
  > = AutoMovieMotionHumanActionRow.of("inclinePushUp", workout, {
    kind: "inclinePushUp",
  });

  /**
   * Decline push-ups, the toes on the bench the composition names (`on`).
   * Default 5 repetitions of 2 s after a 1.5 s entry; provisional
   * ({@link WorkoutEquipment.KINDS}).
   */
  export const declinePushUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["declinePushUp"]
  > = AutoMovieMotionHumanActionRow.of("declinePushUp", workout, {
    kind: "declinePushUp",
  });

  /**
   * Dips, the bars not shown. Default 5 repetitions of 2.3 s after a 1 s entry;
   * provisional ({@link WorkoutBodyweight.KINDS}).
   */
  export const dip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sportGym"]["dip"]
  > = AutoMovieMotionHumanActionRow.of("dip", workout, {
    kind: "dip",
  });
}
