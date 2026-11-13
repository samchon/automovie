import { workout } from "../exercise/workout";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The gym's remaining movements under the names a programme uses, each a
 * row of the workout law with its kind fixed (`WorkoutGym`). A row leaves
 * open the count (`reps`), a held pose's `hold`, whether the body stays
 * on its support (`stay`), a bar's place and the manner.
 *
 * What a row shows and what its first pass leaves out is stated on its
 * kind: no load is held and no equipment is shown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what it leaves open and where its limits are stated.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a registered law (`HumanActionRow`), so it is data over a law that plans and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per exercise a programme names; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; the kind is the only value fixed.
 */
export namespace HumanSportGym {
  /** Bent-over rows, without the bar. */
  export const bentOverRow = HumanActionRow.of("bentOverRow", workout, {
    kind: "bentOverRow",
  });

  /** Curls, without the weight. */
  export const curl = HumanActionRow.of("curl", workout, {
    kind: "curl",
  });

  /** Overhead triceps extensions, without the weight. */
  export const tricepsExtension = HumanActionRow.of("tricepsExtension", workout, {
    kind: "tricepsExtension",
  });

  /** Lateral raises, without the weights. */
  export const lateralRaise = HumanActionRow.of("lateralRaise", workout, {
    kind: "lateralRaise",
  });

  /** Front raises, without the weights. */
  export const frontRaise = HumanActionRow.of("frontRaise", workout, {
    kind: "frontRaise",
  });

  /** Shrugs, without the weights. */
  export const shrug = HumanActionRow.of("shrug", workout, {
    kind: "shrug",
  });

  /** Calf raises. */
  export const calfRaise = HumanActionRow.of("calfRaise", workout, {
    kind: "calfRaise",
  });

  /** Front squats, without the bar. */
  export const frontSquat = HumanActionRow.of("frontSquat", workout, {
    kind: "frontSquat",
  });

  /** Goblet squats, without the bell. */
  export const gobletSquat = HumanActionRow.of("gobletSquat", workout, {
    kind: "gobletSquat",
  });

  /** Split squats. */
  export const splitSquat = HumanActionRow.of("splitSquat", workout, {
    kind: "splitSquat",
  });

  /** A wall sit, the wall not shown. */
  export const wallSit = HumanActionRow.of("wallSit", workout, {
    kind: "wallSit",
  });

  /** Romanian deadlifts, without the bar. */
  export const romanianDeadlift = HumanActionRow.of("romanianDeadlift", workout, {
    kind: "romanianDeadlift",
  });

  /** Good mornings, without the bar. */
  export const goodMorning = HumanActionRow.of("goodMorning", workout, {
    kind: "goodMorning",
  });

  /** A power clean as its positions, without the bar. */
  export const powerClean = HumanActionRow.of("powerClean", workout, {
    kind: "powerClean",
  });

  /** A snatch as its positions, without the bar. */
  export const snatch = HumanActionRow.of("snatch", workout, {
    kind: "snatch",
  });

  /** Pike push-ups. */
  export const pikePushUp = HumanActionRow.of("pikePushUp", workout, {
    kind: "pikePushUp",
  });

  /** Supermans. */
  export const superman = HumanActionRow.of("superman", workout, {
    kind: "superman",
  });

  /** Bird dogs. */
  export const birdDog = HumanActionRow.of("birdDog", workout, {
    kind: "birdDog",
  });

  /** Lying leg raises. */
  export const lyingLegRaise = HumanActionRow.of("lyingLegRaise", workout, {
    kind: "lyingLegRaise",
  });

  /** Bicycle crunches. */
  export const bicycleCrunch = HumanActionRow.of("bicycleCrunch", workout, {
    kind: "bicycleCrunch",
  });

  /** Russian twists. */
  export const russianTwist = HumanActionRow.of("russianTwist", workout, {
    kind: "russianTwist",
  });

  /** Dead bugs. */
  export const deadBug = HumanActionRow.of("deadBug", workout, {
    kind: "deadBug",
  });

  /** Dips, the bars not shown. */
  export const dip = HumanActionRow.of("dip", workout, {
    kind: "dip",
  });
}
