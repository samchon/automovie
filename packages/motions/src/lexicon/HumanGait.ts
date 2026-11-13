import { run } from "../actions/run";
import { walk } from "../actions/walk";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Named ways of going somewhere on foot, each a row of `walk` or `run`
 * with its pace, stride and arm carriage fixed; the composition gives the
 * destination. The scales are provisional until each style's study is read
 * (the manner presets' issue lists them). Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanGait {
  /** A stroll: slow, the stride a little short, the arms easy. */
  export const stroll = HumanActionRow.of("stroll", walk, {
    pace: "slow",
    stride: 0.9,
    armSwing: 0.8,
  });

  /** A hurry: fast, the stride long, the arms driving. */
  export const hurry = HumanActionRow.of("hurry", walk, {
    pace: "fast",
    stride: 1.1,
    armSwing: 1.3,
  });

  /** A march: the long drill step with the arms swung high. */
  export const march = HumanActionRow.of("march", walk, {
    pace: "normal",
    stride: 1.1,
    armSwing: 1.8,
  });

  /** A sneak: slow short steps, the arms held still and close. */
  export const sneak = HumanActionRow.of("sneak", walk, {
    pace: "slow",
    stride: 0.7,
    armSwing: 0.1,
  });

  /** A weary trudge: slow, short, the arms barely swinging. */
  export const trudge = HumanActionRow.of("trudge", walk, {
    pace: "slow",
    stride: 0.8,
    armSwing: 0.4,
  });

  /** A swagger: the elbows out and the arms swung wide. */
  export const swagger = HumanActionRow.of("swagger", walk, {
    pace: "normal",
    armSwing: 1.5,
    elbows: 20,
  });

  /** A jog. */
  export const jog = HumanActionRow.of("jog", run, { pace: "jog" });

  /** A sprint. */
  export const sprint = HumanActionRow.of("sprint", run, { pace: "sprint" });
}
