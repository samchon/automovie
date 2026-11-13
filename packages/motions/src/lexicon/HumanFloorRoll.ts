import { roll } from "../floor/roll";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Rolls on the floor, each a row of the roll law. Register the rows a film
 * uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the law it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a law (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the law.
 */
export namespace HumanFloorRoll {
  /** A forward roll: crouch, roll over the back forward, rise on the feet. */
  export const forwardRoll = HumanActionRow.of("forwardRoll", roll, {
    direction: "forward",
  });

  /** A backward roll: crouch, roll over the back backward, rise on the feet. */
  export const backwardRoll = HumanActionRow.of("backwardRoll", roll, {
    direction: "backward",
  });
}
