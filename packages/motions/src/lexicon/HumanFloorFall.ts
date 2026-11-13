import { dive } from "../floor/dive";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Falls onto the floor on purpose, each a row of the dive law. Register the
 * rows a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the law it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a law (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the law.
 */
export namespace HumanFloorFall {
  /** A goalkeeper's dive to the left: off the feet to the side, landing on the side with the hip and the lower hand on the floor. */
  export const goalkeeperDiveLeft = HumanActionRow.of("goalkeeperDiveLeft", dive, {
    kind: "dive",
    side: "left",
  });

  /** A goalkeeper's dive to the right. */
  export const goalkeeperDiveRight = HumanActionRow.of(
    "goalkeeperDiveRight",
    dive,
    { kind: "dive", side: "right" },
  );

  /** A sliding tackle: leaning back onto the hip and sliding forward with the lead leg reaching ahead. */
  export const slidingTackle = HumanActionRow.of("slidingTackle", dive, {
    kind: "slide",
  });
}
